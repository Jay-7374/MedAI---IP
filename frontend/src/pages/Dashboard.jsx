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
  FileCheck,
  User,
  ShieldCheck,
  Clock,
  Droplet,
  Moon
} from 'lucide-react';

export default function Dashboard({ 
  user, 
  patientProfile,
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
              <Shield size={18} style={{ color: 'var(--primary-hover)' }} /> Salus System Overview
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
    <div className="view-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Row Grid: Patient Wellness Metrics */}
      <section className="metrics-grid">
        <div className="card metric-card pulse">
          <div className="metric-icon metric-icon-pulse">
            <Heart size={24} />
          </div>
          <div className="metric-details">
            <h4 style={{ fontSize: 'var(--font-meta)', fontWeight: 600 }}>Heart Rate</h4>
            <div className="metric-value" style={{ fontSize: '1.5rem' }}>
              72 <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>bpm</span>
            </div>
          </div>
        </div>

        <div className="card metric-card oxygen">
          <div className="metric-icon metric-icon-oxygen">
            <Droplet size={24} />
          </div>
          <div className="metric-details">
            <h4 style={{ fontSize: 'var(--font-meta)', fontWeight: 600 }}>Blood Oxygen</h4>
            <div className="metric-value" style={{ fontSize: '1.5rem' }}>
              98% <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Optimal</span>
            </div>
          </div>
        </div>

        <div className="card metric-card bp">
          <div className="metric-icon metric-icon-bp">
            <ActivitySquare size={24} />
          </div>
          <div className="metric-details">
            <h4 style={{ fontSize: 'var(--font-meta)', fontWeight: 600 }}>Activity Today</h4>
            <div className="metric-value" style={{ fontSize: '1.5rem' }}>
              3,240 <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>steps</span>
            </div>
          </div>
        </div>

        <div className="card metric-card temp">
          <div className="metric-icon metric-icon-temp">
            <Moon size={24} />
          </div>
          <div className="metric-details">
            <h4 style={{ fontSize: 'var(--font-meta)', fontWeight: 600 }}>Sleep Quality</h4>
            <div className="metric-value" style={{ fontSize: '1.5rem' }}>
              7h 12m <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Good</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Dashboard Layout */}
      <div className="dashboard-grid-layout" style={{ marginTop: '0', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1.5rem' }}>
        
        {/* Left Column (2 spans): Patient Profile & AI Summary */}
        <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Patient Profile Card */}
          <div className="card">
            <h3 style={{ fontSize: 'var(--font-card-title)', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={20} style={{ color: 'var(--primary)' }} /> Patient Identity
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-meta)', marginBottom: '0.25rem' }}>Full Name</div>
                <div style={{ color: 'var(--text-main)', fontSize: 'var(--font-body)', fontWeight: 600 }}>{patientProfile?.full_name || user?.name || 'N/A'}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-meta)', marginBottom: '0.25rem' }}>Age</div>
                <div style={{ color: 'var(--success)', fontSize: 'var(--font-body)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {patientProfile?.age || 'N/A'} Years <ShieldCheck size={16} />
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-meta)', marginBottom: '0.25rem' }}>Insurance Provider</div>
                <div style={{ color: 'var(--text-main)', fontSize: 'var(--font-body)', fontWeight: 600 }}>{patientProfile?.insurance_provider || 'N/A'}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-meta)', marginBottom: '0.25rem' }}>Blood Group</div>
                <div style={{ color: 'var(--text-main)', fontSize: 'var(--font-body)', fontWeight: 600 }}>{patientProfile?.blood_group || 'N/A'}</div>
              </div>
              <div style={{ gridColumn: 'span 2', borderTop: '1px solid var(--card-border)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-meta)', marginBottom: '0.25rem' }}>Emergency Contact</div>
                <div style={{ color: 'var(--text-main)', fontSize: 'var(--font-body)', fontWeight: 600 }}>{patientProfile?.emergency_name || 'N/A'} ({patientProfile?.emergency_relation || 'N/A'}) • {patientProfile?.emergency_phone || 'N/A'}</div>
              </div>
            </div>
          </div>

          {/* AI Summary Card */}
          <div className="card" style={{ background: 'linear-gradient(145deg, rgba(20, 134, 109, 0.05) 0%, rgba(44, 184, 156, 0.1) 100%)' }}>
            <h3 style={{ fontSize: 'var(--font-card-title)', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={20} style={{ color: 'var(--primary)' }} /> AI Summary
            </h3>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: 'var(--font-body)', color: 'var(--text-main)', fontWeight: 500 }}>
                <Check size={18} style={{ color: 'var(--success)' }} />
                <span>{medicines.some(m => m.status === 'Taken') ? 'Medication taken on schedule' : 'Medication adherence tracked'}</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: 'var(--font-body)', color: 'var(--text-main)', fontWeight: 500 }}>
                <Check size={18} style={{ color: 'var(--success)' }} />
                <span>Vitals stable and within optimal ranges</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: 'var(--font-body)', color: 'var(--text-main)', fontWeight: 500 }}>
                <Calendar size={18} style={{ color: 'var(--secondary)' }} />
                <span>{appointments.length > 0 ? `Upcoming appointment: ${appointments[0].date}` : 'No upcoming appointments'}</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: 'var(--font-body)', color: 'var(--text-main)', fontWeight: 500 }}>
                {sosStatus ? <AlertTriangle size={18} style={{ color: 'var(--danger)' }} /> : <ShieldCheck size={18} style={{ color: 'var(--success)' }} />}
                <span>{sosStatus ? 'Emergency response active' : 'No emergency detected'}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Center Column (1 span): Medication Timeline & SOS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Medication Card Redesign */}
          <div className="card" style={{ flex: 1 }}>
            <h3 style={{ fontSize: 'var(--font-card-title)', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Pill size={20} style={{ color: 'var(--secondary)' }} /> Medicine Schedule
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '11px', top: '24px', bottom: '-12px', width: '2px', background: 'var(--card-border)' }}></div>
                
                <div style={{ display: 'flex', gap: '1rem', position: 'relative', marginBottom: '1.5rem' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', zIndex: 1, flexShrink: 0 }}>
                    <Pill size={14} />
                  </div>
                  <div style={{ width: '100%' }}>
                    {medicines.map((med, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid var(--card-border)' }}>
                        <div>
                          <div style={{ fontSize: 'var(--font-body)', fontWeight: 600, color: 'var(--text-main)' }}>{med.medicine_name || med.name}</div>
                          <div style={{ fontSize: 'var(--font-meta)', color: 'var(--text-secondary)' }}>{med.dosage} • {med.frequency || med.freq}</div>
                        </div>
                        <div style={{ fontSize: 'var(--font-meta)', color: 'var(--text-secondary)', fontWeight: 600 }}>{med.time || 'Anytime'}</div>
                      </div>
                    ))}
                    {medicines.length === 0 && <div style={{ fontSize: 'var(--font-body)', color: 'var(--text-muted)' }}>No meds scheduled</div>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SOS State Card */}
          <div className="card" style={{ 
            background: sosStatus ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
            borderColor: sosStatus ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem', textAlign: 'center' 
          }}>
            <div style={{ 
              width: '48px', height: '48px', borderRadius: '50%', 
              background: sosStatus ? 'var(--danger)' : 'var(--success)', 
              color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' 
            }}>
              {sosStatus ? <AlertTriangle size={24} /> : <ShieldCheck size={24} />}
            </div>
            <h3 style={{ fontSize: 'var(--font-card-title)', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
              {sosStatus ? 'Emergency' : 'Safe'}
            </h3>
            <div style={{ fontSize: 'var(--font-body)', color: 'var(--text-secondary)', fontWeight: 500 }}>
              {sosStatus ? 'Alert Sent & Monitoring' : 'No emergency detected'}
            </div>
          </div>

        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ flex: 1, overflowY: 'auto', maxHeight: '700px' }}>
            <h3 style={{ fontSize: 'var(--font-card-title)', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={20} style={{ color: 'var(--primary)' }} /> Appointments
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {appointments.length > 0 ? appointments.map((appt, i) => {
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-meta)', fontWeight: 600, marginBottom: '4px' }}>
                      {appt.date} at {appt.time}
                    </div>
                    <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-sm)', padding: '1rem', fontSize: 'var(--font-body)', color: 'var(--text-main)', fontWeight: 500 }}>
                      <div style={{ fontWeight: 600 }}>{appt.doctor}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{appt.symptoms || 'General Checkup'}</div>
                    </div>
                    {i !== appointments.length - 1 && (
                      <div style={{ height: '24px', width: '2px', background: 'var(--card-border)', marginLeft: '1rem', marginTop: '8px' }}></div>
                    )}
                  </div>
                );
              }) : (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    No upcoming appointments.
                  </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
