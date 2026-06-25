import React from 'react';
import { Plus, Clock } from 'lucide-react';

export default function Scheduling({ 
  appointments, 
  apptForm, 
  setApptForm, 
  handleBookAppointment 
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.9fr', gap: '1.75rem' }}>
      <div className="card">
        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem', fontWeight: 700 }}>Book Appointment or Diagnostics</h3>
        <form onSubmit={handleBookAppointment}>
          <div className="form-group">
            <label className="form-label">Practitioner Specialty / Node</label>
            <select 
              className="form-control" 
              value={apptForm.doctor}
              onChange={(e) => setApptForm(prev => ({ ...prev, doctor: e.target.value }))}
              required
            >
              <option value="">Select Option...</option>
              <option value="Dr. Reed">Dr. Evelyn Reed (Cardiology Specialist)</option>
              <option value="Dr. Vance">Dr. Marcus Vance (Neurology Specialist)</option>
              <option value="Dr. Foster">Dr. Sarah Foster (Pediatrics Specialist)</option>
              <option value="Radiology Chest X-Ray">Radiology Floor (Chest X-Ray Diagnostic)</option>
              <option value="Diagnostic Ultrasound">Diagnostics Lab (Abdomen Ultrasound)</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Target Date</label>
            <input 
              type="date" 
              className="form-control" 
              value={apptForm.date}
              onChange={(e) => setApptForm(prev => ({ ...prev, date: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Target Time</label>
            <input 
              type="time" 
              className="form-control" 
              value={apptForm.time}
              onChange={(e) => setApptForm(prev => ({ ...prev, time: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Clinical Indication / Symptoms</label>
            <textarea 
              className="form-control" 
              rows={3} 
              value={apptForm.symptoms}
              onChange={(e) => setApptForm(prev => ({ ...prev, symptoms: e.target.value }))}
              style={{ resize: 'none' }}
              placeholder="Describe symptoms briefly..."
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
            <Plus size={18} /> Schedule Appointment
          </button>
        </form>
      </div>

      <div>
        <h3 style={{ marginBottom: '1.25rem', fontSize: '1.2rem', fontWeight: 700 }}>EHR Scheduling Registry</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {appointments.map((appt, idx) => (
            <div key={idx} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                <div className="avatar-md">
                  {appt.doctor.split(' ').pop().slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{appt.doctor}</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>{appt.specialty}</p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} /> Date: {appt.date} at {appt.time}
                  </p>
                  {appt.symptoms && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      Symptoms: <i>{appt.symptoms}</i>
                    </p>
                  )}
                </div>
              </div>
              <span className={`badge ${appt.status === 'Confirmed' ? 'badge-success' : 'badge-warning'}`} style={{ fontWeight: 700 }}>
                {appt.status}
              </span>
            </div>
          ))}
          {appointments.length === 0 && (
            <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>
              No booked consultations in database.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
