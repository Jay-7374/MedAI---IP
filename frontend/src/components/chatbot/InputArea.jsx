import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Mic, FileText, X, Square } from 'lucide-react';
import { apiFetch } from '../../apiClient';
import { SPEECH_LANGUAGE_MAP } from '../../utils/voice';

export default function InputArea({ onSendMessage, onStopGeneration, isStreaming, session, onDocumentUploaded, currentLanguage, setCurrentLanguage }) {
  const [content, setContent] = useState('');
  const [mode, setMode] = useState('General Assistant');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [content]);

  // STT session ownership tracking
  const currentSessionIdRef = useRef(session?.id);
  
  useEffect(() => {
    currentSessionIdRef.current = session?.id;
    
    // Auto-focus on New Chat
    if (session?.title === 'New Chat' && textareaRef.current) {
      textareaRef.current.focus();
    }

    // Abort STT on session switch
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.abort();
      setIsRecording(false);
    }
  }, [session?.id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim() || isStreaming) return;
    
    onSendMessage({ content, mode, language: currentLanguage }).catch(err => {
      console.error('Unhandled error in send message:', err);
    });
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

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0 && session) {
      const file = e.target.files[0];
      await uploadDocument(file);
      e.target.value = null; // reset input
    }
  };

  const uploadDocument = async (file) => {
    setIsUploading(true);
    setUploadError('');
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await apiFetch(`/api/chatbot/sessions/${session.id}/upload`, {
        method: 'POST',
        headers: {
          
          // Do NOT set Content-Type header when sending FormData; the browser sets it with the boundary!
        },
        body: formData
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Failed to upload document');
      }
      
      if (onDocumentUploaded) {
        onDocumentUploaded();
      }
    } catch (err) {
      console.error(err);
      setUploadError(err.message);
      setTimeout(() => setUploadError(''), 5000);
    } finally {
      setIsUploading(false);
    }
  };

  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      
      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript && currentSessionIdRef.current === session?.id) {
          setContent(prev => prev + (prev ? ' ' : '') + finalTranscript);
        }
        // Note: interim results could be shown as a placeholder if desired, but we'll stick to final for simplicity
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
        if (event.error !== 'aborted') {
          setUploadError(`Speech error: ${event.error}`);
          setTimeout(() => setUploadError(''), 5000);
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      setUploadError('Speech recognition not supported in this browser.');
      setTimeout(() => setUploadError(''), 5000);
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current.lang = SPEECH_LANGUAGE_MAP[currentLanguage] || 'en-US';
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0 && session && !isUploading && !isStreaming) {
      uploadDocument(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div 
      onDrop={handleDrop} 
      onDragOver={handleDragOver} 
      style={{ padding: '0.75rem', borderTop: '1px solid var(--card-border)', backgroundColor: 'var(--card-bg)' }}
    >
      <form onSubmit={handleSubmit} style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        
        {/* Settings Bar & Upload Status */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0', alignItems: 'center', flexWrap: 'wrap', padding: '0 0.25rem' }}>
          <select 
            value={mode} 
            onChange={e => setMode(e.target.value)}
            aria-label="Persona Selector"
            style={{ padding: '0.15rem 0.25rem', borderRadius: '4px', background: 'transparent', color: 'var(--text-secondary)', border: 'none', maxWidth: '140px', fontSize: '0.75rem', cursor: 'pointer', outline: 'none' }}
          >
            <option>General Assistant</option>
            <option>Symptom Checker</option>
            <option>Medicine Guide</option>
            <option>Post-Discharge Recovery</option>
          </select>
          <select 
            value={currentLanguage} 
            onChange={e => setCurrentLanguage(e.target.value)}
            aria-label="Language Selector"
            style={{ padding: '0.15rem 0.25rem', borderRadius: '4px', background: 'transparent', color: 'var(--text-secondary)', border: 'none', maxWidth: '100px', fontSize: '0.75rem', cursor: 'pointer', outline: 'none' }}
          >
            {Object.keys(SPEECH_LANGUAGE_MAP).map(lang => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
          
          {isUploading && <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Uploading document...</span>}
          {uploadError && <span style={{ fontSize: '0.75rem', color: 'var(--error)' }}>{uploadError}</span>}
          {isRecording && <span style={{ fontSize: '0.75rem', color: 'var(--error)', fontWeight: 'bold' }}>Recording...</span>}
        </div>

        {/* Input Box */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          backgroundColor: '#FFFFFF', 
          padding: '0.25rem 0.5rem', 
          borderRadius: '24px', 
          border: '1px solid var(--border)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          flexWrap: 'nowrap'
        }}>
          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()}
            disabled={!session || isStreaming || isUploading}
            aria-label="Attach document"
            style={{ background: 'none', border: 'none', padding: '0.5rem', color: 'var(--text-secondary)', cursor: 'pointer', flexShrink: 0 }}
          >
            <Paperclip size={20} />
          </button>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            onChange={handleFileChange}
            accept=".pdf,.docx,.txt"
          />
          
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isStreaming ? "Generating response..." : "Ask your medical question..."}
            disabled={!session || isStreaming}
            style={{ 
              flex: 1, 
              border: 'none', 
              background: 'transparent', 
              color: 'var(--text-main)', 
              resize: 'none', 
              minHeight: '24px',
              maxHeight: '120px',
              padding: '0.5rem 0',
              outline: 'none',
              fontFamily: 'inherit',
              minWidth: 0,
              fontSize: '0.95rem',
              lineHeight: '1.4'
            }}
            rows={1}
          />

          <button 
            type="button" 
            onClick={toggleRecording}
            disabled={!session || isStreaming}
            aria-label={isRecording ? "Stop voice input" : "Start voice input"}
            style={{ background: 'none', border: 'none', padding: '0.5rem', color: isRecording ? 'var(--error)' : 'var(--text-secondary)', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center' }}
          >
            <Mic size={18} />
          </button>

          {isStreaming ? (
            <button 
              type="button" 
              onClick={onStopGeneration}
              aria-label="Stop Generating"
              style={{ background: 'var(--error)', border: 'none', borderRadius: '8px', padding: '0.5rem', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            >
              <Square size={20} fill="currentColor" />
            </button>
          ) : (
            <button 
              type="submit"
              disabled={!session || !content.trim()}
              aria-label="Send message"
              style={{ 
                background: (!session || !content.trim()) ? 'var(--card-border)' : 'var(--primary)', 
                border: 'none', 
                borderRadius: '50%', 
                width: '32px',
                height: '32px',
                color: 'white', 
                cursor: (!session || !content.trim()) ? 'not-allowed' : 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                opacity: (!session || !content.trim()) ? 0.5 : 1,
                transition: 'background 0.2s ease',
                flexShrink: 0
              }}
            >
              <Send size={16} />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
