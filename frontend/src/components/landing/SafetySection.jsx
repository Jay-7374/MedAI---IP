import React from 'react';
import { Lock, FileCheck, ShieldCheck } from 'lucide-react';

const SAFETY_ITEMS = [
  {
    icon: Lock,
    title: 'End-to-End Encryption',
    desc: 'All patient data, voice recordings, and telemetry streams are encrypted at rest and in transit.'
  },
  {
    icon: FileCheck,
    title: 'HIPAA Compliant Architecture',
    desc: 'Built from the ground up to meet stringent healthcare regulatory standards and patient privacy laws.'
  },
  {
    icon: ShieldCheck,
    title: 'Clinical Oversight Built-In',
    desc: 'AI never makes final medical diagnoses. The system triages and escalates to human doctors immediately.'
  }
];

export default function SafetySection() {
  return (
    <section className="lp-section lp-safety" id="safety" aria-labelledby="safety-heading">
      <div className="lp-section-inner">
        <div className="lp-safety-layout">
          
          <div className="lp-safety-lead scroll-reveal">
            <span className="lp-section-eyebrow">Trust & Security</span>
            <h2 className="lp-section-title" id="safety-heading">
              Patient safety is our <span className="lp-safety-accent">first priority.</span>
            </h2>
            <p className="lp-section-desc">
              Healthcare data requires uncompromising security. Salus provides a fortified environment protecting both clinical operations and patient privacy.
            </p>
          </div>

          <div className="lp-safety-grid scroll-reveal">
            {SAFETY_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <div className="lp-safety-item" key={item.title}>
                  <div className="lp-safety-icon" aria-hidden="true">
                    <Icon size={24} />
                  </div>
                  <div>
                    <h3 className="lp-safety-item-title">{item.title}</h3>
                    <p className="lp-safety-item-desc">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
}
