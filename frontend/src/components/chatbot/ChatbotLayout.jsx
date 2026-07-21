import React, { useState, useEffect } from 'react';
import SidebarHistory from './SidebarHistory';
import ChatWindow from './ChatWindow';
import { apiFetch } from '../../apiClient';

export default function ChatbotLayout() {
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const res = await apiFetch('/api/chatbot/sessions');
      const data = await res.json();
      setSessions(data);
      if (data.length > 0) {
        setActiveSession(data[0]);
      }
    } catch (err) {
      console.error('Failed to load sessions:', err);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontFamily: 'var(--font-family, system-ui)' }}>
      <SidebarHistory 
        sessions={sessions} 
        setSessions={setSessions} 
        activeSession={activeSession} 
        setActiveSession={setActiveSession}
        loadSessions={loadSessions}
      />
      <ChatWindow 
        session={activeSession}
        setSession={setActiveSession}
      />
    </div>
  );
}
