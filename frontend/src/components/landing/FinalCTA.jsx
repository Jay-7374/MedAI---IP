import React from 'react';
import { Send, Calendar } from 'lucide-react';

export default function FinalCTA({ navigateTo }) {
  return (
    <section className="lp-final-cta" aria-labelledby="cta-heading">
      <div className="lp-final-cta-inner scroll-reveal">
        <span className="lp-section-eyebrow">Ready for the future of care?</span>
        
        <h2 className="lp-cta-title" id="cta-heading">
          Elevate your clinical operations today.
        </h2>
        
        <p className="lp-cta-desc">
          Join leading healthcare providers using Salus to monitor patients, automate follow-ups, and respond to emergencies faster than ever before.
        </p>
        
        <div className="lp-cta-actions">
          <button 
            className="lp-cta-btn-white"
            onClick={() => navigateTo('login')}
          >
            Launch Console <Send size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
