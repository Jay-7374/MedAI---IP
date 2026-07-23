import React, { useState, useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import InputArea from './InputArea';
import { apiFetch } from '../../apiClient';
import { getBestVoice, SPEECH_LANGUAGE_MAP } from '../../utils/voice';
import { ArrowDown, Menu } from 'lucide-react';

export default function ChatWindow({ session, setSession, onOpenSidebar }) {
  const [messages, setMessages] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [streamingSessions, setStreamingSessions] = useState({});
  const [autoSpeak, setAutoSpeak] = useState(false);
  
  // Centralized TTS state
  const [ttsState, setTtsState] = useState('idle'); // 'idle', 'playing', 'paused'
  const [activeTtsId, setActiveTtsId] = useState(null);
  const [ttsError, setTtsError] = useState('');
  const [currentLanguage, setCurrentLanguage] = useState('English');
  
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  
  // Per-Session Generation Ownership
  const activeGenerationsRef = useRef(new Map());

  // Scroll Intent tracking
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);
  const previousScrollTopRef = useRef(0);
  const isProgrammaticScrollRef = useRef(false);

  // Clean up all active generations on unmount
  useEffect(() => {
    return () => {
      activeGenerationsRef.current.forEach((gen) => {
        gen.controller.abort();
        if (gen.reader) gen.reader.cancel().catch(() => {});
      });
      activeGenerationsRef.current.clear();
      window.speechSynthesis.cancel(); // TTS Cleanup on unmount
    };
  }, []);

  useEffect(() => {
    // Stop speech when switching sessions
    window.speechSynthesis.cancel();
    setActiveTtsId(null);
    setTtsState('idle');

    setIsUserScrolledUp(false);
    previousScrollTopRef.current = 0;

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
      scrollToBottom('auto');
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
    if (!session) return;
    try {
      await apiFetch(`/api/chatbot/sessions/${session.id}/documents/${docId}`, {
        method: 'DELETE',
        headers: { 'X-User-Id': '1' }
      });
      loadDocuments(session.id);
      loadMessages(session.id); // Reload to show system message
    } catch (err) {
      console.error('Failed to delete document:', err);
    }
  };

  const scrollToBottom = (behavior = 'smooth') => {
    if (messagesEndRef.current) {
      isProgrammaticScrollRef.current = true;
      messagesEndRef.current.scrollIntoView({ behavior });
      // Reset programmatic flag shortly after browser processes scroll
      setTimeout(() => { isProgrammaticScrollRef.current = false; }, 100);
    }
  };

  const currentSessionId = session?.id;
  const isCurrentSessionStreaming = currentSessionId ? !!streamingSessions[currentSessionId] : false;

  useEffect(() => {
    if (!isUserScrolledUp) {
      scrollToBottom(isCurrentSessionStreaming ? 'auto' : 'smooth');
    }
  }, [messages, isUserScrolledUp, isCurrentSessionStreaming]);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    
    // Ignore programmatic scrolls for intent detection
    if (isProgrammaticScrollRef.current) {
      previousScrollTopRef.current = scrollTop;
      return;
    }

    const isNearBottom = scrollHeight - scrollTop - clientHeight < 10;
    
    // Did the user scroll upward?
    if (scrollTop < previousScrollTopRef.current - 10) {
      // User explicitly scrolled upward
      setIsUserScrolledUp(true);
    } else if (isNearBottom) {
      // User deliberately returned to the actual bottom
      setIsUserScrolledUp(false);
    }
    
    previousScrollTopRef.current = scrollTop;
  };

  useEffect(() => {
    // Prime the voices
    window.speechSynthesis.getVoices();
    const handleVoicesChanged = () => {
      window.speechSynthesis.getVoices();
    };
    window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
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

  const handlePauseMessage = () => window.speechSynthesis.pause();
  const handleResumeMessage = () => window.speechSynthesis.resume();
  
  const handleStopMessage = () => {
    window.speechSynthesis.cancel();
    setActiveTtsId(null);
    setTtsState('idle');
  };

  const handleStopGeneration = () => {
    if (!session) return;
    const currentSessionId = session.id;
    const gen = activeGenerationsRef.current.get(currentSessionId);
    if (gen) {
      gen.controller.abort();
      if (gen.reader) {
        gen.reader.cancel().catch(() => {});
      }
      if (gen.frameId) {
        cancelAnimationFrame(gen.frameId);
      }
      activeGenerationsRef.current.delete(currentSessionId);
    }
    setStreamingSessions(prev => ({ ...prev, [currentSessionId]: false }));
    handleStopMessage();
  };

  // Shared reusable streaming loop for progressive React rendering
  const consumeAssistantStream = async ({ response, assistantId, reqId, sessionId }) => {
    const reader = response.body.getReader();
    
    // Store reader for cancellation
    const gen = activeGenerationsRef.current.get(sessionId);
    if (gen && gen.requestId === reqId) {
      gen.reader = reader;
    }
    
    const decoder = new TextDecoder('utf-8');
    let done = false;
    let buffer = '';
    let accumulatedContent = "";
    let renderScheduled = false;

    // Helper to safely schedule ONE render per animation frame
    const scheduleRender = () => {
      if (renderScheduled) return;
      renderScheduled = true;
      const frameId = requestAnimationFrame(() => {
        renderScheduled = false;
        
        // OWNERSHIP CHECK
        const gen = activeGenerationsRef.current.get(sessionId);
        if (!gen || gen.requestId !== reqId) return;
        if (gen.controller.signal.aborted) return;

        const snapshot = accumulatedContent;
        setMessages(prev => prev.map(msg => 
          msg.id === assistantId ? { ...msg, content: snapshot, status: 'generating' } : msg
        ));
      });
      
      const gen = activeGenerationsRef.current.get(sessionId);
      if (gen) {
        gen.frameId = frameId;
      }
    };

    let finalError = null;

    try {
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          buffer += decoder.decode(value, { stream: true });
          
          let boundaryIndex;
          while ((boundaryIndex = buffer.indexOf('\n\n')) !== -1) {
            const rawEvent = buffer.slice(0, boundaryIndex);
            buffer = buffer.slice(boundaryIndex + 2);
            
            const dataLines = rawEvent.split('\n').filter(line => line.startsWith('data: '));
            for (const line of dataLines) {
              if (line.startsWith('data: [DONE]')) continue;
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.error) {
                  const errMsg = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
                  finalError = errMsg;
                  continue;
                }
                
                if (typeof data.content === 'string') {
                  accumulatedContent += data.content;
                  scheduleRender();
                }
              } catch (e) {
                // Ignore parse errors for partial/invalid json
              }
            }
            // Yield to browser paint
            await new Promise(resolve => requestAnimationFrame(() => resolve()));
          }
        }
      }

      // Stream fully done, perform one final synchronous update
      const gen = activeGenerationsRef.current.get(sessionId);
      if (!gen || gen.requestId !== reqId || gen.controller.signal.aborted) {
        // We've switched away, stopped, or been superseded, do not mutate UI
        return accumulatedContent;
      }

      if (finalError) {
        setMessages(prev => prev.map(msg => 
          msg.id === assistantId ? { ...msg, status: 'failed', errorText: finalError } : msg
        ));
      } else {
        setMessages(prev => prev.map(msg => 
          msg.id === assistantId ? { ...msg, content: accumulatedContent, status: 'completed' } : msg
        ));
      }

      return accumulatedContent;

    } catch (err) {
      if (err.name === 'AbortError') {
        const gen = activeGenerationsRef.current.get(sessionId);
        // It could have been deleted during manual stop
        // Wait, if it was manually stopped, we STILL want to mutate the UI to finalize it!
        // Actually, manual stop already clears the gen from map, so if it's missing, it WAS manually stopped,
        // or if it's still there but different, it was superseded.
        if (gen && gen.requestId !== reqId) {
           return accumulatedContent;
        }

        // User intentionally stopped THIS generation in THIS session (even if we are viewing another session)
        setMessages(prev => {
           const newMessages = [...prev];
           const lastMsgIndex = newMessages.length - 1;
           if (newMessages[lastMsgIndex]?.role === 'assistant') {
             if (newMessages[lastMsgIndex].content.trim() === '') {
                // Remove the empty/loading assistant message completely
                return newMessages.slice(0, lastMsgIndex);
             } else {
                // Keep partial, set to completed
                newMessages[lastMsgIndex] = {
                  ...newMessages[lastMsgIndex],
                  status: 'completed'
                };
             }
           }
           return newMessages;
        });
        return accumulatedContent;
      }
      throw err;
    }
  };

  const startGeneration = (reqId, sessionId) => {
    // Abort existing FOR THIS SESSION
    const existing = activeGenerationsRef.current.get(sessionId);
    if (existing?.controller) {
      existing.controller.abort();
      if (existing.reader) existing.reader.cancel().catch(() => {});
    }
    const controller = new AbortController();
    activeGenerationsRef.current.set(sessionId, { requestId: reqId, controller, reader: null, frameId: null });
    setStreamingSessions(prev => ({ ...prev, [sessionId]: true }));
    setIsUserScrolledUp(false);
    return controller;
  };

  const endGeneration = (reqId, sessionId) => {
    const gen = activeGenerationsRef.current.get(sessionId);
    if (gen && gen.requestId === reqId) {
      activeGenerationsRef.current.delete(sessionId);
      setStreamingSessions(prev => ({ ...prev, [sessionId]: false }));
    }
  };

  const handleSendMessage = async ({ content, mode, language }) => {
    if (!session) return;
    
    // Setup ownership
    const reqId = crypto.randomUUID();
    const currentSessionId = session.id;
    const controller = startGeneration(reqId, currentSessionId);
    
    // Optimistically add user message and loading assistant stub
    const userMsg = { id: Date.now().toString(), role: 'user', content };
    const assistantId = (Date.now() + 1).toString();
    const assistantMsg = { id: assistantId, role: 'assistant', content: '', status: 'loading' };
    
    setMessages(prev => [...prev, userMsg, assistantMsg]);

    try {
      const response = await apiFetch(`/api/chatbot/sessions/${currentSessionId}/chat`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': '1' 
        },
        body: JSON.stringify({
          role: 'user',
          content: content,
          mode: mode,
          language: language
        })
      });

      if (!response.ok) {
        let errorString = 'Network or server error. Please check your connection.';
        try {
          const errorData = await response.json();
          if (errorData.detail) {
             errorString = Array.isArray(errorData.detail) ? errorData.detail.map(e => e.msg).join(", ") : (typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail));
          } else if (errorData.error) {
             errorString = typeof errorData.error === 'string' ? errorData.error : JSON.stringify(errorData.error);
          }
        } catch (e) { }
        const error = new Error(errorString);
        error.isValidationError = true;
        throw error;
      }

      const fullAssistantResponse = await consumeAssistantStream({ 
        response, 
        assistantId, 
        reqId, 
        sessionId: currentSessionId 
      });

      const finalGen = activeGenerationsRef.current.get(currentSessionId);
      if (finalGen && finalGen.requestId === reqId && autoSpeak && fullAssistantResponse.trim()) {
        handlePlayMessage(assistantId, fullAssistantResponse, language);
      }

    } catch (err) {
      if (err.name === 'AbortError') return; // Handled in stream or ignored
      console.error('Chat error:', err);
      
      const gen = activeGenerationsRef.current.get(currentSessionId);
      if (!gen || gen.requestId !== reqId) return;

      if (err.isValidationError) {
        setMessages(prev => prev.filter(m => m.id !== assistantId && m.id !== userMsg.id));
        alert(err.message || 'Message rejected.');
      } else {
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMsgIndex = newMessages.length - 1;
          if (newMessages[lastMsgIndex]?.role === 'assistant') {
            newMessages[lastMsgIndex] = {
              ...newMessages[lastMsgIndex],
              status: 'failed',
              errorText: err.message || 'Network or server error. Please check your connection.'
            };
          }
          return newMessages;
        });
      }
    } finally {
      endGeneration(reqId, currentSessionId);
    }
  };

  const handleRetryMessage = async (assistantMsgId) => {
    if (!session) return;
    
    const reqId = crypto.randomUUID();
    const currentSessionId = session.id;
    const controller = startGeneration(reqId, currentSessionId);
    const newAssistantId = Date.now().toString();

    setMessages(prev => {
      const filtered = prev.filter(m => m.id !== assistantMsgId);
      return [...filtered, { id: newAssistantId, role: 'assistant', content: '', status: 'loading' }];
    });
    
    try {
      const response = await apiFetch(`/api/chatbot/sessions/${currentSessionId}/chat/retry`, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json', 'X-User-Id': '1' }
      });

      if (!response.ok) throw new Error('Streaming request failed');

      const fullAssistantResponse = await consumeAssistantStream({ 
        response, 
        assistantId: newAssistantId, 
        reqId, 
        sessionId: currentSessionId 
      });

      const finalGen = activeGenerationsRef.current.get(currentSessionId);
      if (finalGen && finalGen.requestId === reqId && autoSpeak && fullAssistantResponse.trim()) {
        handlePlayMessage(newAssistantId, fullAssistantResponse, currentLanguage);
      }

    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('Chat error:', err);
      const gen = activeGenerationsRef.current.get(currentSessionId);
      if (!gen || gen.requestId !== reqId) return;

      setMessages(prev => {
        const newMessages = [...prev];
        const lastMsgIndex = newMessages.length - 1;
        if (newMessages[lastMsgIndex].role === 'assistant') {
          newMessages[lastMsgIndex] = {
            ...newMessages[lastMsgIndex],
            status: 'failed',
            errorText: 'Network or server error. Please check your connection.'
          };
        }
        return newMessages;
      });
    } finally {
      endGeneration(reqId, currentSessionId);
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
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--bg-main)' }}>
      {/* Header */}
      <div style={{ 
        padding: '1rem', 
        borderBottom: '1px solid var(--card-border)', 
        backgroundColor: 'var(--card-bg)',
        display: 'flex', 
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            className="btn-mobile-menu" 
            onClick={onOpenSidebar}
            aria-label="Open chat history"
            aria-expanded="false"
            aria-controls="sidebar-drawer"
            style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}
          >
            <Menu size={24} />
          </button>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)', fontWeight: 600 }}>
            {session ? session.title : 'MedAI Assistant'}
          </h2>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
          {ttsError && <span style={{ color: 'var(--error)', marginRight: '1rem', fontSize: '0.85rem' }}>{ttsError}</span>}
          <input 
            type="checkbox" 
            checked={autoSpeak} 
            onChange={(e) => {
              setAutoSpeak(e.target.checked);
              if (!e.target.checked) handleStopMessage();
            }} 
          />
          Auto-Speak Responses
        </label>
      </div>
      
      {/* Document Panel */}
      {documents.length > 0 && (
        <div style={{ flexShrink: 0, padding: '0.5rem 1.5rem', backgroundColor: 'var(--sidebar-bg)', borderBottom: '1px solid var(--card-border)', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {documents.map(doc => (
            <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.5rem', background: 'var(--card-bg)', borderRadius: '4px', fontSize: '0.85rem', border: '1px solid var(--card-border)' }}>
              <span>📄 {doc.filename}</span>
              <button onClick={() => handleDeleteDocument(doc.id)} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: '0 2px' }}>&times;</button>
            </div>
          ))}
        </div>
      )}

      {/* Messages */}
      <div 
        style={{ flex: 1, overflowY: 'auto', padding: '1rem 0' }}
        onScroll={handleScroll}
        ref={scrollContainerRef}
      >
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
              onRetry={() => handleRetryMessage(msg.id)}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {isUserScrolledUp && (
        <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'center', marginTop: '-20px', position: 'relative', zIndex: 10, height: 0, overflow: 'visible' }}>
          <button 
            onClick={() => { setIsUserScrolledUp(false); scrollToBottom('smooth'); }}
            style={{ transform: 'translateY(-20px)', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}
            title="Jump to latest"
            aria-label="Jump to latest"
          >
            <ArrowDown size={18} />
          </button>
        </div>
      )}

      {/* Input */}
      <div style={{ flexShrink: 0, borderTop: '1px solid var(--card-border)' }}>
        <InputArea 
          session={session}
          onSendMessage={handleSendMessage} 
          onStopGeneration={handleStopGeneration}
          isStreaming={isCurrentSessionStreaming} 
          isUploading={false}
          onDocumentUploaded={() => { loadDocuments(session?.id); loadMessages(session?.id); }} 
          currentLanguage={currentLanguage}
          setCurrentLanguage={setCurrentLanguage}
        />
      </div>
    </div>
  );
}
