import React from 'react';
import { Settings, PhoneCall } from 'lucide-react';

export default function VoiceSimulator({
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
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1.75fr', gap: '1.75rem' }}>
      <div className="card" style={{ height: 'fit-content', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
          <h3 style={{ marginBottom: '0.5rem', fontSize: '1.2rem', fontWeight: 700 }}>Voice AI Command Portal</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Select required voice feature persona and click portal to connect.</p>
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Voice Agent Core Persona</label>
          <select 
            className="form-control" 
            value={selectedBot}
            onChange={(e) => setSelectedBot(e.target.value)}
            disabled={callStatus !== 'Idle'}
          >
            {isAdmin ? (
              <>
                <option value="NaturalSpeechAuth">Natural Speech Authentication</option>
                <option value="ConversationalScheduling">Conversational Scheduling & Diagnostics</option>
                <option value="PostDischargeCheckIn">Post-Discharge Wellness Check-in</option>
                <option value="MedicationAdherence">Active Medication Adherence Alert</option>
                <option value="InsurancePolicyIntake">Insurance Policy Intake & Breakdown</option>
                <option value="EmergencySeverity">Emergency Severity Classification</option>
                <option value="AiNurseAdvice">Interactive AI Nurse Advice</option>
                <option value="ElderCareTerminal">Elder Care Welfare Terminal</option>
                <option value="TelemedicineBridge">Telemedicine Video Bridge Hand-off</option>
              </>
            ) : (
              <>
                <option value="NaturalSpeechAuth">Verify My Identity</option>
                <option value="ConversationalScheduling">Book or Change an Appointment</option>
                <option value="PostDischargeCheckIn">Post-Discharge Recovery Check-in</option>
                <option value="MedicationAdherence">Medication Reminder</option>
                <option value="InsurancePolicyIntake">Insurance & Cost Estimate</option>
                <option value="EmergencySeverity">Report an Emergency</option>
                <option value="AiNurseAdvice">Ask a Nurse</option>
                <option value="ElderCareTerminal">Wellness Check-in</option>
                <option value="TelemedicineBridge">Join My Video Consultation</option>
              </>
            )}
          </select>
        </div>

        {/* Simulation Control Panel — Admin only */}
        {isAdmin && (
          <div className="simulation-toggles-container">
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Settings size={14} /> Handoff & Error Simulation Control
            </h4>
            
            <label className="simulation-checkbox-label">
              <input 
                type="checkbox" 
                checked={simulateDbTimeout} 
                onChange={(e) => setSimulateDbTimeout(e.target.checked)} 
              />
              Simulate Backend Database Timeout
            </label>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Consecutive voice errors: <strong>{consecutiveErrors} / 2</strong>
              </span>
              <button 
                className="simulation-btn"
                onClick={() => {
                  const nextVal = consecutiveErrors + 1;
                  setConsecutiveErrors(nextVal);
                  showToast(`Simulated Speech failure logged (${nextVal}/2)`, "warning");
                  
                  if (nextVal >= 2 && callStatus === 'Connected') {
                    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                      wsRef.current.send(JSON.stringify({
                        type: 'text',
                        session_id: sessionId,
                        text: '[FAILED_TO_UNDERSTAND]',
                        bot_name: selectedBot,
                        simulate_db_timeout: simulateDbTimeout,
                        consecutive_errors: nextVal
                      }));
                    }
                  }
                }}
              >
                Trigger Voice Recognition Error
              </button>
            </div>
          </div>
        )}

        {/* SIP Warm-Transfer active display */}
        {sipTransferActive && (
          <div className="sip-transfer-banner">
            <div className="sip-details">
              <span className="sip-pulse-indicator"></span>
              <div>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--danger)', fontWeight: 800, textTransform: 'uppercase' }}>SIP Warm-Transfer Active</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500, marginTop: '0.15rem' }}>
                  Routing session to Front Desk receptionist: <strong>Sarah Conner</strong>
                </p>
              </div>
            </div>
            <button 
              className="btn btn-secondary" 
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', borderRadius: '8px' }}
              onClick={() => {
                setSipTransferActive(false);
                if (sipTransferActiveRef) sipTransferActiveRef.current = false;
                setConsecutiveErrors(0);
                showToast("SIP session reset.", "success");
              }}
            >
              Reset Handoff
            </button>
          </div>
        )}
        
        <div className="voice-portal-wrapper">
          <div 
            className={`voice-portal ${callStatus.toLowerCase()} ${isSpeaking ? 'speaking' : ''}`}
            onClick={callStatus === 'Idle' ? startCallSession : endCallSession}
          >
            <div className="voice-portal-inner">
              <PhoneCall size={36} style={{ transform: callStatus !== 'Idle' ? 'rotate(135deg)' : 'none', transition: 'var(--transition)' }} />
            </div>
            <div className="pulse-ring ring-1"></div>
            <div className="pulse-ring ring-2"></div>
            <div className="pulse-ring ring-3"></div>
          </div>
          
          <div className="voice-visualizer-wave">
            <div className="audio-wave-bar"></div>
            <div className="audio-wave-bar"></div>
            <div className="audio-wave-bar"></div>
            <div className="audio-wave-bar"></div>
            <div className="audio-wave-bar"></div>
            <div className="audio-wave-bar"></div>
            <div className="audio-wave-bar"></div>
            <div className="audio-wave-bar"></div>
          </div>

          <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {callStatus === 'Idle' && "Tap Portal to Connect"}
            {callStatus === 'Connecting' && "Initializing Audio Stream..."}
            {callStatus === 'Connected' && (isSpeaking ? "AI Assistant Speaking..." : "Listening (Speak now)...")}
          </p>
        </div>

        <div className="voice-meta-container">
          <div className="voice-meta-row">
            <span style={{ color: 'var(--text-secondary)' }}>Session Channel</span>
            <span style={{ fontWeight: 700 }}>WebSockets Link</span>
          </div>
          <div className="voice-meta-row">
            <span style={{ color: 'var(--text-secondary)' }}>Status</span>
            <span className={`badge ${callStatus === 'Connected' ? 'badge-success' : 'badge-warning'}`} style={{ fontWeight: 700 }}>
              {callStatus}
            </span>
          </div>
        </div>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '600px' }}>
        <h3 style={{ marginBottom: '1.25rem', fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          Conversation Timeline
          {callStatus === 'Connected' && (
            <span className="badge badge-success" style={{ fontSize: '0.6rem', padding: '0.2rem 0.4rem', animation: 'pulse 2s infinite' }}>LIVE</span>
          )}
        </h3>

        <div className="transcript-area timeline-view" style={{ flex: 1, marginBottom: '1.25rem', paddingRight: '0.5rem', overflowY: 'auto' }}>
          {transcripts.length === 0 && !interimText ? (
            <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>
              Dialogue stream is currently empty. Connect above to start.
            </div>
          ) : (
            <div className="timeline-container" style={{ position: 'relative', borderLeft: '2px solid var(--border)', marginLeft: '1rem', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {transcripts.map((msg, idx) => (
                <div key={idx} className={`timeline-item ${msg.speaker === 'User' ? 'user' : 'ai'}`} style={{ position: 'relative' }}>
                  <div className="timeline-dot" style={{ 
                    position: 'absolute', left: '-1.85rem', top: '0', width: '12px', height: '12px', borderRadius: '50%', 
                    background: msg.speaker === 'User' ? 'var(--text-secondary)' : 'var(--primary)',
                    boxShadow: msg.speaker === 'User' ? 'none' : '0 0 10px var(--primary)'
                  }}></div>
                  <div className={`transcript-message ${msg.speaker === 'User' ? 'user' : 'ai'}`} style={{ margin: 0, padding: '0.85rem', borderRadius: '8px', background: msg.speaker === 'User' ? 'rgba(0,0,0,0.03)' : 'rgba(82, 183, 136, 0.08)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.72rem', opacity: 0.8, marginBottom: '0.35rem', fontWeight: 700 }}>
                      <span className="badge" style={{ padding: '0.1rem 0.4rem', fontSize: '0.62rem', background: msg.speaker === 'User' ? 'var(--text-muted)' : 'var(--primary)', color: '#fff' }}>
                        {msg.speaker === 'User' ? 'Patient' : 'AI Assistant'}
                      </span>
                      {msg.latency_ms && <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>({msg.latency_ms}ms)</span>}
                    </div>
                    <div style={{ fontWeight: 500, lineHeight: '1.4' }}>{msg.text}</div>
                  </div>
                </div>
              ))}
              
              {interimText && (
                <div className="timeline-item user" style={{ position: 'relative', opacity: 0.6 }}>
                  <div className="timeline-dot" style={{ position: 'absolute', left: '-1.85rem', top: '0', width: '12px', height: '12px', borderRadius: '50%', background: 'var(--text-secondary)' }}></div>
                  <div className="transcript-message user" style={{ margin: 0, padding: '0.85rem', borderRadius: '8px', background: 'rgba(0,0,0,0.03)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.72rem', opacity: 0.8, marginBottom: '0.35rem', fontWeight: 700 }}>
                      <span className="badge" style={{ padding: '0.1rem 0.4rem', fontSize: '0.62rem', background: 'var(--text-muted)', color: '#fff' }}>Patient</span>
                      <span style={{ fontFamily: 'monospace', fontStyle: 'italic' }}>listening…</span>
                    </div>
                    <div style={{ fontWeight: 500, fontStyle: 'italic' }}>{interimText}</div>
                  </div>
                </div>
              )}
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
        
        {callStatus === 'Connected' && (
          <div className="voice-status-banner" style={{ background: 'var(--background)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%' }}>
              <div className="avatar" style={{ background: isSpeaking ? 'var(--primary)' : 'var(--text-secondary)', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1rem', fontWeight: 800 }}>
                {isSpeaking ? 'AI' : (user?.name ? user.name[0].toUpperCase() : 'U')}
              </div>
              
              {/* Detailed Audio Visualizer */}
              <div className="active-waveform" style={{ display: 'flex', alignItems: 'center', gap: '3px', flex: 1, height: '24px' }}>
                {[...Array(20)].map((_, i) => (
                  <div key={i} style={{
                    width: '3px', 
                    borderRadius: '3px',
                    background: isSpeaking ? 'var(--primary)' : (interimText ? 'var(--success)' : 'rgba(255,255,255,0.2)'),
                    height: isSpeaking ? `${Math.random() * 20 + 4}px` : (interimText ? `${Math.random() * 10 + 4}px` : '4px'),
                    transition: 'height 0.1s ease',
                    animation: isSpeaking ? `pulseWave ${0.5 + Math.random()}s infinite alternate` : 'none'
                  }}></div>
                ))}
              </div>
              
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, minWidth: '80px', textAlign: 'right' }}>
                {isSpeaking ? "Speaking" : "Listening"}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
