import React from 'react';
import { Leaf, ArrowLeft, PhoneCall, Activity, Settings, AlertTriangle } from 'lucide-react';

export default function Features({ navigateTo }) {
  return (
    <div className="features-container view-transition-root" key="view-features">
      {/* Background Grid */}
      <div className="bg-grid-overlay"></div>

      {/* Background Glow Layer */}
      <div className="bg-glow-layer">
        <div className="glow-blob glow-blob-1"></div>
        <div className="glow-blob glow-blob-2"></div>
        <div className="glow-blob glow-blob-3"></div>
      </div>

      {/* Navigation Header */}
      <header className="landing-nav">
        <div className="landing-nav-logo" onClick={() => navigateTo('landing')} style={{ cursor: 'pointer' }}>
          <Leaf size={24} style={{ filter: 'drop-shadow(0 0 8px var(--primary))' }} />
          <span>Salus</span>
        </div>
        <button 
          className="btn btn-secondary" 
          onClick={() => navigateTo('landing')} 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            padding: '0.6rem 1.2rem',
            background: 'rgba(82, 183, 136, 0.08)',
            border: '1px solid rgba(82, 183, 136, 0.2)',
            color: 'var(--text-main)',
            borderRadius: '10px',
            cursor: 'pointer',
            transition: 'var(--transition)',
            fontWeight: 600
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(82, 183, 136, 0.18)';
            e.currentTarget.style.borderColor = 'var(--primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(82, 183, 136, 0.08)';
            e.currentTarget.style.borderColor = 'rgba(82, 183, 136, 0.2)';
          }}
        >
          <ArrowLeft size={16} /> Back to Home
        </button>
      </header>

      {/* Circling Features Section */}
      <section className="features-page-content">
        
        {/* Left Column: Interactive Circle Layout */}
        <div className="features-circle-wrapper">
          <div className="landing-features-circle-container">
            <div className="landing-features-circle-bg-wrapper">
              <div className="landing-features-circle-bg"></div>
            </div>
            
            <div className="landing-features-circle-center">
              <h2 className="landing-features-circle-title">Features</h2>
              <div className="landing-features-circle-glow"></div>
            </div>

            <div className="landing-feature-circle-card-wrapper feat-top">
              <div className="feat-line"></div>
              <div className="landing-feature-circle-card">
                <div className="landing-feature-icon primary">
                  <PhoneCall size={22} />
                </div>
                <h3 className="landing-feature-title">Real-Time Voice AI</h3>
                <p className="landing-feature-desc">
                  Interact with custom voice assistants specialized in medicine, scheduling, and follow-ups.
                </p>
              </div>
            </div>

            <div className="landing-feature-circle-card-wrapper feat-right">
              <div className="feat-line"></div>
              <div className="landing-feature-circle-card">
                <div className="landing-feature-icon success">
                  <Activity size={22} />
                </div>
                <h3 className="landing-feature-title">Biometric Stream</h3>
                <p className="landing-feature-desc">
                  Continuously track patient pulse, oxygen levels, and core temps with live ECG waves.
                </p>
              </div>
            </div>

            <div className="landing-feature-circle-card-wrapper feat-bottom">
              <div className="feat-line"></div>
              <div className="landing-feature-circle-card">
                <div className="landing-feature-icon secondary">
                  <Settings size={22} />
                </div>
                <h3 className="landing-feature-title">Prompt Orchestrator</h3>
                <p className="landing-feature-desc">
                  Manage LLM contexts dynamically. Swap instructions or Nurse behaviors in real-time.
                </p>
              </div>
            </div>

            <div className="landing-feature-circle-card-wrapper feat-left">
              <div className="feat-line"></div>
              <div className="landing-feature-circle-card">
                <div className="landing-feature-icon warning">
                  <AlertTriangle size={22} />
                </div>
                <h3 className="landing-feature-title">Crisis Triage SOS</h3>
                <p className="landing-feature-desc">
                  Instantly bypass regular queue operations and dispatch active ambulances with ETAs.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Title and Description */}
        <div className="features-text-wrapper">
          <span className="badge badge-success" style={{ marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Platform Intel</span>
          <h1 className="features-text-title">
            System Capabilities
          </h1>
          <p className="features-text-desc">
            Explore the advanced autonomous healthcare monitoring, triage dispatch, and voice communication engines engineered directly into the Salus platform.
          </p>
        </div>

      </section>

      {/* Minimal Footer */}
      <footer className="landing-footer" style={{ marginTop: 'auto' }}>
        <p>© {new Date().getFullYear()} Salus Automation. Designed with high-fidelity healthcare diagnostics.</p>
      </footer>
    </div>
  );
}
