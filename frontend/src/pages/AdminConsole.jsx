import React, { useState } from 'react';
import { 
  PhoneCall, 
  Settings, 
  ShieldAlert, 
  MessageSquare, 
  Send,
  Activity,
  Play
} from 'lucide-react';
import { apiFetch } from '../apiClient';

export default function AdminConsole({
  simulateDbTimeout,
  setSimulateDbTimeout,
  consecutiveErrors,
  setConsecutiveErrors,
  smsMessages,
  showToast
}) {
  const [outboundPhone, setOutboundPhone] = useState('+919995642737');
  const [outboundBot, setOutboundBot] = useState('PostDischargeCheckIn');
  const [outboundLoading, setOutboundLoading] = useState(false);

  const handleTriggerOutboundCall = async (e) => {
    e.preventDefault();
    setOutboundLoading(true);
    try {
      const res = await apiFetch('/api/calls/outbound', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bot_name: outboundBot,
          to: outboundPhone
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Outbound Campaign call placed: SID ${data.call_sid || 'AC_MOCK'}`, "success");
      } else {
        showToast(data.detail || "Outbound campaign launch failed.", "danger");
      }
    } catch (err) {
      showToast("Offline simulation: Outbound follow-up dialer triggered.", "success");
    } finally {
      setOutboundLoading(false);
    }
  };

  return (
    <div className="view-fade-in" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '1.75rem' }}>
      
      {/* COLUMN 1: Outbound Call Campaign & Simulation controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Outbound Dialer campaign */}
        <div className="card">
          <h3 style={{ marginBottom: '1.25rem', fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <PhoneCall size={20} style={{ color: 'var(--primary-hover)' }} /> Twilio Outbound Voice Campaigns
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: '1.5' }}>
            Initiate automated robotic voice calls directly to patient phones using pre-compiled clinical personas.
          </p>
          
          <form onSubmit={handleTriggerOutboundCall}>
            <div className="form-group">
              <label className="form-label">Patient Contact Number (E.164)</label>
              <input 
                type="text" 
                className="form-control" 
                value={outboundPhone}
                onChange={(e) => setOutboundPhone(e.target.value)}
                placeholder="+1 (555) 019-2834"
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Select Voice Bot Core</label>
              <select 
                className="form-control"
                value={outboundBot}
                onChange={(e) => setOutboundBot(e.target.value)}
              >
                <option value="NaturalSpeechAuth">ARIA (Identity Verification)</option>
                <option value="ConversationalScheduling">NOVA (Appointment Scheduling)</option>
                <option value="PostDischargeCheckIn">CARE (Post-Discharge Recovery)</option>
                <option value="MedicationAdherence">MEDI (Daily Med Reminders)</option>
                <option value="InsurancePolicyIntake">FELIX (Insurance Pre-Auth)</option>
                <option value="EmergencySeverity">RAPID (Triage Severity SOS)</option>
                <option value="AiNurseAdvice">NORA (Interactive AI Nurse)</option>
                <option value="ElderCareTerminal">GRACE (Elder Care Welfare)</option>
                <option value="TelemedicineBridge">CONNECT (Telehealth Video Prep)</option>
              </select>
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', marginTop: '0.5rem' }}
              disabled={outboundLoading}
            >
              {outboundLoading ? "Dailing Call..." : "Dial Outbound Call Campaign"} <Play size={14} style={{ marginLeft: '4px' }} />
            </button>
          </form>
        </div>

        {/* Simulator controls */}
        <div className="card">
          <h3 style={{ marginBottom: '1.25rem', fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Settings size={20} style={{ color: 'var(--success)' }} /> Mock Simulator Configuration
          </h3>
          <div className="simulation-toggles-container" style={{ padding: 0, border: 'none', background: 'none' }}>
            <label className="simulation-checkbox-label" style={{ marginBottom: '1rem' }}>
              <input 
                type="checkbox" 
                checked={simulateDbTimeout} 
                onChange={(e) => setSimulateDbTimeout(e.target.checked)} 
              />
              Simulate Scheduling DB Access Timeout
            </label>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Speech failures logged: <strong>{consecutiveErrors} / 2</strong>
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  className="btn btn-secondary"
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                  onClick={() => {
                    const nextVal = consecutiveErrors + 1;
                    setConsecutiveErrors(nextVal);
                    showToast(`Simulated Speech failure logged (${nextVal}/2)`, "warning");
                  }}
                >
                  Increment
                </button>
                <button 
                  className="btn btn-secondary"
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', color: 'var(--danger)' }}
                  onClick={() => {
                    setConsecutiveErrors(0);
                    showToast("Speech failures cleared.", "success");
                  }}
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* COLUMN 2: Global Logs Feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="card sms-panel-container" style={{ height: '540px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <ShieldAlert size={20} style={{ color: 'var(--danger)' }} /> Global Alert Logs & Notifications Feed
          </h3>
          
          <div className="sms-feed-list" style={{ flex: 1, overflowY: 'auto' }}>
            {smsMessages.map((sms) => (
              <div 
                key={sms.id} 
                className="sms-message-card"
                style={{
                  background: sms.text.includes('EMERGENCY') || sms.text.includes('Warning') 
                    ? 'rgba(231,111,81,0.04)' 
                    : 'rgba(255,255,255,0.01)',
                  border: sms.text.includes('EMERGENCY') || sms.text.includes('Warning')
                    ? '1px solid rgba(231,111,81,0.2)'
                    : '1px solid var(--border)'
                }}
              >
                <div className="sms-meta-row">
                  <span style={{ fontWeight: 700, color: sms.text.includes('EMERGENCY') ? 'var(--danger)' : 'var(--text-main)' }}>
                    {sms.text.includes('EMERGENCY') ? "CRITICAL ALERT" : `Recipient: ${sms.recipient}`}
                  </span>
                  <span>{new Date(sms.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className="sms-phone-bubble" style={{ color: 'var(--text-main)' }}>
                  {sms.text}
                </div>
              </div>
            ))}
            {smsMessages.length === 0 && (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No global alert notifications logged.
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
