import React, { useState, useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import InputArea from './InputArea';
import { apiFetch } from '../../apiClient';

export default function ChatWindow({ session, setSession }) {
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (session) {
      loadMessages(session.id);
    } else {
      setMessages([]);
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async ({ content, mode, language }) => {
    if (!session) return;
    
    // Optimistically add user message
    const userMsg = { id: Date.now().toString(), role: 'user', content };
    setMessages(prev => [...prev, userMsg]);
    setIsStreaming(true);

    // Prepare assistant message stub
    const assistantMsg = { id: (Date.now() + 1).toString(), role: 'assistant', content: '' };
    setMessages(prev => [...prev, assistantMsg]);

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
      </div>
      
      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 0' }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '4rem' }}>
            <h2>How can I help you today?</h2>
            <p>I am your AI Medical Assistant.</p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <MessageBubble key={msg.id || i} message={msg} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <InputArea onSendMessage={handleSendMessage} isStreaming={isStreaming} />
    </div>
  );
}
