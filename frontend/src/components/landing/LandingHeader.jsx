import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Activity, Menu, X, ArrowUpRight } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Platform',      href: '#platform' },
  { label: 'Capabilities',  href: '#capabilities' },
  { label: 'How It Works',  href: '#how-it-works' },
  { label: 'Safety',        href: '#safety' },
];

export default function LandingHeader({ navigateTo }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  // We no longer rely on a ref's parent because we are rendering in a portal.
  // The scrolling container is still .portal-slide, but to be safe and robust,
  // we can listen to the scroll event on the document in capture mode, or
  // specifically find .portal-slide.
  useEffect(() => {
    const handleScroll = (e) => {
      const target = e.target;
      if (target.classList && target.classList.contains('portal-slide')) {
        setScrolled(target.scrollTop > 20);
      } else if (target === document || target === window) {
        setScrolled(window.scrollY > 20);
      }
    };
    
    // Use capture phase to catch scroll events from any container
    window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    return () => window.removeEventListener('scroll', handleScroll, { capture: true });
  }, []);

  useEffect(() => {
    // Intersection Observer for active section
    const observerOptions = {
      root: null, // relative to viewport
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0.1
    };

    const observerCallback = (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveSection(`#${entry.target.id}`);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Observe all sections
    const sectionIds = ['hero', 'platform', 'capabilities', 'how-it-works', 'safety'];
    sectionIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const handleNavClick = (href) => {
    setMobileOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const headerContent = (
    <header className={`lp-header${scrolled ? ' lp-header--scrolled' : ''}`} role="banner">
      <div className="lp-header-inner">
        {/* Logo */}
        <button
          className="lp-logo"
          onClick={() => handleNavClick('#hero')}
          aria-label="SALUS – back to top"
        >
          <Activity size={22} className="lp-logo-icon" aria-hidden="true" />
          <span className="lp-logo-text">Salus</span>
        </button>

        {/* Desktop Nav */}
        <nav className="lp-nav" aria-label="Primary navigation">
          {NAV_LINKS.map((link) => {
            const isActive = activeSection === link.href;
            return (
              <button
                key={link.label}
                className={`lp-nav-link ${isActive ? 'lp-nav-link--active' : ''}`}
                onClick={() => handleNavClick(link.href)}
                aria-current={isActive ? 'page' : undefined}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Right CTAs */}
        <div className="lp-header-actions">
          <button
            className="lp-launch-btn"
            onClick={() => navigateTo('login')}
            aria-label="Launch Console"
          >
            Launch Console <ArrowUpRight size={16} />
          </button>
          {/* Mobile menu toggle */}
          <button
            className="lp-mobile-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`lp-mobile-menu${mobileOpen ? ' lp-mobile-menu--open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
      >
        <nav>
          {NAV_LINKS.map((link) => {
            const isActive = activeSection === link.href;
            return (
              <button
                key={link.label}
                className={`lp-mobile-link ${isActive ? 'lp-mobile-link--active' : ''}`}
                onClick={() => handleNavClick(link.href)}
              >
                {link.label}
              </button>
            );
          })}
          <button
            className="lp-mobile-cta"
            onClick={() => { setMobileOpen(false); navigateTo('login'); }}
          >
            Launch Console <ArrowUpRight size={16} />
          </button>
        </nav>
      </div>
    </header>
  );

  return createPortal(headerContent, document.body);
}
