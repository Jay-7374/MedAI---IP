import React from 'react';
import { Activity } from 'lucide-react';

export default function Telemedicine({ 
  setView, 
  setActiveTab, 
  setTelemedicineActive, 
  telemedicineActiveRef, 
  showToast 
}) {
  return (
    <div className="app-container view-transition-root" style={{ padding: '2.5rem' }} key="view-telemedicine">
      <div className="bg-glow-layer">
        <div className="glow-blob glow-blob-1"></div>
        <div className="glow-blob glow-blob-2"></div>
      </div>

      <div className="telemedicine-bridge-container card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--divider)', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Activity size={24} style={{ color: 'var(--primary-hover)', animation: 'bounce 1s infinite' }} />
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Secure Telemedicine Video Consult</h2>
          </div>
          <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="pulse-dot"></span>
            Secure WebRTC Connection
          </span>
        </div>

        <div className="webrtc-call-layout" style={{ marginTop: '1rem' }}>
          {/* Local Video Stream */}
          <div className="video-window">
            <video id="localVideo" autoPlay playsInline muted style={{ transform: 'scaleX(-1)' }} />
            <div className="webrtc-overlay-label">
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary-hover)', display: 'inline-block' }}></span>
              Patient Feed (You)
            </div>
          </div>

          {/* Simulated Doctor Video Stream */}
          <div className="video-window" style={{ background: '#0b221a' }}>
            <div className="video-placeholder">
              <div className="avatar" style={{ width: '80px', height: '80px', fontSize: '2rem', background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)' }}>ER</div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>Dr. Evelyn Reed</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Cardiologist • Clinic Floor 3</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', background: 'rgba(0,0,0,0.3)', padding: '0.35rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <span className="pulse-dot"></span>
                <span style={{ fontSize: '0.78rem', color: '#fff', fontWeight: 600 }}>Doctor Audio/Video Feed Active</span>
              </div>
            </div>
            <div className="webrtc-overlay-label">
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--danger)', display: 'inline-block' }}></span>
              Clinician Feed (Remote)
            </div>
          </div>
        </div>

        <div className="webrtc-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn btn-secondary" onClick={() => showToast("Microphone muted", "warning")}>
              Mute Audio
            </button>
            <button className="btn btn-secondary" onClick={() => showToast("Camera stream stopped", "warning")}>
              Stop Camera
            </button>
          </div>
          <button className="btn btn-danger" onClick={() => {
            setView('app');
            setActiveTab('dashboard');
            setTelemedicineActive(false);
            if (telemedicineActiveRef) telemedicineActiveRef.current = false;
            showToast("Telemedicine bridge closed gracefully.", "success");
          }}>
            Disconnect Call
          </button>
        </div>
      </div>
    </div>
  );
}
