import React from 'react';
import { Activity, Heart, Stethoscope, Send, ChevronDown } from 'lucide-react';
import { SalusNetworkCanvas } from '../SalusLiveBackground';

/* ─── Hero Visual: Abstract AI Core ─── */
function HeroVisual() {
  return (
    <div className="lp-hero-visual lp-hero-abstract" aria-hidden="true">
      <div className="lp-abstract-core">
        <div className="lp-ring lp-ring-1" />
        <div className="lp-ring lp-ring-2" />
        <div className="lp-ring lp-ring-3" />
        <div className="lp-core-node">
          <Activity size={40} className="lp-core-icon" />
        </div>
      </div>
      
      {/* Floating abstract chips */}
      <div className="lp-vis-satellite-card lp-vis-sat--ai">
        <div className="lp-vis-sat-val">Secure AI Pipeline</div>
      </div>
      
      <div className="lp-vis-satellite-card lp-vis-sat--appt">
        <div className="lp-vis-sat-val">Real-time Intelligence</div>
      </div>
    </div>
  );
}

export default function HeroSection({ navigateTo }) {
  const handleExplore = () => {
    const el = document.querySelector('#platform');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="lp-hero" id="hero" aria-label="SALUS hero">
      <SalusNetworkCanvas variant="landing" />
      <div className="lp-hero-inner">
        {/* Left: content */}
        <div className="lp-hero-content hero-animate-in">
          <div className="lp-hero-eyebrow">
            <span className="lp-eyebrow-dot" aria-hidden="true" />
            AI-Powered Healthcare Platform
          </div>

          <h1 className="lp-hero-h1">
            Care connected{' '}
            <span className="lp-hero-h1-accent">by intelligence.</span>
          </h1>

          <p className="lp-hero-desc">
            SALUS brings AI voice agents, patient monitoring, emergency coordination,
            and real-time clinical intelligence into one calm, unified platform —
            so healthcare teams can focus on what matters most.
          </p>

          {/* Trust badges */}
          <div className="lp-hero-trust">
            <span className="lp-trust-badge">
              <span className="lp-trust-dot lp-trust-dot--teal" />
              Real-Time Monitoring
            </span>
            <span className="lp-trust-badge">
              <span className="lp-trust-dot lp-trust-dot--blue" />
              AI Voice Agents
            </span>
            <span className="lp-trust-badge">
              <span className="lp-trust-dot lp-trust-dot--amber" />
              Emergency Ready
            </span>
          </div>

          {/* CTAs */}
          <div className="lp-hero-ctas">
            <button
              className="lp-btn-primary"
              onClick={() => navigateTo('login')}
              aria-label="Launch the SALUS console"
            >
              Launch Console <Send size={16} aria-hidden="true" />
            </button>
            <button
              className="lp-cta-secondary"
              onClick={handleExplore}
              aria-label="Explore the SALUS platform"
            >
              Explore Platform <ChevronDown size={16} aria-hidden="true" />
            </button>
          </div>

          <p className="lp-hero-support">
            Technology that helps healthcare teams stay one step ahead.
          </p>
        </div>

        {/* Right: card visual */}
        <HeroVisual />
      </div>

      {/* Scroll indicator */}
      <button className="lp-scroll-hint" onClick={handleExplore} aria-label="Scroll down">
        <ChevronDown size={20} />
      </button>
    </section>
  );
}
