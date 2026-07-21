import React from 'react';

const PILLARS = [
  {
    num: '01',
    title: 'Voice-First AI',
    desc: 'Natural, real-time conversational agents capable of conducting patient check-ins and triage over the phone.'
  },
  {
    num: '02',
    title: 'Clinical Vitals',
    desc: 'Continuous ingestion of telemetry data, from wearables to ICU monitors, providing a unified patient view.'
  },
  {
    num: '03',
    title: 'Smart Scheduling',
    desc: 'Autonomous appointment booking and management, reducing administrative burden on your front desk.'
  },
  {
    num: '04',
    title: 'Emergency SOS',
    desc: 'Instant detection of critical alerts, automatically coordinating care teams when every second counts.'
  }
];

export default function PlatformOverview() {
  return (
    <section className="lp-section lp-platform" id="platform" aria-labelledby="platform-heading">
      <div className="lp-section-inner">
        
        <header className="lp-section-header scroll-reveal">
          <span className="lp-section-eyebrow">The Salus Ecosystem</span>
          <h2 className="lp-section-title" id="platform-heading">
            A unified intelligence layer for healthcare operations.
          </h2>
          <p className="lp-section-desc">
            We bridge the gap between patient care and clinical operations. SALUS seamlessly integrates voice AI, real-time vitals, and automated scheduling into a single, cohesive platform.
          </p>
        </header>

        <div className="lp-platform-pillars scroll-reveal">
          {PILLARS.map((pillar) => (
            <div className="lp-pillar" key={pillar.num}>
              <span className="lp-pillar-num">{pillar.num}</span>
              <div className="lp-pillar-divider" aria-hidden="true" />
              <h3 className="lp-pillar-title">{pillar.title}</h3>
              <p className="lp-pillar-desc">{pillar.desc}</p>
            </div>
          ))}
        </div>
        
      </div>
    </section>
  );
}
