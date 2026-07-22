import React, { useState, useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import InputArea from './InputArea';
import { apiFetch } from '../../apiClient';
import { getBestVoice, SPEECH_LANGUAGE_MAP } from '../../utils/voice';

export default function ChatWindow({ session, setSession }) {
  const [messages, setMessages] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  
  // Centralized TTS state
  const [ttsState, setTtsState] = useState('idle'); // 'idle', 'playing', 'paused'
  const [activeTtsId, setActiveTtsId] = useState(null);
  const [ttsError, setTtsError] = useState('');
  const [currentLanguage, setCurrentLanguage] = useState('English');
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Stop speech when switching sessions
    window.speechSynthesis.cancel();
    setActiveTtsId(null);
    setTtsState('idle');

    if (session) {
      loadMessages(session.id);
      loadDocuments(session.id);
    } else {
      setMessages([]);
      setDocuments([]);
    }
  }, [session]);

  const loadMessages = async (sessionId) => {
    try {
      const res = await apiFetch(`/api/chatbot/sessions/${sessionId}/messages`);
      const data = await res.json();
      setMessages(data);
      scrollToBottom();
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  const loadDocuments = async (sessionId) => {
    try {
      const res = await apiFetch(`/api/chatbot/sessions/${sessionId}/documents`);
      const data = await res.json();
      setDocuments(data);
    } catch (err) {
      console.error('Failed to load documents:', err);
    }
  };

  const handleDeleteDocument = async (docId) => {
    try {
      await apiFetch(`/api/chatbot/sessions/${session.id}/documents/${docId}`, {
        method: 'DELETE',
        headers: {
          'X-User-Id': '1'
        }
      });
      loadDocuments(session.id);
      loadMessages(session.id); // Reload to show system message
    } catch (err) {
      console.error('Failed to delete document:', err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Prime the voices
    window.speechSynthesis.getVoices();
    const handleVoicesChanged = () => {
      window.speechSynthesis.getVoices();
    };
    window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      window.speechSynthesis.cancel();
    };
  }, []);

  // Safe TTS control functions
  const handlePlayMessage = (messageId, text, language) => {
    if (!window.speechSynthesis) {
      setTtsError('Text-to-speech is not available in this browser.');
      setTimeout(() => setTtsError(''), 5000);
      return;
    }
    window.speechSynthesis.cancel(); // Stop any overlapping speech

    const utterance = new SpeechSynthesisUtterance(text);
    
    if (language && getBestVoice(language)) {
       const voice = getBestVoice(language);
       utterance.voice = voice;
       utterance.lang = voice.lang;
    } else if (language) {
       // Just set the lang hint and let the browser figure it out (this restores previous behavior)
       utterance.lang = SPEECH_LANGUAGE_MAP[language] || 'en-US';
    }

    utterance.onstart = () => {
      setActiveTtsId(messageId);
      setTtsState('playing');
    };
    utterance.onpause = () => setTtsState('paused');
    utterance.onresume = () => setTtsState('playing');
    utterance.onend = () => {
      setActiveTtsId(null);
      setTtsState('idle');
    };
    utterance.onerror = (e) => {
      console.error('Speech error:', e);
      setActiveTtsId(null);
      setTtsState('idle');
    };

    window.speechSynthesis.speak(utterance);
  };

  const handlePauseMessage = () => {
    window.speechSynthesis.pause();
  };

  const handleResumeMessage = () => {
    window.speechSynthesis.resume();
  };

  const handleStopMessage = () => {
    window.speechSynthesis.cancel();
    setActiveTtsId(null);
    setTtsState('idle');
  };

  const handleSendMessage = async ({ content, mode, language }) => {
    if (!session) return;
    
    // Optimistically add user message
    const userMsg = { id: Date.now().toString(), role: 'user', content };
    setMessages(prev => [...prev, userMsg]);
    setIsStreaming(true);

    // Prepare assistant message stub
    const assistantId = (Date.now() + 1).toString();
    const assistantMsg = { id: assistantId, role: 'assistant', content: '' };
    setMessages(prev => [...prev, assistantMsg]);

    let fullAssistantResponse = "";

    try {
      const response = await apiFetch(`/api/chatbot/sessions/${session.id}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': '1' // Temporary fallback mapping to existing appointments convention
        },
        body: JSON.stringify({
          role: 'user',
          content: content,
          mode: mode,
          language: language
        })
      });

      if (!response.ok) {
        throw new Error('Streaming request failed');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ') && !line.startsWith('data: [DONE]')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content) {
                  fullAssistantResponse += data.content;
                  setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMsgIndex = newMessages.length - 1;
                    const lastMsg = newMessages[lastMsgIndex];
                    if (lastMsg.role === 'assistant') {
                      newMessages[lastMsgIndex] = {
                        ...lastMsg,
                        content: lastMsg.content + data.content
                      };
                    }
                    return newMessages;
                  });
                }
              } catch (e) {
                // Ignore parse errors on split chunks
              }
            }
          }
        }
      }

      if (autoSpeak) {
        handlePlayMessage(assistantId, fullAssistantResponse, language);
      }

    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setIsStreaming(false);
    }
  };

  if (!session) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
        Select or create a chat session to begin.
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>{session.title}</h3>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
          {ttsError && <span style={{ color: 'var(--error)', marginRight: '1rem', fontSize: '0.85rem' }}>{ttsError}</span>}
          <input 
            type="checkbox" 
            checked={autoSpeak} 
            onChange={(e) => {
              setAutoSpeak(e.target.checked);
              if (!e.target.checked) {
                window.speechSynthesis.cancel();
                setActiveTtsId(null);
                setTtsState('idle');
              }
            }} 
          />
          Auto-Speak Responses
        </label>
      </div>
      
      {/* Document Panel */}
      {documents.length > 0 && (
        <div style={{ padding: '0.5rem 1.5rem', backgroundColor: 'var(--sidebar-bg)', borderBottom: '1px solid var(--card-border)', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {documents.map(doc => (
            <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.5rem', background: 'var(--card-bg)', borderRadius: '4px', fontSize: '0.85rem', border: '1px solid var(--card-border)' }}>
              <span>📄 {doc.filename}</span>
              <button onClick={() => handleDeleteDocument(doc.id)} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: '0 2px' }}>&times;</button>
            </div>
          ))}
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 0' }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '4rem' }}>
            <h2>How can I help you today?</h2>
            <p>I am your AI Medical Assistant.</p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <MessageBubble 
              key={msg.id || i} 
              message={msg} 
              isActiveTts={activeTtsId === msg.id}
              ttsState={ttsState}
              onPlay={() => handlePlayMessage(msg.id, msg.content, msg.language || currentLanguage)} 
              onPause={handlePauseMessage}
              onResume={handleResumeMessage}
              onStop={handleStopMessage}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <InputArea 
        onSendMessage={handleSendMessage} 
        isStreaming={isStreaming} 
        session={session} 
        onDocumentUploaded={() => { loadDocuments(session.id); loadMessages(session.id); }} 
        currentLanguage={currentLanguage}
        setCurrentLanguage={setCurrentLanguage}
      />
    </div>
  );
}
