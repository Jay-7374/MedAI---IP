import React from 'react';
import { Leaf, Send, ChevronRight } from 'lucide-react';

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
        <span>Explore Features</span>
        <ChevronRight size={14} className="hud-arrow-icon" />
      </div>

      {/* Minimal Footer */}
      <footer className="landing-footer">
        <p>© {new Date().getFullYear()} Salus Automation. Designed with high-fidelity healthcare diagnostics.</p>
      </footer>
    </div>
  );
}
