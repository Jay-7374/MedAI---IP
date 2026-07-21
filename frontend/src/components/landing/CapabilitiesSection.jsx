import React from 'react';
import { Bot, Activity, CalendarDays, ShieldAlert } from 'lucide-react';

const CAPABILITIES = [
  {
    icon: Bot,
    color: 'primary',
    title: 'Autonomous Care Agents',
    desc: 'Our conversational AI calls patients to check on recovery progress, gather symptoms, and triage concerns before they escalate to an emergency.',
    tags: ['Natural Language Voice', 'Automated Triage', 'Follow-up Calls']
  },
  {
    icon: Activity,
    color: 'cyan',
    title: 'Continuous Telemetry',
    desc: 'Integrate with hospital monitors and personal wearables. SALUS tracks SpO2, heart rate, and blood pressure in real-time.',
    tags: ['Wearable Integration', 'Real-time Vitals', 'Trend Analysis']
  },
  {
    icon: CalendarDays,
    color: 'amber',
    title: 'Intelligent Scheduling',
    desc: 'Eliminate phone tag. Patients can book, reschedule, or cancel appointments through natural conversation with the AI.',
    tags: ['Automated Booking', 'Calendar Sync', 'Reminder System']
  },
  {
    icon: ShieldAlert,
    color: 'violet',
    title: 'Emergency Coordination',
    desc: 'When vitals drop or a patient reports severe symptoms, SALUS instantly alerts the care team with an ESI severity score.',
    tags: ['Instant SOS', 'ESI Triage', 'Care Team Alerts']
  }
];

export default function CapabilitiesSection() {
  return (
    <section className="lp-section lp-capabilities" id="capabilities" aria-labelledby="cap-heading">
      <div className="lp-section-inner">
        
        <header className="lp-section-header scroll-reveal">
          <span className="lp-section-eyebrow">Core Capabilities</span>
          <h2 className="lp-section-title" id="cap-heading">
            Advanced tools for modern clinical teams.
          </h2>
          <p className="lp-section-desc">
            Designed to augment—not replace—your medical staff. Salus handles the routine monitoring and administration so your team can focus on complex clinical decisions.
          </p>
        </header>

        <div className="lp-cap-grid scroll-reveal">
          {CAPABILITIES.map((cap) => {
            const Icon = cap.icon;
            return (
              <div className={`lp-cap-card lp-cap-card--${cap.color}`} key={cap.title}>
                <div className={`lp-cap-card-icon lp-cap-card-icon--${cap.color}`}>
                  <Icon size={24} />
                </div>
                <h3 className="lp-cap-card-title">{cap.title}</h3>
                <p className="lp-cap-card-desc">{cap.desc}</p>
                <div className="lp-cap-card-tags">
                  {cap.tags.map(tag => (
                    <span className="lp-cap-tag" key={tag}>{tag}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
