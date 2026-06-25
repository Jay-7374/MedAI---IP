import React from 'react';
import { AlertTriangle, Activity } from 'lucide-react';

export default function EmergencySOS({ sosStatus, handleTriggerSOS }) {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      <div className="card" style={{ border: '1px solid rgba(231, 111, 81, 0.3)', background: 'rgba(231, 111, 81, 0.02)', textAlign: 'center', padding: '4rem 2rem' }}>
        <h2 style={{ color: 'var(--danger)', fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '-0.5px' }}>
          Emergency Severity Classification Console
        </h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto 2.5rem', fontSize: '0.95rem', fontWeight: 500, lineHeight: 1.5 }}>
          Triggering the SOS alert bypasses standard triage, automatically logs a priority dispatch call in the database, and allocates responder vectors using the Emergency Severity Index (ESI).
        </p>

        <div className="sos-trigger" onClick={handleTriggerSOS}>
          <AlertTriangle size={42} style={{ marginBottom: '6px' }} />
          <span style={{ fontSize: '1.35rem', fontWeight: 800 }}>SOS</span>
        </div>

        {sosStatus && (
          <div className="sos-dispatch-box">
            <p style={{ color: 'var(--danger)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <Activity size={18} style={{ animation: 'bounce 1s infinite' }} /> Emergency Dispatch Confirmed (ESI Category 1)
            </p>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginTop: '0.5rem', fontWeight: 600 }}>
              Unit allocated: <span style={{ color: 'var(--primary)' }}>{sosStatus.unit}</span>
            </p>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Estimated Arrival Time (ETA): <strong style={{ color: 'var(--text-main)' }}>{sosStatus.eta_minutes} minutes</strong>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
