import React, { useState, useEffect } from 'react';
import { apiFetch } from '../apiClient';
import { 
  Heart, 
  Activity, 
  ActivitySquare, 
  FileText, 
  Video, 
  Clock, 
  Check, 
  UserCheck, 
  Calendar,
  AlertTriangle
} from 'lucide-react';

export default function StaffConsole({ 
  appointments, 
  medicines, 
  vitals, 
  sosStatus, 
  navigateTo, 
  showToast 
}) {
  const [patientGrid, setPatientGrid] = useState([]);
  const [activePatient, setActivePatient] = useState(null);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await apiFetch('/api/patients/all');
        if (res.ok) {
          const data = await res.json();
          // Map to match the expected structure
          const mapped = data.map(p => ({
            name: p.full_name || p.user?.name || 'Unknown',
            age: p.age || 'N/A',
            condition: p.medical_conditions || 'General Checkup',
            heartrate: vitals.heartrate, 
            spo2: vitals.spo2, 
            temp: vitals.temperature, 
            bp: vitals.bloodPressure, 
            status: 'Stable'
          }));
          setPatientGrid(mapped);
          if (mapped.length > 0) setActivePatient(mapped[0].name);
        }
      } catch (err) {
        console.error("Failed to fetch patients", err);
      }
    };
    fetchPatients();
  }, [vitals]);

  const currentPatient = patientGrid.find(p => p.name === activePatient) || null;

  return (
    <div className="view-fade-in" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '1.75rem' }}>
      
      {/* COLUMN 1: Clinical Patient Directory Vitals Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="card">
          <h3 style={{ marginBottom: '1.25rem', fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ActivitySquare size={20} style={{ color: 'var(--success)' }} /> Patient Monitoring Vitals Grid
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {patientGrid.map((p, idx) => (
              <div 
                key={idx} 
                className={`patient-list-card ${activePatient === p.name ? 'active-clinical-card' : ''}`}
                onClick={() => setActivePatient(p.name)}
                style={{
                  background: activePatient === p.name ? 'rgba(64, 224, 208, 0.08)' : 'rgba(255, 255, 255, 0.01)',
                  border: activePatient === p.name ? '1px solid var(--primary)' : '1px solid var(--border)',
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'var(--transition)'
                }}
              >
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>{p.name}</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{p.condition}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: '0.75rem' }}>
                    <span>{p.heartrate} BPM</span>
                    <span style={{ color: 'var(--text-muted)' }}>{p.spo2}% SpO2</span>
                  </div>
                  <span className={`badge ${p.status === 'Warning' ? 'badge-warning' : 'badge-success'}`}>
                    {p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SOS dispatch box inside staff portal if active */}
        <div className="card" style={{ border: sosStatus ? '1px solid rgba(231,111,81,0.3)' : '1px solid var(--border)' }}>
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: sosStatus ? 'var(--danger)' : 'var(--text-main)' }}>
            <AlertTriangle size={18} /> Active Emergency Alert Logs
          </h3>
          {sosStatus ? (
            <div style={{ background: 'rgba(231, 111, 81, 0.03)', padding: '1rem', borderRadius: '10px' }}>
              <div style={{ fontWeight: 800, color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="pulse-dot" style={{ background: 'var(--danger)', boxShadow: '0 0 8px var(--danger)' }}></span>
                ESI LEVEL 1 CRITICAL DISPATCH
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', marginTop: '8px' }}>
                <div>Patient Target: <strong>{activePatient}</strong></div>
                <div>Allocated Vector: <strong>{sosStatus.unit}</strong></div>
                <div>Arrival ETA: <strong>{sosStatus.eta_minutes} mins</strong></div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Signal Logged at: {new Date(sosStatus.timestamp).toLocaleTimeString()}</div>
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem 0' }}>
              No critical first responder signals active.
            </p>
          )}
        </div>
      </div>

      {/* COLUMN 2: Selected Patient EHR Details, Surveys, and Consult Queue */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Active Patient Card Profile Header */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
            <div>
              <span className="badge badge-primary" style={{ textTransform: 'uppercase', fontSize: '0.7rem', padding: '0.15rem 0.4rem' }}>Selected EHR Record</span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '4px', color: 'var(--text-main)' }}>{currentPatient ? currentPatient.name : 'No Patient Selected'}</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Age {currentPatient ? currentPatient.age : '--'} • Patient Vitals Monitor</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.8rem', textAlign: 'right' }}>
              <div>BP: <strong style={{ color: 'var(--text-main)' }}>{currentPatient ? currentPatient.bp : '--'}</strong></div>
              <div>Temp: <strong style={{ color: 'var(--text-main)' }}>{currentPatient ? currentPatient.temp : '--'}°C</strong></div>
              <div>HR: <strong style={{ color: 'var(--danger)' }}>{currentPatient ? currentPatient.heartrate : '--'} BPM</strong></div>
              <div>O2: <strong style={{ color: 'var(--success)' }}>{currentPatient ? currentPatient.spo2 : '--'}%</strong></div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {/* Survey Scorecard View */}
            <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', padding: '1rem', borderRadius: '12px' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', fontWeight: 800, marginBottom: '0.75rem' }}>
                <FileText size={16} style={{ color: 'var(--success)' }} /> Automated Check-in Survey
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Pain Score (1-10):</span>
                  <strong>3 / 10</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Surgical Wound:</span>
                  <span style={{ color: 'var(--success)', fontWeight: 700 }}>Clean & Dry</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Diet Tolerated:</span>
                  <span style={{ color: 'var(--success)', fontWeight: 700 }}>Yes</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Med Reminders:</span>
                  <span style={{ color: 'var(--success)', fontWeight: 700 }}>Compliant</span>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Status:</span>
                <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>STABLE (5/5 Index)</span>
              </div>
            </div>

            {/* Medication Regimen Compliance */}
            <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', padding: '1rem', borderRadius: '12px' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', fontWeight: 800, marginBottom: '0.75rem' }}>
                <UserCheck size={16} style={{ color: 'var(--primary-hover)' }} /> Medication Adherence
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '100px', overflowY: 'auto' }}>
                {medicines.map((m, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '4px' }}>
                    <span>{m.name} ({m.dosage})</span>
                    <strong style={{ color: m.status === 'Taken' ? 'var(--success)' : 'var(--warning)' }}>{m.status}</strong>
                  </div>
                ))}
                {medicines.length === 0 && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No medication regimens config.</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Clinician Consultation Queue */}
        <div className="card">
          <h3 style={{ marginBottom: '1.25rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={18} style={{ color: 'var(--primary-hover)' }} /> Clinician Appointment Queue & Telemedicine Bridge
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {appointments.map((appt, idx) => (
              <div 
                key={idx} 
                style={{ 
                  background: 'rgba(255,255,255,0.01)', 
                  padding: '1rem', 
                  borderRadius: '12px', 
                  border: '1px solid var(--border)', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center' 
                }}
              >
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{appt.doctor} • {appt.specialty}</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} /> {appt.date} at {appt.time}
                  </p>
                  {appt.symptoms && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Clinical Symptoms: <i>{appt.symptoms}</i>
                    </p>
                  )}
                </div>
                
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  {appt.status === 'Pending' ? (
                    <>
                      <button 
                        className="btn btn-primary" 
                        onClick={() => {
                          showToast("Consultation slot confirmed.", "success");
                          appt.status = 'Confirmed';
                        }}
                        style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', borderRadius: '8px' }}
                      >
                        Confirm Slot
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="badge badge-success" style={{ fontWeight: 700 }}>{appt.status}</span>
                      <button 
                        className="btn btn-primary" 
                        onClick={() => navigateTo('telemedicine')}
                        style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', borderRadius: '8px', background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Video size={14} /> Join Video Consult
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
            {appointments.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                No clinical slots registered.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
