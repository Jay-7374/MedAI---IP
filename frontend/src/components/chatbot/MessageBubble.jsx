import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { User, Bot, Copy, Check } from 'lucide-react';
import { useState } from 'react';

export default function MessageBubble({ message }) {
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
      gap: '1rem',
      padding: '1.5rem',
      backgroundColor: isUser ? 'transparent' : 'var(--card-bg)',
      borderBottom: '1px solid var(--card-border)'
    }}>
      <div style={{
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        backgroundColor: isUser ? 'var(--primary)' : 'var(--accent)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        {isUser ? <User size={18} color="white" /> : <Bot size={18} color="white" />}
      </div>
      
      <div style={{ flex: 1, overflow: 'hidden' }} className="markdown-body">
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
          {message.content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
