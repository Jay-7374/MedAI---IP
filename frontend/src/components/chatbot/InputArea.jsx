import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Mic, FileText, X } from 'lucide-react';

export default function InputArea({ onSendMessage, isStreaming }) {
  const [content, setContent] = useState('');
  const [mode, setMode] = useState('General Assistant');
  const [language, setLanguage] = useState('English');
  const [files, setFiles] = useState([]);
  const textareaRef = useRef(null);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [content]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if ((!content.trim() && files.length === 0) || isStreaming) return;
    
    // In Phase 4 we will handle files. For now just text.
    onSendMessage({ content, mode, language });
    setContent('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div style={{ padding: '1.5rem', borderTop: '1px solid var(--card-border)', backgroundColor: 'var(--bg-main)' }}>
      <form onSubmit={handleSubmit} style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        
        {/* Settings Bar */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
          <select 
            value={mode} 
            onChange={e => setMode(e.target.value)}
            style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', background: 'var(--sidebar-bg)', color: 'var(--text-main)', border: '1px solid var(--card-border)' }}
          >
            <option>General Assistant</option>
            <option>Symptom Checker</option>
            <option>Medicine Guide</option>
            <option>Post-Discharge Recovery</option>
          </select>
          <select 
            value={language} 
            onChange={e => setLanguage(e.target.value)}
            style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', background: 'var(--sidebar-bg)', color: 'var(--text-main)', border: '1px solid var(--card-border)' }}
          >
            <option>English</option>
            <option>Spanish</option>
            <option>French</option>
            <option>Hindi</option>
          </select>
        </div>

        {/* Input Box */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'flex-end', 
          gap: '0.5rem', 
          backgroundColor: 'var(--card-bg)', 
          borderRadius: '12px', 
          border: '1px solid var(--card-border)',
          padding: '0.5rem 1rem'
        }}>
          <button type="button" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.5rem' }}>
            <Paperclip size={20} />
          </button>
          
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your medical query here..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: 'var(--text-main)',
              resize: 'none',
              minHeight: '24px',
              maxHeight: '200px',
              padding: '0.5rem 0',
              fontFamily: 'inherit',
              outline: 'none'
            }}
          />
          
          <button type="button" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.5rem' }}>
            <Mic size={20} />
          </button>
          
          <button 
            type="submit" 
            disabled={(!content.trim() && files.length === 0) || isStreaming}
            style={{ 
              background: (!content.trim() && files.length === 0) || isStreaming ? 'var(--card-border)' : 'var(--primary)', 
              border: 'none', 
              color: 'white', 
              cursor: (!content.trim() && files.length === 0) || isStreaming ? 'not-allowed' : 'pointer', 
              padding: '0.5rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s'
            }}
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}
