import React, { useState } from 'react';
import { Activity, PhoneCall, AlertTriangle, Radio, Clock, CheckCircle2 } from 'lucide-react';

/* Individual mock module inside the preview */
function PreviewModule({ icon: Icon, title, value, status, color }) {
  return (
    <div className={`lp-preview-module lp-preview-module--${color}`}>
      <div className="lp-preview-mod-head">
        <div className={`lp-preview-mod-icon lp-preview-mod-icon--${color}`} aria-hidden="true">
          <Icon size={14} />
        </div>
        <span className="lp-preview-mod-title">{title}</span>
      </div>
      <div className="lp-preview-mod-value">{value}</div>
      <div className={`lp-preview-mod-status lp-preview-mod-status--${status}`}>
        <span className="lp-preview-status-dot" aria-hidden="true" />
        {status === 'ok' ? 'Nominal' : status === 'active' ? 'Active' : 'Monitoring'}
      </div>
    </div>
  );
}

/* Activity feed item */
function FeedItem({ time, label, type }) {
  return (
    <div className="lp-preview-feed-item">
      <div className={`lp-feed-dot lp-feed-dot--${type}`} aria-hidden="true" />
      <span className="lp-feed-time">{time}</span>
      <span className="lp-feed-label">{label}</span>
    </div>
  );
}

export default function PlatformPreview() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <section className="lp-section lp-preview-section" aria-labelledby="preview-heading">
      <div className="lp-section-inner">
        <div className="lp-section-header scroll-reveal">
          <span className="lp-section-eyebrow">Console Preview</span>
          <h2 className="lp-section-title" id="preview-heading">
            Everything in one view.
          </h2>
          <p className="lp-section-desc">
            The SALUS console unifies AI voice agents, patient monitoring, emergency workflows,
            and real-time alerts — all accessible from a single intelligent dashboard.
          </p>
        </div>

        {/* Dashboard mock */}
        <div className="lp-preview-shell scroll-reveal" role="img" aria-label="Illustrative SALUS console preview">
          {/* Chrome bar */}
          <div className="lp-preview-chrome" aria-hidden="true">
            <div className="lp-chrome-dots">
              <span className="lp-chrome-dot lp-chrome-dot--red" />
              <span className="lp-chrome-dot lp-chrome-dot--yellow" />
              <span className="lp-chrome-dot lp-chrome-dot--green" />
            </div>
            <div className="lp-chrome-addr">salus.io / console</div>
            <div className="lp-chrome-status">
              <span className="lp-preview-status-dot" style={{ background: 'var(--success)' }} />
              System Online
            </div>
          </div>

          {/* Dashboard body */}
          <div className="lp-preview-body">
            {/* Sidebar stub */}
            <div className="lp-preview-sidebar" aria-hidden="true">
              <div className="lp-preview-brand-stub">S</div>
              {['Dashboard','Voice','Monitor','Alerts','SOS'].map((item) => (
                <div key={item} className={`lp-preview-nav-stub${item === 'Dashboard' ? ' lp-preview-nav-stub--active' : ''}`}>
                  {item}
                </div>
              ))}
            </div>

            {/* Main content */}
            <div className="lp-preview-main">
              {/* Top metrics */}
              <div className="lp-preview-metrics" aria-label="System metrics">
                {[
                  { label: 'Heart Rate', val: '74 bpm', col: 'rose' },
                  { label: 'SpO₂', val: '98%', col: 'cyan' },
                  { label: 'Voice Sessions', val: '3 Active', col: 'blue' },
                  { label: 'Alerts', val: '0 Critical', col: 'green' },
                ].map(({ label, val, col }) => (
                  <div className={`lp-preview-metric lp-preview-metric--${col}`} key={label}>
                    <div className="lp-preview-metric-label">{label}</div>
                    <div className="lp-preview-metric-val">{val}</div>
                  </div>
                ))}
              </div>

              {/* Module grid */}
              <div className="lp-preview-modules">
                <PreviewModule icon={PhoneCall}    title="AI Voice Agent"      value="NaturalSpeech"  status="active"    color="primary" />
                <PreviewModule icon={Activity}     title="Patient Monitoring"  value="4 Patients"     status="monitoring" color="cyan"   />
                <PreviewModule icon={AlertTriangle} title="Emergency Queue"    value="ESI: Clear"     status="ok"        color="amber"   />
                <PreviewModule icon={Radio}        title="Real-Time Feed"      value="Live · 0ms"     status="ok"        color="violet"  />
              </div>

              {/* Activity feed */}
              <div className="lp-preview-feed">
                <div className="lp-preview-feed-header">
                  <Clock size={12} aria-hidden="true" />
                  Recent Activity
                </div>
                <FeedItem time="Just now" label="Voice session initialized · NaturalSpeechAuth"  type="primary" />
                <FeedItem time="2m ago"   label="Patient biometric signal updated · HR 74 bpm"  type="cyan"    />
                <FeedItem time="5m ago"   label="ESI classification: Non-critical"               type="green"   />
                <FeedItem time="9m ago"   label="Medication adherence confirmed · Patient #1042" type="violet"  />
              </div>
            </div>
          </div>

          {/* Bottom badge */}
          <div className="lp-preview-footer" aria-hidden="true">
            <CheckCircle2 size={13} /> Illustrative preview — not real patient data
          </div>
        </div>
      </div>
    </section>
  );
}
