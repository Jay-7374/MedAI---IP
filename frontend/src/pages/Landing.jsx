import React from 'react';
import { Leaf, Send, ChevronRight } from 'lucide-react';

export default function Landing({ vitals, navigateTo }) {
  return (
    <div className="landing-container view-transition-root" key="view-landing">
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
        <div className="landing-nav-logo" onClick={() => navigateTo('landing', 'dashboard')} style={{ cursor: 'pointer' }}>
          <Leaf size={24} style={{ filter: 'drop-shadow(0 0 8px var(--primary))' }} />
          <span>Salus</span>
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
