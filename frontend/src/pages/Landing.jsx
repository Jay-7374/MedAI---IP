import React from 'react';
import { Leaf, Send, ChevronRight } from 'lucide-react';

export default function Landing({ vitals, navigateTo }) {
  return (
    <div className="landing-container view-transition-root" key="view-landing">
      {/* Background Grid */}
      <div className="bg-grid-overlay"></div>

      {/* Floating Diagonal Dotted Waves */}
      <svg className="landing-diagonal-wave" viewBox="0 0 1920 1080" preserveAspectRatio="none">
        <path 
          className="diagonal-wave-path wave-path-1" 
          d="M -50 1130 C 300 900, 200 700, 600 650 C 1000 600, 920 400, 1320 350 C 1720 300, 1620 100, 1970 -50" 
        />
        <path 
          className="diagonal-wave-path wave-path-2" 
          d="M -50 1150 C 250 950, 250 650, 650 600 C 1050 550, 880 450, 1280 400 C 1680 350, 1650 50, 1970 -30" 
        />
      </svg>


      {/* Background Glow Layer */}
      <div className="bg-glow-layer">
        <div className="glow-blob glow-blob-1"></div>
        <div className="glow-blob glow-blob-2"></div>
        <div className="glow-blob glow-blob-3"></div>
      </div>

      {/* Navigation Header */}
      <header className="landing-nav">
        <div className="landing-nav-logo" onClick={() => navigateTo('landing', 'dashboard')} style={{ cursor: 'pointer' }}>
          <Leaf size={24} style={{ filter: 'drop-shadow(0 0 8px var(--primary))' }} />
          <span>Salus</span>
        </div>
      </header>

      {/* Hero Section */}
      <section className="landing-hero-section">
        <div className="landing-hero-content">
          <h1 className="landing-title">
            Autonomous <em>AI Hospital Voice Bot</em> & Telemetry
          </h1>
          <p className="landing-subtitle">
            Orchestrate conversational voice agents, live ECG patient tracking, medical reminders, and emergency triage dispatches in a unified, next-generation medical control console.
          </p>
        </div>

        <div className="landing-hero-actions-container">
          <button className="btn btn-primary btn-cta btn-cta-single" onClick={() => navigateTo('login')}>
            Launch Console <Send size={16} />
          </button>
        </div>
      </section>

      <div className="landing-capabilities-hud-minimal" onClick={() => navigateTo('features')}>
        <span>Discover</span>
        <ChevronRight size={14} className="hud-arrow-icon" />
      </div>

      {/* Minimal Footer */}
      <footer className="landing-footer">
        <p>© {new Date().getFullYear()} Salus Automation. Designed with high-fidelity healthcare diagnostics.</p>
      </footer>
    </div>
  );
}
