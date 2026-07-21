import React from 'react';
import { UserPlus, Activity, HeadphonesIcon } from 'lucide-react';

const STEPS = [
  {
    num: '1',
    icon: UserPlus,
    badge: 'Onboarding',
    title: 'Patient Enrollment',
    desc: 'Patients are registered in the Salus dashboard. Baseline health data and scheduling preferences are established securely.'
  },
  {
    num: '2',
    icon: Activity,
    badge: 'Monitoring',
    title: 'Continuous Vitals',
    desc: 'Wearables or hospital monitors sync seamlessly, streaming SpO2 and heart rate directly to the clinical command center.'
  },
  {
    num: '3',
    icon: HeadphonesIcon,
    badge: 'Intervention',
    title: 'AI Voice Engagement',
    desc: 'If anomalies are detected, or a routine check-in is due, the Salus voice agent calls the patient to assess symptoms.'
  }
];

export default function HowItWorks() {
  return (
    <section className="lp-section lp-how" id="how-it-works" aria-labelledby="how-heading">
      <div className="lp-section-inner">
        
        <header className="lp-section-header scroll-reveal">
          <span className="lp-section-eyebrow">How It Works</span>
          <h2 className="lp-section-title" id="how-heading">
            A seamless patient journey.
          </h2>
          <p className="lp-section-desc">
            From enrollment to continuous care, Salus orchestrates every touchpoint autonomously, ensuring patients are always monitored and supported.
          </p>
        </header>

        <div className="lp-how-flow scroll-reveal">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isLast = idx === STEPS.length - 1;
            return (
              <React.Fragment key={step.num}>
                <div className="lp-how-step">
                  <div className="lp-how-step-head">
                    <span className="lp-how-num">{step.num}</span>
                    <div className="lp-how-icon-wrap">
                      <Icon size={22} />
                    </div>
                  </div>
                  <div>
                    <span className="lp-how-badge">{step.badge}</span>
                    <h3 className="lp-how-step-title">{step.title}</h3>
                  </div>
                  <p className="lp-how-step-desc">{step.desc}</p>
                </div>
                
                {!isLast && (
                  <div className="lp-how-connector" aria-hidden="true">
                    <div className="lp-how-connector-line" />
                    <div className="lp-how-connector-dot" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

      </div>
    </section>
  );
}
