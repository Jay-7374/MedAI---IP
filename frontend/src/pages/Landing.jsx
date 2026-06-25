import React from 'react';
import { Heart, Send, PhoneCall, Activity, Settings, AlertTriangle } from 'lucide-react';

export default function Landing({ vitals, navigateTo }) {
  return (
    <div className="landing-container view-transition-root" key="view-landing">
      {/* Background Grid & Scanline */}
      <div className="bg-grid-overlay"></div>
      <div className="bg-grid-scanline"></div>

      {/* Ambient Floating ECG Lines */}
      <div className="landing-bg-waves top-waves">
        <svg className="bg-wave-svg" viewBox="0 0 2880 200" preserveAspectRatio="none">
          <path 
            className="bg-wave-path bg-wave-path-1" 
            d="M 0 100 L 200 100 C 205 90, 215 90, 220 100 L 240 100 L 250 115 L 265 15 L 280 170 L 290 100 C 300 85, 310 85, 320 100 L 920 100 C 925 90, 935 90, 940 100 L 960 100 L 970 115 L 985 15 L 1000 170 L 1010 100 C 1020 85, 1030 85, 1040 100 L 1640 100 C 1645 90, 1655 90, 1660 100 L 1680 100 L 1690 115 L 1705 15 L 1720 170 L 1730 100 C 1740 85, 1750 85, 1760 100 L 2360 100 C 2365 90, 2375 90, 2380 100 L 2400 100 L 2410 115 L 2425 15 L 2440 170 L 2450 100 C 2460 85, 2470 85, 2480 100 L 2880 100" 
          />
        </svg>
        <div className="bg-wave-pulse bg-wave-pulse-primary"></div>
      </div>

      <div className="landing-bg-waves bottom-waves">
        <svg className="bg-wave-svg" viewBox="0 0 2880 200" preserveAspectRatio="none">
          <path 
            className="bg-wave-path bg-wave-path-2" 
            d="M 0 100 L 200 100 C 205 90, 215 90, 220 100 L 240 100 L 250 115 L 265 15 L 280 170 L 290 100 C 300 85, 310 85, 320 100 L 920 100 C 925 90, 935 90, 940 100 L 960 100 L 970 115 L 985 15 L 1000 170 L 1010 100 C 1020 85, 1030 85, 1040 100 L 1640 100 C 1645 90, 1655 90, 1660 100 L 1680 100 L 1690 115 L 1705 15 L 1720 170 L 1730 100 C 1740 85, 1750 85, 1760 100 L 2360 100 C 2365 90, 2375 90, 2380 100 L 2400 100 L 2410 115 L 2425 15 L 2440 170 L 2450 100 C 2460 85, 2470 85, 2480 100 L 2880 100" 
          />
        </svg>
        <div className="bg-wave-pulse bg-wave-pulse-secondary"></div>
      </div>

      {/* Background Glow Layer */}
      <div className="bg-glow-layer">
        <div className="glow-blob glow-blob-1"></div>
        <div className="glow-blob glow-blob-2"></div>
        <div className="glow-blob glow-blob-3"></div>
      </div>

      {/* Navigation Header */}
      <header className="landing-nav">
        <div className="landing-nav-logo" onClick={() => navigateTo('landing', 'dashboard')} style={{ cursor: 'pointer' }}>
          <Heart size={24} style={{ filter: 'drop-shadow(0 0 8px var(--primary))' }} />
          <span>MedAI Flow</span>
        </div>
      </header>

      {/* Hero Section */}
      <section className="landing-hero-section">
        <div className="landing-hero-content">
          <h1 className="landing-title">
            Autonomous AI Hospital Voice Bot & Telemetry
          </h1>
          <p className="landing-subtitle">
            Orchestrate conversational voice agents, live ECG patient tracking, medical reminders, and emergency triage dispatches in a unified, next-generation medical control console.
          </p>
        </div>

        <div className="landing-hero-actions-container">
          <button className="btn btn-primary btn-cta btn-cta-single" onClick={() => navigateTo('login')}>
            Launch Console <Send size={16} />
          </button>

          <div className="landing-hero-visual">
            <div className="landing-orb-shield"></div>
            <div className="landing-visual-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="badge badge-success">Biometrics Live</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Pulse: {vitals.heartrate} BPM</span>
              </div>
              
              <div style={{ height: '100px', width: '100%', overflow: 'hidden', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', position: 'relative', display: 'flex', alignItems: 'center' }}>
                <svg className="ekg-svg" viewBox="0 0 600 200" preserveAspectRatio="none">
                  <path 
                    className="ekg-line"
                    d="M 0 100 L 40 100 Q 50 90 60 100 L 90 100 L 98 115 L 108 30 L 118 170 L 128 100 L 160 100 Q 175 80 190 100 L 240 100 L 280 100 Q 290 90 300 100 L 330 100 L 338 115 L 348 30 L 358 170 L 368 100 L 400 100 Q 415 80 430 100 L 480 100 L 520 100 Q 530 90 540 100 L 570 100 L 578 115 L 588 30 L 598 170 L 600 100" 
                  />
                </svg>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 8px var(--success)', animation: 'sosPulse 1.5s infinite' }}></div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>System Core: Online</div>
              </div>
            </div>
          </div>
        </div>

        <div className="landing-hero-scroll-indicator" onClick={() => {
          const el = document.querySelector('.landing-features-circle-container');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          }
        }}>
          <span className="scroll-text">Explore Features</span>
          <div className="scroll-mouse">
            <div className="scroll-wheel"></div>
          </div>
        </div>
      </section>

      {/* Circling Features Section */}
      <section className="landing-features-circle-container">
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
      </section>

      {/* Minimal Footer */}
      <footer className="landing-footer">
        <p>© {new Date().getFullYear()} MedAI Flow Automation. Designed with high-fidelity healthcare diagnostics.</p>
      </footer>
    </div>
  );
}
