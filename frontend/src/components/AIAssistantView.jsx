import React, { useState } from 'react';
import ChatbotLayout from './chatbot/ChatbotLayout';
import VoiceSimulator from '../pages/VoiceSimulator';

export default function AIAssistantView({
  user,
  isAdmin,
  selectedBot,
  setSelectedBot,
  callStatus,
  simulateDbTimeout,
  setSimulateDbTimeout,
  consecutiveErrors,
  setConsecutiveErrors,
  sipTransferActive,
  setSipTransferActive,
  sipTransferActiveRef,
  isSpeaking,
  startCallSession,
  endCallSession,
  transcripts,
  interimText,
  chatEndRef,
  wsRef,
  sessionId,
  showToast
}) {
  const [activeMode, setActiveMode] = useState('chat'); // 'chat' or 'voice'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%', minHeight: 0, minWidth: 0 }}>
      {/* Top Header/Tab Switch */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '0.5rem',
        backgroundColor: '#fff',
        borderBottom: '1px solid var(--card-border)',
      }}>
        <div style={{ 
          display: 'flex', 
          background: 'var(--bg-main)', 
          padding: '0.15rem', 
          borderRadius: '8px',
          border: '1px solid var(--card-border)',
          gap: '0.25rem'
        }}>
          <button
            onClick={() => setActiveMode('chat')}
            style={{
              padding: '0.35rem 1rem',
              borderRadius: '6px',
              border: 'none',
              background: activeMode === 'chat' ? 'var(--primary)' : 'transparent',
              color: activeMode === 'chat' ? '#fff' : 'var(--text-main)',
              fontWeight: activeMode === 'chat' ? '600' : '500',
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Chat Assistant
          </button>
          <button
            onClick={() => setActiveMode('voice')}
            style={{
              padding: '0.35rem 1rem',
              borderRadius: '6px',
              border: 'none',
              background: activeMode === 'voice' ? 'var(--primary)' : 'transparent',
              color: activeMode === 'voice' ? '#fff' : 'var(--text-main)',
              fontWeight: activeMode === 'voice' ? '600' : '500',
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Voice Assistant
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0, minWidth: 0 }}>
        {activeMode === 'chat' && (
          <ChatbotLayout isIntegrated={true} />
        )}
        {activeMode === 'voice' && (
          <div style={{ padding: '1rem', width: '100%', height: '100%', overflowY: 'auto' }}>
            <VoiceSimulator 
              user={user}
              isAdmin={isAdmin}
              selectedBot={selectedBot}
              setSelectedBot={setSelectedBot}
              callStatus={callStatus}
              simulateDbTimeout={simulateDbTimeout}
              setSimulateDbTimeout={setSimulateDbTimeout}
              consecutiveErrors={consecutiveErrors}
              setConsecutiveErrors={setConsecutiveErrors}
              sipTransferActive={sipTransferActive}
              setSipTransferActive={setSipTransferActive}
              sipTransferActiveRef={sipTransferActiveRef}
              isSpeaking={isSpeaking}
              startCallSession={startCallSession}
              endCallSession={endCallSession}
              transcripts={transcripts}
              interimText={interimText}
              chatEndRef={chatEndRef}
              wsRef={wsRef}
              sessionId={sessionId}
              showToast={showToast}
            />
          </div>
        )}
      </div>
    </div>
  );
}
