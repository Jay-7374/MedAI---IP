import React, { useState, useEffect, useMemo } from 'react';
import {
  User,
  Shield,
  Phone,
  Save,
  Calendar,
  Mail,
  MapPin,
  Droplets,
  Ruler,
  Scale,
  Activity,
  AlertTriangle,
  FileText,
  Heart,
  Sliders,
  Sparkles,
  Volume2,
  Bell,
  Globe,
  CheckCircle2,
  RotateCcw
} from 'lucide-react';
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

  const [preferences, setPreferences] = useState({
    voiceLang: 'English',
    autoAudio: true,
    reminders: true
  });

  const [activeTab, setActiveTab] = useState('all');
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

  // Calculate profile completion percentage
  const completionPercentage = useMemo(() => {
    const totalFields = Object.keys(formData).length;
    const filledFields = Object.values(formData).filter(
      (val) => val !== null && val !== undefined && String(val).trim() !== ''
    ).length;
    return Math.round((filledFields / totalFields) * 100);
  }, [formData]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePrefChange = (key, val) => {
    setPreferences((prev) => ({ ...prev, [key]: val }));
  };

  const handleReset = () => {
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
      showToast('Form reset to saved profile data', 'info');
    }
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
        showToast('Profile updated successfully!', 'success');
      } else {
        const err = await res.json();
        showToast(err.detail || 'Failed to update profile', 'danger');
      }
    } catch (err) {
      showToast('Error saving profile settings.', 'danger');
    }
    setLoading(false);
  };

  // Extract initials for avatar display
  const userInitials = useMemo(() => {
    if (!formData.full_name) return 'JP';
    const parts = formData.full_name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return formData.full_name.slice(0, 2).toUpperCase();
  }, [formData.full_name]);

  return (
    <div className="settings-view-container">
      {/* ===== HEADER CARD ===== */}
      <div className="settings-header-card">
        <div className="settings-user-info">
          <div className="settings-avatar-wrapper">
            <div className="settings-avatar">{userInitials}</div>
            <div className="settings-avatar-badge" title="Active Account" />
          </div>
          <div className="settings-header-titles">
            <h2>Patient Profile & Settings</h2>
            <p>Manage your health record, contact details, and system preferences</p>
          </div>
        </div>

        <div className="settings-progress-card">
          <div className="settings-progress-info">
            <span className="settings-progress-label">Profile Strength</span>
            <span className="settings-progress-value">{completionPercentage}% Complete</span>
          </div>
          <div className="settings-progress-bar-bg">
            <div
              className="settings-progress-bar-fill"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* ===== TABS NAVIGATION ===== */}
      <div className="settings-tabs-nav">
        <button
          type="button"
          className={`settings-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          <Sliders size={16} /> All Settings
        </button>
        <button
          type="button"
          className={`settings-tab-btn ${activeTab === 'personal' ? 'active' : ''}`}
          onClick={() => setActiveTab('personal')}
        >
          <User size={16} /> Personal Details
        </button>
        <button
          type="button"
          className={`settings-tab-btn ${activeTab === 'medical' ? 'active' : ''}`}
          onClick={() => setActiveTab('medical')}
        >
          <Shield size={16} /> Medical & Insurance
        </button>
        <button
          type="button"
          className={`settings-tab-btn ${activeTab === 'emergency' ? 'active' : ''}`}
          onClick={() => setActiveTab('emergency')}
        >
          <Phone size={16} /> Emergency Contacts
        </button>
        <button
          type="button"
          className={`settings-tab-btn ${activeTab === 'preferences' ? 'active' : ''}`}
          onClick={() => setActiveTab('preferences')}
        >
          <Sparkles size={16} /> App & AI Preferences
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        {/* ===== PERSONAL INFORMATION SECTION ===== */}
        {(activeTab === 'all' || activeTab === 'personal') && (
          <div className="settings-section-card">
            <div className="settings-section-header">
              <div className="settings-icon-badge">
                <User size={22} />
              </div>
              <div className="settings-section-header-text">
                <h3>Personal Information</h3>
                <p>Basic identity and contact details used for appointments and records</p>
              </div>
            </div>

            <div className="settings-form-grid">
              <div className="settings-form-group">
                <label className="settings-form-label">Full Name</label>
                <div className="settings-input-wrapper">
                  <User size={18} className="settings-input-icon" />
                  <input
                    type="text"
                    name="full_name"
                    className="settings-input"
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>

              <div className="settings-form-group">
                <label className="settings-form-label">Date of Birth</label>
                <div className="settings-input-wrapper">
                  <Calendar size={18} className="settings-input-icon" />
                  <input
                    type="date"
                    name="dob"
                    className="settings-input"
                    value={formData.dob}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="settings-form-group">
                <label className="settings-form-label">Gender</label>
                <div className="settings-input-wrapper">
                  <User size={18} className="settings-input-icon" />
                  <select
                    name="gender"
                    className="settings-select"
                    value={formData.gender}
                    onChange={handleChange}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="settings-form-group">
                <label className="settings-form-label">Blood Group</label>
                <div className="settings-input-wrapper">
                  <Droplets size={18} className="settings-input-icon" />
                  <input
                    type="text"
                    name="blood_group"
                    className="settings-input"
                    value={formData.blood_group}
                    onChange={handleChange}
                    placeholder="e.g. O+, A-, B+"
                  />
                </div>
              </div>

              <div className="settings-form-group">
                <label className="settings-form-label">Height</label>
                <div className="settings-input-wrapper">
                  <Ruler size={18} className="settings-input-icon" />
                  <input
                    type="text"
                    name="height"
                    className="settings-input"
                    value={formData.height}
                    onChange={handleChange}
                    placeholder="e.g., 184 cm or 6'0&quot;"
                  />
                </div>
              </div>

              <div className="settings-form-group">
                <label className="settings-form-label">Weight</label>
                <div className="settings-input-wrapper">
                  <Scale size={18} className="settings-input-icon" />
                  <input
                    type="text"
                    name="weight"
                    className="settings-input"
                    value={formData.weight}
                    onChange={handleChange}
                    placeholder="e.g., 72 kg or 160 lbs"
                  />
                </div>
              </div>

              <div className="settings-form-group">
                <label className="settings-form-label">Phone Number</label>
                <div className="settings-input-wrapper">
                  <Phone size={18} className="settings-input-icon" />
                  <input
                    type="tel"
                    name="phone"
                    className="settings-input"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              <div className="settings-form-group">
                <label className="settings-form-label">Email Address</label>
                <div className="settings-input-wrapper">
                  <Mail size={18} className="settings-input-icon" />
                  <input
                    type="email"
                    name="email"
                    className="settings-input"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="patient@example.com"
                  />
                </div>
              </div>

              <div className="settings-form-group full-width">
                <label className="settings-form-label">Residential Address</label>
                <div className="settings-input-wrapper">
                  <MapPin size={18} className="settings-input-icon" style={{ top: '16px' }} />
                  <textarea
                    name="address"
                    className="settings-textarea"
                    value={formData.address}
                    onChange={handleChange}
                    rows={2}
                    placeholder="Street address, city, state, postal code"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== MEDICAL & INSURANCE SECTION ===== */}
        {(activeTab === 'all' || activeTab === 'medical') && (
          <div className="settings-section-card">
            <div className="settings-section-header">
              <div className="settings-icon-badge">
                <Shield size={22} />
              </div>
              <div className="settings-section-header-text">
                <h3>Medical & Insurance Information</h3>
                <p>Health history, allergies, and active insurance coverage details</p>
              </div>
            </div>

            <div className="settings-form-grid">
              <div className="settings-form-group full-width">
                <label className="settings-form-label">Existing Medical Conditions</label>
                <div className="settings-input-wrapper">
                  <Activity size={18} className="settings-input-icon" style={{ top: '16px' }} />
                  <textarea
                    name="medical_conditions"
                    className="settings-textarea"
                    value={formData.medical_conditions}
                    onChange={handleChange}
                    rows={3}
                    placeholder="e.g., Diabetes Type 2, Hypertension, Asthma"
                  />
                </div>
              </div>

              <div className="settings-form-group full-width">
                <label className="settings-form-label">Allergies & Sensitivities</label>
                <div className="settings-input-wrapper">
                  <AlertTriangle size={18} className="settings-input-icon" style={{ top: '16px' }} />
                  <textarea
                    name="allergies"
                    className="settings-textarea"
                    value={formData.allergies}
                    onChange={handleChange}
                    rows={2}
                    placeholder="e.g., Penicillin, Peanuts, Latex"
                  />
                </div>
              </div>

              <div className="settings-form-group">
                <label className="settings-form-label">Insurance Provider</label>
                <div className="settings-input-wrapper">
                  <Shield size={18} className="settings-input-icon" />
                  <input
                    type="text"
                    name="insurance_provider"
                    className="settings-input"
                    value={formData.insurance_provider}
                    onChange={handleChange}
                    placeholder="e.g., Blue Cross, Aetna, Cigna"
                  />
                </div>
              </div>

              <div className="settings-form-group">
                <label className="settings-form-label">Insurance ID / Policy Number</label>
                <div className="settings-input-wrapper">
                  <FileText size={18} className="settings-input-icon" />
                  <input
                    type="text"
                    name="insurance_id"
                    className="settings-input"
                    value={formData.insurance_id}
                    onChange={handleChange}
                    placeholder="e.g., POL-99882241"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== EMERGENCY CONTACT SECTION ===== */}
        {(activeTab === 'all' || activeTab === 'emergency') && (
          <div className="settings-section-card">
            <div className="settings-section-header">
              <div className="settings-icon-badge">
                <Phone size={22} />
              </div>
              <div className="settings-section-header-text">
                <h3>Emergency Contact Details</h3>
                <p>Designated contact person reached during critical medical situations</p>
              </div>
            </div>

            <div className="settings-form-grid">
              <div className="settings-form-group">
                <label className="settings-form-label">Contact Name</label>
                <div className="settings-input-wrapper">
                  <User size={18} className="settings-input-icon" />
                  <input
                    type="text"
                    name="emergency_name"
                    className="settings-input"
                    value={formData.emergency_name}
                    onChange={handleChange}
                    placeholder="Primary contact person"
                  />
                </div>
              </div>

              <div className="settings-form-group">
                <label className="settings-form-label">Relationship</label>
                <div className="settings-input-wrapper">
                  <Heart size={18} className="settings-input-icon" />
                  <input
                    type="text"
                    name="emergency_relation"
                    className="settings-input"
                    value={formData.emergency_relation}
                    onChange={handleChange}
                    placeholder="e.g., Spouse, Parent, Friend"
                  />
                </div>
              </div>

              <div className="settings-form-group">
                <label className="settings-form-label">Contact Phone</label>
                <div className="settings-input-wrapper">
                  <Phone size={18} className="settings-input-icon" />
                  <input
                    type="tel"
                    name="emergency_phone"
                    className="settings-input"
                    value={formData.emergency_phone}
                    onChange={handleChange}
                    placeholder="+1 (555) 999-0000"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== APP & AI PREFERENCES SECTION ===== */}
        {(activeTab === 'all' || activeTab === 'preferences') && (
          <div className="settings-section-card">
            <div className="settings-section-header">
              <div className="settings-icon-badge">
                <Sparkles size={22} />
              </div>
              <div className="settings-section-header-text">
                <h3>App & AI Assistant Preferences</h3>
                <p>Customize voice interaction, spoken response output, and alerts</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="settings-pref-row">
                <div className="settings-pref-info">
                  <h4>Default Voice & Chat Language</h4>
                  <p>Language used by the SALUS AI Assistant for voice conversations</p>
                </div>
                <div className="settings-input-wrapper" style={{ width: '180px' }}>
                  <Globe size={18} className="settings-input-icon" />
                  <select
                    className="settings-select"
                    value={preferences.voiceLang}
                    onChange={(e) => handlePrefChange('voiceLang', e.target.value)}
                  >
                    <option value="English">English</option>
                    <option value="Spanish">Spanish</option>
                    <option value="Hindi">Hindi</option>
                    <option value="French">French</option>
                    <option value="German">German</option>
                  </select>
                </div>
              </div>

              <div className="settings-pref-row">
                <div className="settings-pref-info">
                  <h4>Automatic Text-to-Speech (TTS)</h4>
                  <p>Automatically speak response audio during active AI conversations</p>
                </div>
                <label className="settings-switch">
                  <input
                    type="checkbox"
                    checked={preferences.autoAudio}
                    onChange={(e) => handlePrefChange('autoAudio', e.target.checked)}
                  />
                  <span className="settings-slider" />
                </label>
              </div>

              <div className="settings-pref-row">
                <div className="settings-pref-info">
                  <h4>Medication & Appointment Reminders</h4>
                  <p>Receive notifications for scheduled doses and clinic visits</p>
                </div>
                <label className="settings-switch">
                  <input
                    type="checkbox"
                    checked={preferences.reminders}
                    onChange={(e) => handlePrefChange('reminders', e.target.checked)}
                  />
                  <span className="settings-slider" />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* ===== STICKY ACTION BAR ===== */}
        <div className="settings-actions-bar">
          <button
            type="button"
            className="settings-btn-secondary"
            onClick={handleReset}
            disabled={loading}
          >
            <RotateCcw size={16} style={{ display: 'inline', marginRight: '0.4rem' }} />
            Discard Changes
          </button>

          <button
            type="submit"
            className="settings-btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="settings-spinner" /> Saving Profile...
              </>
            ) : (
              <>
                <Save size={18} /> Save Profile & Settings
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
