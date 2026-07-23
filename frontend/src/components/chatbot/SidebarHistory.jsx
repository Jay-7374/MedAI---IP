import React, { useState, useEffect } from 'react';
import { Plus, MessageSquare, Trash2 } from 'lucide-react';
import { apiFetch } from '../../apiClient';

export default function SidebarHistory({ activeSession, setActiveSession, sessions, setSessions, loadSessions, isOpen, onClose }) {
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    // Prevent background scrolling when open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleCreateSession = async () => {
    try {
      const res = await apiFetch('/api/chatbot/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Chat', language: 'English', mode: 'General Assistant' })
      });
      if (!res.ok) throw new Error('Failed to create session');
      const newSession = await res.json();
      setSessions([newSession, ...sessions]);
      setActiveSession(newSession);
      if (window.innerWidth <= 768) onClose();
    } catch (err) {
      console.error('Failed to create session', err);
    }
  };

  const handleDeleteSession = async (e, id) => {
    e.stopPropagation();
    try {
      await apiFetch(`/api/chatbot/sessions/${id}`, { method: 'DELETE' });
      setSessions(prev => prev.filter(s => s.id !== id));
      if (activeSession?.id === id) {
        setActiveSession(null);
      }
    } catch (err) {
      console.error('Failed to delete session', err);
    }
  };

  return (
    <>
      {isOpen && (
        <div className="chatbot-sidebar-backdrop" onClick={onClose} aria-hidden="true" />
      )}
      <div className={`chatbot-sidebar ${isOpen ? 'mobile-open' : ''}`}>
        <div style={{ padding: '1rem' }}>
          <button 
            onClick={handleCreateSession}
            aria-label="New Chat"
            style={{ 
              width: '100%', 
            padding: '0.75rem', 
            borderRadius: '8px', 
            border: '1px solid var(--card-border)', 
            backgroundColor: 'var(--card-bg)', 
            color: 'var(--text-main)', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            cursor: 'pointer'
          }}
        >
          <Plus size={18} /> New Chat
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 0.5rem' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', padding: '0.5rem', fontWeight: 600, textTransform: 'uppercase' }}>
          Recent Chats
        </div>
        {sessions.map(session => (
          <div 
            key={session.id}
            onClick={() => {
              setActiveSession(session);
              if (window.innerWidth <= 768) onClose();
            }}
            style={{ 
              padding: '0.75rem', 
              borderRadius: '8px', 
              marginBottom: '0.25rem',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              cursor: 'pointer',
              backgroundColor: activeSession?.id === session.id ? 'var(--card-border)' : 'transparent',
              color: 'var(--text-main)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
              <MessageSquare size={18} color="var(--text-secondary)" />
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.9rem' }}>
                {session.title}
              </span>
            </div>
            <button 
              onClick={(e) => handleDeleteSession(e, session.id)}
              aria-label="Delete Session"
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
    </>
  );
}
