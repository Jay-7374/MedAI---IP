import React, { useState, useEffect } from 'react';
import { Save, User, Shield, AlertTriangle, Phone } from 'lucide-react';
import { apiFetch } from '../apiClient';

export default function Settings({ patientProfile, showToast, setPatientProfile }) {
  const [formData, setFormData] = useState({
    full_name: '',
    dob: '',
    gender: '',
    blood_group: '',
    height: '',
    weight: '',
    phone: '',
    email: '',
    address: '',
    insurance_provider: '',
    insurance_id: '',
    medical_conditions: '',
    allergies: '',
    emergency_name: '',
    emergency_relation: '',
    emergency_phone: ''
  });
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (patientProfile) {
      setFormData({
        full_name: patientProfile.full_name || '',
        dob: patientProfile.dob || '',
        gender: patientProfile.gender || '',
        blood_group: patientProfile.blood_group || '',
        height: patientProfile.height || '',
        weight: patientProfile.weight || '',
        phone: patientProfile.phone || '',
        email: patientProfile.email || '',
        address: patientProfile.address || '',
        insurance_provider: patientProfile.insurance_provider || '',
        insurance_id: patientProfile.insurance_id || '',
        medical_conditions: patientProfile.medical_conditions || '',
        allergies: patientProfile.allergies || '',
        emergency_name: patientProfile.emergency_name || '',
        emergency_relation: patientProfile.emergency_relation || '',
        emergency_phone: patientProfile.emergency_phone || ''
      });
    }
  }, [patientProfile]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiFetch('/api/patients/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        const updated = await res.json();
        setPatientProfile(updated);
        showToast('Profile updated successfully', 'success');
      } else {
        const err = await res.json();
        showToast(err.detail || 'Failed to update profile', 'danger');
      }
    } catch (err) {
      showToast('Error saving profile.', 'danger');
    }
    setLoading(false);
  };

  return (
    <div className="telemedicine-view" style={{ maxWidth: '900px', margin: '0 auto', background: 'transparent' }}>
      <div className="glass-card" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <User size={32} style={{ color: 'var(--primary)' }} />
          <div>
            <h2 style={{ fontSize: 'var(--font-title)', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>Edit Patient Profile</h2>
            <p style={{ color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>Manage your personal, medical, and emergency contact details</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div style={{ background: 'var(--bg-inner)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={18} /> Personal Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              <div>
                <label>Full Name</label>
                <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} required />
              </div>
              <div>
                <label>Date of Birth</label>
                <input type="date" name="dob" value={formData.dob} onChange={handleChange} />
              </div>
              <div>
                <label>Gender</label>
                <select name="gender" value={formData.gender} onChange={handleChange}>
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label>Blood Group</label>
                <input type="text" name="blood_group" value={formData.blood_group} onChange={handleChange} />
              </div>
              <div>
                <label>Height</label>
                <input type="text" name="height" value={formData.height} onChange={handleChange} placeholder="e.g., 5'10&quot;" />
              </div>
              <div>
                <label>Weight</label>
                <input type="text" name="weight" value={formData.weight} onChange={handleChange} placeholder="e.g., 160 lbs" />
              </div>
              <div>
                <label>Phone Number</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} />
              </div>
              <div>
                <label>Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label>Address</label>
                <textarea name="address" value={formData.address} onChange={handleChange} rows="2"></textarea>
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--bg-inner)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield size={18} /> Medical Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
              <div>
                <label>Existing Medical Conditions</label>
                <textarea name="medical_conditions" value={formData.medical_conditions} onChange={handleChange} rows="3" placeholder="Diabetes, Hypertension, etc."></textarea>
              </div>
              <div>
                <label>Allergies</label>
                <textarea name="allergies" value={formData.allergies} onChange={handleChange} rows="2" placeholder="Peanuts, Penicillin, etc."></textarea>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                <div>
                  <label>Insurance Provider</label>
                  <input type="text" name="insurance_provider" value={formData.insurance_provider} onChange={handleChange} />
                </div>
                <div>
                  <label>Insurance ID / Policy Number</label>
                  <input type="text" name="insurance_id" value={formData.insurance_id} onChange={handleChange} />
                </div>
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--bg-inner)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Phone size={18} /> Emergency Contact
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <label>Contact Name</label>
                <input type="text" name="emergency_name" value={formData.emergency_name} onChange={handleChange} />
              </div>
              <div>
                <label>Relationship</label>
                <input type="text" name="emergency_relation" value={formData.emergency_relation} onChange={handleChange} />
              </div>
              <div>
                <label>Contact Phone</label>
                <input type="tel" name="emergency_phone" value={formData.emergency_phone} onChange={handleChange} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 2rem' }}>
              <Save size={20} /> {loading ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
          
        </form>
      </div>
    </div>
  );
}
