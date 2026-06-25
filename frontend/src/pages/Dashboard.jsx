import React from 'react';
import { 
  Heart, 
  Pill, 
  PhoneCall, 
  AlertTriangle, 
  Check, 
  MessageSquare, 
  FileText, 
  Calendar,
  Activity,
  ActivitySquare,
  Settings,
  Shield,
  FileCheck
} from 'lucide-react';

export default function Dashboard({ 
  user, 
  medicines, 
  smsMessages, 
  appointments, 
  simulateDbTimeout, 
  consecutiveErrors, 
  sosStatus, 
  navigateTo 
}) {
  const role = user?.role?.toLowerCase();
  
  if (role === 'admin') {
    return (
      <div className="view-fade-in">
        {/* Admin Dashboard Welcome */}
        <section className="metrics-grid">
          <div className="card metric-card pulse">
            <div className="metric-icon metric-icon-pulse">
              <Shield size={24} />
            </div>
            <div className="metric-details">
              <h4>System Role</h4>
              <div className="metric-value">Administrator</div>
            </div>
          </div>
          <div className="card metric-card oxygen">
            <div className="metric-icon metric-icon-oxygen">
              <PhoneCall size={24} />
            </div>
            <div className="metric-details">
              <h4>Active Trunks</h4>
              <div className="metric-value">12 / 12 Online</div>
            </div>
          </div>
          <div className="card metric-card bp">
            <div className="metric-icon metric-icon-bp">
              <Settings size={24} />
            </div>
            <div className="metric-details">
              <h4>DB Bypass Status</h4>
              <div className="metric-value" style={{ color: simulateDbTimeout ? 'var(--danger)' : 'var(--success)' }}>
                {simulateDbTimeout ? 'TIMEOUT ACTIVE' : 'NORMAL'}
              </div>
            </div>
          </div>
          <div className="card metric-card temp">
            <div className="metric-icon metric-icon-temp">
              <AlertTriangle size={24} />
            </div>
            <div className="metric-details">
              <h4>Emergency Triage</h4>
              <div className="metric-value" style={{ color: sosStatus ? 'var(--danger)' : 'var(--success)' }}>
                {sosStatus ? 'ACTIVE CRITICAL' : 'IDLE'}
              </div>
            </div>
          </div>
        </section>

        <div className="dashboard-grid-layout" style={{ marginTop: '1.5rem' }}>
          <div className="card grid-col-span-2">
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield size={18} style={{ color: 'var(--primary-hover)' }} /> MedAI System Overview
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
              Welcome back to the Admin control dashboard. You have full access to compile voice bot prompts, trigger outbound campaigns, monitor twilio API logs, and configure mock bypass parameters.
            </p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button className="btn btn-primary" onClick={() => navigateTo('app', 'adminconsole')}>
                Go to Admin Console
              </button>
              <button className="btn btn-secondary" onClick={() => navigateTo('app', 'prompts')}>
                Manage Prompts
              </button>
            </div>
          </div>

          <div className="card sms-panel-container grid-row-span-2">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <MessageSquare size={18} style={{ color: 'var(--secondary)' }} /> Global Outbound SMS logs
            </h3>
            <div className="sms-feed-list" style={{ flex: 1, overflowY: 'auto' }}>
              {smsMessages.map((sms) => (
                <div key={sms.id} className="sms-message-card">
                  <div className="sms-meta-row">
                    <span style={{ fontWeight: 700 }}>To: {sms.recipient}</span>
                    <span>{new Date(sms.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="sms-phone-bubble">
                    {sms.text}
                  </div>
                </div>
              ))}
              {smsMessages.length === 0 && (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No transactional SMS alerts logged.
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={18} style={{ color: 'var(--success)' }} /> Mock Simulator Toggles
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>DB Timeout Simulation</span>
                <span className={`badge ${simulateDbTimeout ? 'badge-danger' : 'badge-success'}`}>
                  {simulateDbTimeout ? 'Simulating Latency' : 'Inactive'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Speech Comprehension Errors</span>
                <span className={`badge ${consecutiveErrors >= 2 ? 'badge-danger' : 'badge-success'}`}>
                  {consecutiveErrors >= 2 ? 'Failing (>=2 Errors)' : 'Normal (0)'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (role === 'staff' || role === 'doctor' || role === 'receptionist') {
    return (
      <div className="view-fade-in">
        {/* Staff Dashboard Welcome */}
        <section className="metrics-grid">
          <div className="card metric-card pulse">
            <div className="metric-icon metric-icon-pulse">
              <ActivitySquare size={24} />
            </div>
            <div className="metric-details">
              <h4>Pending Visits</h4>
              <div className="metric-value">
                {appointments.filter(a => a.status === 'Pending').length} Slots
              </div>
            </div>
          </div>
          <div className="card metric-card oxygen">
            <div className="metric-icon metric-icon-oxygen">
              <FileCheck size={24} />
            </div>
            <div className="metric-details">
              <h4>Wellness Surveys</h4>
              <div className="metric-value">Stable (5/5 Index)</div>
            </div>
          </div>
          <div className="card metric-card bp">
            <div className="metric-icon metric-icon-bp">
              <Heart size={24} />
            </div>
            <div className="metric-details">
              <h4>Telemetry Alerts</h4>
              <div className="metric-value" style={{ color: 'var(--success)' }}>0 Warnings</div>
            </div>
          </div>
          <div className="card metric-card temp">
            <div className="metric-icon metric-icon-temp">
              <AlertTriangle size={24} />
            </div>
            <div className="metric-details">
              <h4>Active Triage</h4>
              <div className="metric-value" style={{ color: sosStatus ? 'var(--danger)' : 'var(--text-secondary)' }}>
                {sosStatus ? 'SOS DISPATCHED' : 'Normal Operations'}
              </div>
            </div>
          </div>
        </section>

        <div className="dashboard-grid-layout" style={{ marginTop: '1.5rem' }}>
          <div className="card grid-col-span-2">
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ActivitySquare size={18} style={{ color: 'var(--success)' }} /> Clinician Clinical Station
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
              Welcome back to your Clinical dashboard. Review live biometrics, follow-up on recovery surveys, lock telemedicine sessions, and oversee patient scheduling and medication compliance.
            </p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button className="btn btn-primary" onClick={() => navigateTo('app', 'staffconsole')}>
                Open Clinical Staff Console
              </button>
              <button className="btn btn-secondary" onClick={() => navigateTo('app', 'appointments')}>
                View Appointment Queue
              </button>
            </div>
          </div>

          <div className="card sms-panel-container grid-row-span-2">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <Calendar size={18} style={{ color: 'var(--primary-hover)' }} /> Clinical Schedule Feed
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', flex: 1 }}>
              {appointments.map((appt, idx) => (
                <div key={idx} style={{ background: 'rgba(255,255,255,0.01)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)' }}>{appt.doctor}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{appt.date} at {appt.time}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>Symptoms: {appt.symptoms || 'General Checkup'}</div>
                  </div>
                  <span className={`badge ${appt.status === 'Confirmed' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.75rem' }}>
                    {appt.status}
                  </span>
                </div>
              ))}
              {appointments.length === 0 && (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No scheduled consultations.
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={18} style={{ color: 'var(--secondary)' }} /> Active Dispatches
            </h3>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              {sosStatus ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>Dispatch Status:</span>
                    <strong style={{ color: 'var(--danger)' }}>{sosStatus.status}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>Unit ID:</span>
                    <strong>{sosStatus.unit}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>ETA:</span>
                    <strong>{sosStatus.eta_minutes} mins</strong>
                  </div>
                </>
              ) : (
                <div style={{ padding: '1rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No active emergency dispatches.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Patient Dashboard default
  return (
    <div className="view-fade-in">
      {/* Top Row Grid: Streamlined Communications Status Overview */}
      <section className="metrics-grid">
        {/* Medication Adherence Overview */}
        <div className="card metric-card pulse">
          <div className="metric-icon metric-icon-pulse">
            <Pill size={24} />
          </div>
          <div className="metric-details">
            <h4>Medication Adherence</h4>
            <div className="metric-value">
              {medicines.filter(m => m.status === 'Taken').length} / {medicines.length || 2} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Logged</span>
            </div>
          </div>
        </div>

        {/* Elder Care Companion Sentiment */}
        <div className="card metric-card oxygen">
          <div className="metric-icon metric-icon-oxygen">
            <Heart size={24} />
          </div>
          <div className="metric-details">
            <h4>Elder Welfare Sentiment</h4>
            <div className="metric-value">
              Positive <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Warm</span>
            </div>
          </div>
        </div>

        {/* SIP Routing & Timeout Bypass */}
        <div className="card metric-card bp">
          <div className="metric-icon metric-icon-bp">
            <PhoneCall size={24} />
          </div>
          <div className="metric-details">
            <h4>SIP Routing</h4>
            <div className="metric-value" style={{ fontSize: '1.1rem', fontWeight: 700, color: simulateDbTimeout || consecutiveErrors >= 2 ? 'var(--danger)' : 'var(--success)' }}>
              {simulateDbTimeout ? 'DB TIMEOUT' : consecutiveErrors >= 2 ? 'ASR ERROR' : 'TRUNK IDLE'}
            </div>
          </div>
        </div>

        {/* Emergency Triage SOS Status */}
        <div className="card metric-card temp">
          <div className="metric-icon metric-icon-temp">
            <AlertTriangle size={24} />
          </div>
          <div className="metric-details">
            <h4>Triage SOS Status</h4>
            <div className="metric-value" style={{ fontSize: '1.1rem', fontWeight: 700, color: sosStatus ? 'var(--danger)' : 'var(--text-secondary)' }}>
              {sosStatus ? 'DISPATCHED' : 'NO ACTIVE SOS'}
            </div>
          </div>
        </div>
      </section>

      {/* Main Dashboard Layout */}
      <div className="dashboard-grid-layout">
        {/* Card 1: Patient Identity & Insurance Pre-Auth (Spans 2 columns) */}
        <div className="card grid-col-span-2">
          <h3 style={{ marginBottom: '1.25rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Check size={18} style={{ color: 'var(--success)' }} /> Patient Identity Verification & Insurance Pre-Auth
          </h3>
          <div className="dashboard-row-grid">
            <div className="subpanel subpanel-cyan">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Patient Name</span>
                <strong style={{ color: 'var(--text-main)' }}>{user?.name || 'Alex Mercer'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>DOB Authentication</span>
                <strong style={{ color: 'var(--success)' }}>July 24, 1995 (VERIFIED)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>EHR Record Link</span>
                <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-main)' }}>#EHR-9831A (Active)</span>
              </div>
            </div>

            <div className="subpanel subpanel-amber">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Insurance Provider</span>
                <strong style={{ color: 'var(--text-main)' }}>BlueCross Shield</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Policy Group ID</span>
                <strong style={{ color: 'var(--text-main)' }}>98124</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Est. Out-of-pocket</span>
                <strong style={{ color: 'var(--warning)', fontSize: '1.05rem' }}>$45.00</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Outbound SMS Activity Logs Feed (Spans 3 rows on the right) */}
        <div className="card sms-panel-container grid-row-span-3">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <MessageSquare size={18} style={{ color: 'var(--secondary)' }} /> Outbound Transactional SMS Logs
          </h3>
          <div className="sms-feed-list" style={{ flex: 1, overflowY: 'auto' }}>
            {smsMessages.map((sms) => (
              <div key={sms.id} className="sms-message-card">
                <div className="sms-meta-row">
                  <span style={{ fontWeight: 700 }}>To: {sms.recipient}</span>
                  <span>{new Date(sms.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className="sms-phone-bubble">
                  {sms.text}
                </div>
              </div>
            ))}
            {smsMessages.length === 0 && (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No transactional SMS alerts logged.
              </div>
            )}
          </div>
        </div>

        {/* Card 3: Post-Discharge scorecard */}
        <div className="card">
          <h3 style={{ marginBottom: '1.25rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={18} style={{ color: 'var(--secondary)' }} /> Post-Discharge Scorecard
          </h3>
          <div className="subpanel subpanel-green subpanel-fill">
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>48h Post-Op Survey</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Today</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.35rem', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Pain Level:</span> <strong style={{ color: 'var(--text-main)' }}>3 / 10</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Wound status:</span> <strong style={{ color: 'var(--success)' }}>Normal</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Food intake:</span> <strong style={{ color: 'var(--success)' }}>Tolerated</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Fever status:</span> <strong style={{ color: 'var(--success)' }}>None (98.6°F)</strong></div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '0.5rem', marginTop: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Assessment:</span>
              <span className="badge badge-success" style={{ fontSize: '0.7rem', padding: '0.2rem 0.4rem' }}>STABLE (5/5 Index)</span>
            </div>
          </div>
        </div>

        {/* Card 4: Medication Adherence Tracker */}
        <div className="card">
          <h3 style={{ marginBottom: '1.25rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Pill size={18} style={{ color: 'var(--primary)' }} /> Regimen Adherence
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
            {medicines.map((med, idx) => (
              <div key={idx} style={{ background: 'rgba(255,255,255,0.01)', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '0.5rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-main)' }}>{med.name}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{med.dosage}</div>
                </div>
                <span className={`badge ${med.status === 'Taken' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.7rem', padding: '0.2rem 0.4rem' }}>
                  {med.status === 'Taken' ? 'Taken' : 'Alert Sent'}
                </span>
              </div>
            ))}
            {medicines.length === 0 && (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                No active medications.
              </div>
            )}
          </div>
        </div>

        {/* Card 5: Elder Care Welfare checks */}
        <div className="card">
          <h3 style={{ marginBottom: '1.25rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Heart size={18} style={{ color: 'var(--danger)' }} /> Elder Companion Checks
          </h3>
          <div className="subpanel subpanel-rose subpanel-fill">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.4rem', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Relative Monitoring:</span> <strong style={{ color: 'var(--text-main)' }}>Welfare Active</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Acoustic Sentiment:</span> <strong style={{ color: 'var(--success)' }}>Stable / Cozy</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Cognitive Decline:</span> <strong style={{ color: 'var(--success)' }}>Negative (0 Alerts)</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Background Cue:</span> <strong style={{ color: 'var(--text-secondary)' }}>Normal environment</strong></div>
            </div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.5rem', marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Daily Welfare Call status: <span style={{ color: 'var(--success)', fontWeight: 700 }}>Pass</span>
            </div>
          </div>
        </div>

        {/* Card 6: Conversational Diagnostics & EHR slots */}
        <div className="card">
          <h3 style={{ marginBottom: '1.25rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={18} style={{ color: 'var(--primary-hover)' }} /> Diagnostics Registry
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
            {appointments.map((appt, idx) => (
              <div key={idx} style={{ background: 'rgba(255,255,255,0.01)', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-main)' }}>{appt.doctor}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{appt.date} at {appt.time}</div>
                </div>
                <span className={`badge ${appt.status === 'Confirmed' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.7rem', padding: '0.2rem 0.4rem' }}>
                  {appt.status}
                </span>
              </div>
            ))}
            {appointments.length === 0 && (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                No scheduled diagnostics slots.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
