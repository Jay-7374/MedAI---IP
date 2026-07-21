import React from 'react';
import LandingHeader     from '../components/landing/LandingHeader';
import HeroSection       from '../components/landing/HeroSection';
import CapabilityBand    from '../components/landing/CapabilityBand';
import PlatformOverview  from '../components/landing/PlatformOverview';
import CapabilitiesSection from '../components/landing/CapabilitiesSection';
import HowItWorks        from '../components/landing/HowItWorks';
import PlatformPreview   from '../components/landing/PlatformPreview';
import SafetySection     from '../components/landing/SafetySection';
import FinalCTA          from '../components/landing/FinalCTA';
import LandingFooter     from '../components/landing/LandingFooter';
import SalusLiveBackground from '../components/SalusLiveBackground';
import useScrollReveal     from '../hooks/useScrollReveal';

export default function Landing({ navigateTo, isActive = true }) {
  useScrollReveal();

  return (
    <div className="lp-root landing-container view-transition-root" key="view-landing">
      <SalusLiveBackground variant="landing" withNetwork={false} />
      {/* Sticky header */}
      {isActive && <LandingHeader navigateTo={navigateTo} />}

      {/* Page sections */}
      <main id="main-content">
        <HeroSection       navigateTo={navigateTo} />
        <CapabilityBand />
        <PlatformOverview />
        <CapabilitiesSection />
        <HowItWorks />
        <PlatformPreview />
        <SafetySection />
        <FinalCTA          navigateTo={navigateTo} />
      </main>

      <LandingFooter navigateTo={navigateTo} />
    </div>
  );
}
