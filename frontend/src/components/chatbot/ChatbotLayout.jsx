import React, { useState, useEffect } from 'react';
import SidebarHistory from './SidebarHistory';
import ChatWindow from './ChatWindow';
import { apiFetch } from '../../apiClient';

export default function ChatbotLayout({ isIntegrated = false }) {
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const res = await apiFetch('/api/chatbot/sessions');
      if (!res.ok) {
        const contentType = res.headers.get('content-type');
        let errorMessage = `Request failed (${res.status})`;
        if (contentType?.includes('application/json')) {
          try {
            const errorData = await res.json();
            errorMessage = typeof errorData.detail === 'string' ? errorData.detail : errorMessage;
          } catch (e) {
            // Ignore parse errors on fallback
          }
        }
        throw new Error(errorMessage);
      }
      const data = await res.json();
      setSessions(data);
      if (data.length > 0) {
        setActiveSession(data[0]);
      }
    } catch (err) {
      console.error('Failed to load sessions:', err);
    }
  };

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
      if (window.innerWidth <= 768) setIsMobileSidebarOpen(false);
    } catch (err) {
      console.error('Failed to create session', err);
    }
  };


  return (
    <div style={{ 
      display: 'flex', 
      height: isIntegrated ? '100%' : '100vh', 
      width: isIntegrated ? '100%' : '100vw',
      flex: isIntegrated ? 1 : 'unset',
      overflow: 'hidden',
      minHeight: 0,
      minWidth: 0,
      backgroundColor: 'var(--bg-main)', 
      color: 'var(--text-main)', 
      fontFamily: 'var(--font-family, system-ui)', 
      position: 'relative' 
    }}>
      <SidebarHistory 
        sessions={sessions} 
        setSessions={setSessions} 
        activeSession={activeSession} 
        setActiveSession={setActiveSession}
        loadSessions={loadSessions}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        isIntegrated={isIntegrated}
        onCreateSession={handleCreateSession}
      />
      <ChatWindow 
        session={activeSession}
        setSession={setActiveSession}
        onOpenSidebar={() => setIsMobileSidebarOpen(true)}
        isIntegrated={isIntegrated}
        onCreateSession={handleCreateSession}
      />
    </div>
  );
}
