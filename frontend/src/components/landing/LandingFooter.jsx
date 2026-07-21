import React from 'react';
import { Activity } from 'lucide-react';

export default function LandingFooter() {
  const year = new Date().getFullYear();
  
  return (
    <footer className="lp-footer" role="contentinfo">
      <div className="lp-footer-inner">
        
        <div className="lp-footer-brand">
          <div className="lp-footer-logo">
            <Activity size={24} className="lp-logo-icon" />
            <span>Salus</span>
          </div>
          <p className="lp-footer-tagline">
            Care connected by intelligence.
          </p>
        </div>

        <nav className="lp-footer-nav" aria-label="Footer navigation">
          <button className="lp-footer-link">About Us</button>
          <button className="lp-footer-link">Clinical Studies</button>
          <button className="lp-footer-link">Security</button>
          <button className="lp-footer-link">Terms of Service</button>
          <button className="lp-footer-link">Privacy Policy</button>
        </nav>

      </div>
      
      <div className="lp-footer-bottom">
        &copy; {year} Salus Healthcare Systems. All rights reserved. Not intended to replace professional medical advice.
      </div>
    </footer>
  );
}
