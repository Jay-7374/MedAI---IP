import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { User, Bot, Copy, Check, Play, Pause, Square } from 'lucide-react';
import { useState } from 'react';

export default function MessageBubble({ message, isActiveTts, ttsState, onPlay, onPause, onResume, onStop, onRetry }) {
  const isUser = message.role === 'user';
  
  const [copiedText, setCopiedText] = useState(null);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: isUser ? 'row-reverse' : 'row',
      alignItems: 'flex-start',
      gap: '0.75rem',
      padding: '0.5rem 1rem',
      maxWidth: '100%',
      width: '100%'
    }}>
      <div style={{
        width: '28px',
        height: '28px',
        borderRadius: '50%',
        backgroundColor: isUser ? 'var(--primary)' : '#e0f2ec',
        border: isUser ? 'none' : '1px solid var(--primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        marginTop: '0.25rem'
      }}>
        {isUser ? <span style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>U</span> : <Bot size={16} color="var(--primary)" />}
      </div>
      
      <div style={{ 
        flex: '0 1 auto',
        maxWidth: '85%', // Fallback for mobile, can be overridden by CSS if needed, but flex will handle it mostly. We use a media query in index.css if necessary, but 85% is fine for both here as it's just max.
        backgroundColor: isUser ? 'var(--primary-light)' : '#FCFBF7',
        border: isUser ? 'none' : '1px solid rgba(20, 134, 109, 0.15)',
        borderRadius: isUser ? '12px 12px 0 12px' : '12px 12px 12px 0',
        padding: '0.75rem 1rem',
        color: 'var(--text-main)',
        minWidth: 0,
        overflow: 'hidden'
      }} className="markdown-body bubble-content">
        {message.status === 'loading' ? (
          <div style={{ animation: 'pulse 1.5s infinite', letterSpacing: '2px', fontSize: '1.2rem', color: 'var(--text-secondary)' }} aria-live="polite">
            •••
            <span style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: 0 }}>Generating response</span>
          </div>
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                const codeText = String(children).replace(/\n$/, '');
                
                if (!inline && match) {
                  return (
                    <div style={{ position: 'relative', marginTop: '1rem', marginBottom: '1rem' }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        backgroundColor: '#1e1e1e',
                        padding: '0.25rem 1rem',
                        borderTopLeftRadius: '0.5rem',
                        borderTopRightRadius: '0.5rem',
                        fontSize: '0.75rem',
                        color: '#a0a0a0'
                      }}>
                        <span>{match[1]}</span>
                        <button
                          onClick={() => handleCopy(codeText)}
                          aria-label="Copy code"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#a0a0a0',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          {copiedText === codeText ? <Check size={14} /> : <Copy size={14} />}
                          {copiedText === codeText ? 'Copied!' : 'Copy code'}
                        </button>
                      </div>
                      <SyntaxHighlighter
                        style={vscDarkPlus}
                        language={match[1]}
                        PreTag="div"
                        customStyle={{ margin: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}
                        {...props}
                      >
                        {codeText}
                      </SyntaxHighlighter>
                    </div>
                  );
                }
                return (
                  <code className={className} style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.4rem', borderRadius: '4px' }} {...props}>
                    {children}
                  </code>
                );
              }
            }}
          >
            {typeof message.content === 'string' ? message.content : ''}
          </ReactMarkdown>
        )}

        {message.status === 'failed' && (
          <div style={{ marginTop: '0.5rem', color: 'var(--error)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontWeight: 'bold' }}>Error:</span> {message.errorText || "Unable to generate a response right now. Please try again."}
          </div>
        )}

        {!isUser && (
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
            {!(message.status === 'failed' && !message.content) && (
              <button
                onClick={() => {
                  if (isActiveTts && (ttsState === 'playing' || ttsState === 'paused')) {
                    onStop();
                  } else {
                    onPlay();
                  }
                }}
                aria-label={(isActiveTts && (ttsState === 'playing' || ttsState === 'paused')) ? 'Stop Audio' : 'Play Audio'}
                style={{
                  background: 'none',
                  border: '1px solid var(--card-border)',
                  borderRadius: '4px',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '0.25rem 0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontSize: '0.85rem'
                }}
              >
                {(isActiveTts && (ttsState === 'playing' || ttsState === 'paused')) ? <Square size={14} /> : <Play size={14} />}
                {(isActiveTts && (ttsState === 'playing' || ttsState === 'paused')) ? 'Stop' : 'Play Audio'}
              </button>
            )}
            
            {(isActiveTts && (ttsState === 'playing' || ttsState === 'paused')) && !(message.status === 'failed' && !message.content) && (
              <button
                onClick={() => {
                  if (ttsState === 'playing') {
                    onPause();
                  } else {
                    onResume();
                  }
                }}
                aria-label={ttsState === 'playing' ? 'Pause Audio' : 'Resume Audio'}
                style={{
                  background: 'none',
                  border: '1px solid var(--card-border)',
                  borderRadius: '4px',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '0.25rem 0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontSize: '0.85rem'
                }}
              >
                {ttsState === 'playing' ? <Pause size={14} /> : <Play size={14} />}
                {ttsState === 'playing' ? 'Pause' : 'Resume'}
              </button>
            )}

            {message.status === 'failed' && (
              <button
                onClick={onRetry}
                aria-label="Retry generating message"
                style={{
                  background: 'none',
                  border: '1px solid var(--error)',
                  borderRadius: '4px',
                  color: 'var(--error)',
                  cursor: 'pointer',
                  padding: '0.25rem 0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontSize: '0.85rem'
                }}
              >
                Retry
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
