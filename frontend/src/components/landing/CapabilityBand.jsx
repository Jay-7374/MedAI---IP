import React from 'react';
import { PhoneCall, Activity, Zap, BarChart3, Layers } from 'lucide-react';

const CAPABILITIES = [
  { icon: PhoneCall, label: 'AI Voice Agents' },
  { icon: Activity,  label: 'Continuous Monitoring' },
  { icon: Zap,       label: 'Emergency Coordination' },
  { icon: BarChart3, label: 'Real-Time Intelligence' },
  { icon: Layers,    label: 'Unified Operations' },
];

export default function CapabilityBand() {
  return (
    <section className="lp-capability-band" aria-label="Platform capabilities overview">
      <div className="lp-capability-band-inner">
        {CAPABILITIES.map(({ icon: Icon, label }) => (
          <div className="lp-cap-item" key={label}>
            <div className="lp-cap-icon-wrap" aria-hidden="true">
              <Icon size={17} />
            </div>
            <span className="lp-cap-label">{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
