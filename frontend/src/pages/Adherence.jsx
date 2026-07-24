import React from 'react';
import { Plus, Clock, Trash2 } from 'lucide-react';

export default function Adherence({ 
  medicines, 
  medForm, 
  setMedForm, 
  handleAddMedicine, 
  handleDeleteMedicine 
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.9fr', gap: '1.75rem' }}>
      <div className="card">
        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem', fontWeight: 700 }}>Configure Medication Directives</h3>
        <form onSubmit={handleAddMedicine}>
          <div className="form-group">
            <label className="form-label">Medication Name</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="e.g., Lisinopril"
              value={medForm.medicine_name}
              onChange={(e) => setMedForm(prev => ({ ...prev, medicine_name: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Dosage Measure</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="e.g., 10mg"
              value={medForm.dosage}
              onChange={(e) => setMedForm(prev => ({ ...prev, dosage: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Frequency</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="e.g., Once daily"
              value={medForm.frequency}
              onChange={(e) => setMedForm(prev => ({ ...prev, frequency: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Adherence Alert Time</label>
            <input 
              type="time" 
              className="form-control" 
              value={medForm.time}
              onChange={(e) => setMedForm(prev => ({ ...prev, time: e.target.value }))}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
            <Plus size={18} /> Add Adherence Directive
          </button>
        </form>
      </div>

      <div>
        <h3 style={{ marginBottom: '1.25rem', fontSize: '1.2rem', fontWeight: 700 }}>Medication Adherence Checklist</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.25rem' }}>
          {medicines.map((med, idx) => (
            <div key={idx} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ color: 'var(--primary)', fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>{med.medicine_name || med.name}</h4>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Dosage: <strong>{med.dosage}</strong></span><br/>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Freq: <strong>{med.frequency || med.freq}</strong></span>
                </div>
                <span className={`badge ${med.status === 'Taken' ? 'badge-success' : 'badge-warning'}`}>
                  {med.status || 'Pending'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={12} /> alert at: {med.time || 'Anytime'}
                </p>
                <button className="btn btn-secondary" onClick={() => handleDeleteMedicine(med.id)} style={{ padding: '0.4rem 0.6rem', color: 'var(--danger)', borderRadius: '10px' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          {medicines.length === 0 && (
            <div className="card" style={{ gridColumn: 'span 2', textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>
              No active medical regimen streams loaded.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
