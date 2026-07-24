import React, { useState, useEffect } from 'react';
import { Save, User, Shield, Phone, Activity, Calendar, Mail, MapPin, Droplet, Ruler, Weight, Tag, ChevronDown, CheckCircle, Plus, X, ArrowRight, HeartPulse } from 'lucide-react';
import { apiFetch } from '../apiClient';
import './CompleteProfile.css';

export default function CompleteProfile({ user, setPatientProfile, navigateTo, showToast }) {
  // Try to load draft from localStorage
  const loadDraft = () => {
    const draft = localStorage.getItem('cp_draft_form');
    if (draft) {
      try { return JSON.parse(draft); } catch (e) {}
    }
    return null;
  };

  const initialForm = loadDraft() || {
    full_name: user?.name || '',
    dob: '',
    gender: '',
    blood_group: '',
    height: '',
    weight: '',
    phone: '',
    email: user?.email || '',
    address: '',
    insurance_provider: '',
    insurance_id: '',
    medical_conditions: [],
    allergies: [],
    emergency_name: '',
    emergency_relation: '',
    emergency_phone: ''
  };

  // Convert legacy string values to arrays if necessary (due to local storage draft)
  if (typeof initialForm.medical_conditions === 'string') initialForm.medical_conditions = [];
  if (typeof initialForm.allergies === 'string') initialForm.allergies = [];

  const [formData, setFormData] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1 = Form, 2 = Summary, 3 = Success Animation
  const [insuranceOpen, setInsuranceOpen] = useState(!!formData.insurance_provider);
  const [errors, setErrors] = useState({});

  // Tag input states
  const [conditionInput, setConditionInput] = useState('');
  const [allergyInput, setAllergyInput] = useState('');

  // Auto-save draft
  useEffect(() => {
    localStorage.setItem('cp_draft_form', JSON.stringify(formData));
  }, [formData]);

  // BMI Calculation
  const calculateBMI = () => {
    if (!formData.height || !formData.weight) return null;
    const h = parseFloat(formData.height) / 100; // cm to m
    const w = parseFloat(formData.weight);
    if (h > 0 && w > 0) {
      return (w / (h * h)).toFixed(1);
    }
    return null;
  };

  const bmi = calculateBMI();
  let bmiCategory = null;
  if (bmi) {
    if (bmi < 18.5) bmiCategory = { label: 'Underweight', class: 'cp-bmi-underweight' };
    else if (bmi < 25) bmiCategory = { label: 'Healthy', class: 'cp-bmi-healthy' };
    else if (bmi < 30) bmiCategory = { label: 'Overweight', class: 'cp-bmi-overweight' };
    else bmiCategory = { label: 'Obese', class: 'cp-bmi-obese' };
  }

  // Validation
  const validateField = (name, value) => {
    let err = null;
    if (name === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      err = 'Invalid email format';
    }
    if (name === 'phone' && value && !/^\+?[0-9\s\-()]{7,15}$/.test(value)) {
      err = 'Invalid phone format';
    }
    if ((name === 'height' || name === 'weight') && value && isNaN(value)) {
      err = 'Must be a number';
    }
    return err;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  // Tag Input Handlers
  const handleAddTag = (e, field, input, setInput) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (input.trim()) {
        setFormData({ ...formData, [field]: [...formData[field], input.trim()] });
        setInput('');
      }
    }
  };

  const handleRemoveTag = (field, index) => {
    const newTags = [...formData[field]];
    newTags.splice(index, 1);
    setFormData({ ...formData, [field]: newTags });
  };

  const calculateProgress = () => {
    const requiredFields = ['full_name', 'dob', 'gender', 'blood_group', 'height', 'weight', 'phone', 'email', 'address', 'emergency_name', 'emergency_relation', 'emergency_phone'];
    let filled = 0;
    requiredFields.forEach(f => {
      if (formData[f] && String(formData[f]).trim() !== '') filled++;
    });
    return Math.round((filled / requiredFields.length) * 100);
  };

  const progress = calculateProgress();

  const handleContinue = (e) => {
    e.preventDefault();
    // Validate required fields
    const newErrors = {};
    const requiredFields = ['full_name', 'dob', 'gender', 'blood_group', 'height', 'weight', 'phone', 'email', 'address', 'emergency_name', 'emergency_relation', 'emergency_phone'];
    requiredFields.forEach(f => {
      if (!formData[f]) newErrors[f] = 'Required';
      else {
        const err = validateField(f, formData[f]);
        if (err) newErrors[f] = err;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast('Please fix the errors before continuing.', 'danger');
      return;
    }

    setStep(2);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        ...formData,
        medical_conditions: formData.medical_conditions.join(', '),
        allergies: formData.allergies.join(', ')
      };

      const res = await apiFetch('/api/patients/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const newProfile = await res.json();
        setPatientProfile(newProfile);
        localStorage.removeItem('cp_draft_form');
        setStep(3); // Success Animation
        setTimeout(() => {
          navigateTo('app', 'dashboard');
          showToast('Profile completed successfully. Welcome!', 'success');
        }, 2500);
      } else {
        const err = await res.json();
        showToast(err.detail || 'Failed to create profile', 'danger');
      }
    } catch (err) {
      showToast('Error saving profile.', 'danger');
    }
    setLoading(false);
  };

  return (
    <div className="cp-page-wrapper">
      <div className="cp-background">
        <div className="cp-blob cp-blob-1" />
        <div className="cp-blob cp-blob-2" />
        <HeartPulse className="cp-floating-icon" size={64} style={{ left: '10%', animationDelay: '0s' }} />
        <Activity className="cp-floating-icon" size={48} style={{ right: '15%', animationDelay: '3s', color: 'rgba(255,255,255,0.3)' }} />
        <Shield className="cp-floating-icon" size={56} style={{ left: '30%', animationDelay: '7s', color: 'rgba(255,255,255,0.2)' }} />
      </div>

      <div className="cp-container">
        {step === 3 && (
          <div className="cp-success-overlay">
            <CheckCircle className="cp-success-icon" />
            <h2 style={{ marginTop: '1rem', color: '#0f172a' }}>Profile Completed Successfully!</h2>
            <p style={{ color: '#64748b' }}>Redirecting to Dashboard...</p>
          </div>
        )}

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Complete Your Profile</h2>
          <p style={{ color: '#64748b', marginTop: '0.5rem' }}>{step === 1 ? 'Please fill in these required details.' : 'Review your details before saving.'}</p>
        </div>

        {step === 1 && (
          <div className="cp-progress-wrapper">
            <div className="cp-progress-bar" style={{ width: `${progress}%` }} />
          </div>
        )}
        {step === 1 && <div style={{ textAlign: 'right', fontSize: '0.85rem', color: '#64748b', marginTop: '-1.5rem', marginBottom: '1rem' }}>{progress}% Completed</div>}

        {step === 1 && (
          <form onSubmit={handleContinue}>
            
            {/* Personal Information */}
            <div className="cp-card">
              <div className="cp-card-header">
                <User size={20} color="var(--primary)" /> Personal Information
              </div>
              <div className="cp-grid-3">
                <div className="cp-form-group">
                  <label className="cp-label">Full Name <span className="required">*</span></label>
                  <div className="cp-input-wrapper">
                    <User className="cp-input-icon" size={18} />
                    <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} className={`cp-input ${errors.full_name ? 'error' : ''}`} placeholder="John Doe" />
                  </div>
                </div>
                
                <div className="cp-form-group">
                  <label className="cp-label">Date of Birth <span className="required">*</span></label>
                  <div className="cp-input-wrapper">
                    <Calendar className="cp-input-icon" size={18} />
                    <input type="date" name="dob" value={formData.dob} onChange={handleChange} className={`cp-input ${errors.dob ? 'error' : ''}`} />
                  </div>
                </div>

                <div className="cp-form-group">
                  <label className="cp-label">Gender <span className="required">*</span></label>
                  <div className="cp-select-wrapper">
                    <User className="cp-input-icon" size={18} style={{ zIndex: 1 }} />
                    <select name="gender" value={formData.gender} onChange={handleChange} className={`cp-input cp-select ${errors.gender ? 'error' : ''}`}>
                      <option value="" disabled>Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    <ChevronDown className="cp-select-arrow" size={18} />
                  </div>
                </div>

                <div className="cp-form-group">
                  <label className="cp-label">Email <span className="required">*</span></label>
                  <div className="cp-input-wrapper">
                    <Mail className="cp-input-icon" size={18} />
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className={`cp-input ${errors.email ? 'error' : (formData.email && !errors.email ? 'success' : '')}`} placeholder="john@example.com" />
                    {formData.email && !errors.email && <CheckCircle className="cp-validation-icon" size={16} color="#22c55e" />}
                  </div>
                </div>

                <div className="cp-form-group">
                  <label className="cp-label">Phone Number <span className="required">*</span></label>
                  <div className="cp-input-wrapper">
                    <Phone className="cp-input-icon" size={18} />
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={`cp-input ${errors.phone ? 'error' : (formData.phone && !errors.phone ? 'success' : '')}`} placeholder="+1 234 567 890" />
                    {formData.phone && !errors.phone && <CheckCircle className="cp-validation-icon" size={16} color="#22c55e" />}
                  </div>
                </div>

                <div className="cp-form-group">
                  <label className="cp-label">Blood Group <span className="required">*</span></label>
                  <div className="cp-select-wrapper">
                    <Droplet className="cp-input-icon" size={18} style={{ zIndex: 1, color: '#ef4444' }} />
                    <select name="blood_group" value={formData.blood_group} onChange={handleChange} className={`cp-input cp-select ${errors.blood_group ? 'error' : ''}`}>
                      <option value="" disabled>Select Blood Group</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                    <ChevronDown className="cp-select-arrow" size={18} />
                  </div>
                </div>

                <div className="cp-form-group">
                  <label className="cp-label">Height <span className="required">*</span></label>
                  <div className="cp-input-wrapper">
                    <Ruler className="cp-input-icon" size={18} />
                    <input type="text" name="height" value={formData.height} onChange={handleChange} className={`cp-input ${errors.height ? 'error' : ''}`} placeholder="170" />
                    <span className="cp-input-suffix">cm</span>
                  </div>
                </div>

                <div className="cp-form-group">
                  <label className="cp-label">Weight <span className="required">*</span></label>
                  <div className="cp-input-wrapper">
                    <Weight className="cp-input-icon" size={18} />
                    <input type="text" name="weight" value={formData.weight} onChange={handleChange} className={`cp-input ${errors.weight ? 'error' : ''}`} placeholder="65" />
                    <span className="cp-input-suffix">kg</span>
                  </div>
                  {bmiCategory && (
                    <div className={`cp-bmi-indicator ${bmiCategory.class}`}>
                      BMI: {bmi} ({bmiCategory.label})
                    </div>
                  )}
                </div>

                <div className="cp-form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="cp-label">Address <span className="required">*</span></label>
                  <div className="cp-input-wrapper" style={{ alignItems: 'flex-start' }}>
                    <MapPin className="cp-input-icon" size={18} style={{ top: '14px' }} />
                    <textarea name="address" value={formData.address} onChange={handleChange} className={`cp-input ${errors.address ? 'error' : ''}`} placeholder="House No, Street, City" />
                  </div>
                </div>
              </div>
            </div>

            {/* Medical Information */}
            <div className="cp-card">
              <div className="cp-card-header">
                <Shield size={20} color="var(--primary)" /> Medical Information
              </div>
              <div className="cp-grid-1">
                
                <div className="cp-form-group">
                  <label className="cp-label">Existing Medical Conditions</label>
                  <div className="cp-tags-container">
                    {formData.medical_conditions.map((tag, i) => (
                      <span key={i} className="cp-tag">
                        {tag} <span className="cp-tag-remove" onClick={() => handleRemoveTag('medical_conditions', i)}><X size={12} /></span>
                      </span>
                    ))}
                    <input 
                      type="text" 
                      className="cp-tag-input" 
                      placeholder={formData.medical_conditions.length === 0 ? "Type and press Enter (e.g. Diabetes)" : "Add condition..."}
                      value={conditionInput}
                      onChange={(e) => setConditionInput(e.target.value)}
                      onKeyDown={(e) => handleAddTag(e, 'medical_conditions', conditionInput, setConditionInput)}
                    />
                  </div>
                </div>

                <div className="cp-form-group">
                  <label className="cp-label">Allergies</label>
                  <div className="cp-tags-container">
                    {formData.allergies.map((tag, i) => (
                      <span key={i} className="cp-tag" style={{ background: '#fef2f2', color: '#991b1b', borderColor: '#fecaca' }}>
                        {tag} <span className="cp-tag-remove" style={{ color: '#991b1b' }} onClick={() => handleRemoveTag('allergies', i)}><X size={12} /></span>
                      </span>
                    ))}
                    <input 
                      type="text" 
                      className="cp-tag-input" 
                      placeholder={formData.allergies.length === 0 ? "Type and press Enter (e.g. Peanuts)" : "Add allergy..."}
                      value={allergyInput}
                      onChange={(e) => setAllergyInput(e.target.value)}
                      onKeyDown={(e) => handleAddTag(e, 'allergies', allergyInput, setAllergyInput)}
                    />
                  </div>
                </div>

                <div style={{ marginTop: '1rem' }}>
                  <div 
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--primary)', fontWeight: 500, userSelect: 'none' }}
                    onClick={() => setInsuranceOpen(!insuranceOpen)}
                  >
                    <ChevronDown size={18} style={{ transform: insuranceOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }} />
                    Insurance Details (Optional)
                  </div>
                  
                  {insuranceOpen && (
                    <div className="cp-grid-2" style={{ marginTop: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '12px', animation: 'fadeIn 0.3s ease' }}>
                      <div className="cp-form-group">
                        <label className="cp-label">Insurance Provider</label>
                        <div className="cp-input-wrapper">
                          <Shield className="cp-input-icon" size={18} />
                          <input type="text" name="insurance_provider" value={formData.insurance_provider} onChange={handleChange} className="cp-input" placeholder="BlueCross" />
                        </div>
                      </div>
                      <div className="cp-form-group">
                        <label className="cp-label">Insurance ID / Policy Number</label>
                        <div className="cp-input-wrapper">
                          <Tag className="cp-input-icon" size={18} />
                          <input type="text" name="insurance_id" value={formData.insurance_id} onChange={handleChange} className="cp-input" placeholder="POL-12345" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Emergency Contact */}
            <div className="cp-card">
              <div className="cp-card-header">
                <Phone size={20} color="var(--primary)" /> Emergency Contact
              </div>
              <div className="cp-grid-3">
                <div className="cp-form-group">
                  <label className="cp-label">Contact Name <span className="required">*</span></label>
                  <div className="cp-input-wrapper">
                    <User className="cp-input-icon" size={18} />
                    <input type="text" name="emergency_name" value={formData.emergency_name} onChange={handleChange} className={`cp-input ${errors.emergency_name ? 'error' : ''}`} placeholder="Jane Doe" />
                  </div>
                </div>
                <div className="cp-form-group">
                  <label className="cp-label">Relationship <span className="required">*</span></label>
                  <div className="cp-input-wrapper">
                    <Activity className="cp-input-icon" size={18} />
                    <input type="text" name="emergency_relation" value={formData.emergency_relation} onChange={handleChange} className={`cp-input ${errors.emergency_relation ? 'error' : ''}`} placeholder="Spouse" />
                  </div>
                </div>
                <div className="cp-form-group">
                  <label className="cp-label">Contact Phone <span className="required">*</span></label>
                  <div className="cp-input-wrapper">
                    <Phone className="cp-input-icon" size={18} />
                    <input type="tel" name="emergency_phone" value={formData.emergency_phone} onChange={handleChange} className={`cp-input ${errors.emergency_phone ? 'error' : ''}`} placeholder="+1 987 654 321" />
                  </div>
                </div>
              </div>
            </div>

            <div className="cp-actions">
              <button type="button" className="cp-btn cp-btn-secondary" onClick={() => showToast('Draft saved locally.', 'success')}>
                <Save size={18} /> Save Draft
              </button>
              <button type="submit" className="cp-btn cp-btn-primary">
                Continue <ArrowRight size={18} />
              </button>
            </div>
            
          </form>
        )}

        {step === 2 && (
          <div className="cp-card">
            <div className="cp-card-header">
              <CheckCircle size={20} color="#10b981" /> Profile Summary
            </div>
            
            <div className="cp-summary-grid">
              <div className="cp-summary-item">
                <span className="cp-summary-label">Name</span>
                <span className="cp-summary-value">{formData.full_name}</span>
              </div>
              <div className="cp-summary-item">
                <span className="cp-summary-label">Gender</span>
                <span className="cp-summary-value">{formData.gender}</span>
              </div>
              <div className="cp-summary-item">
                <span className="cp-summary-label">Blood Group</span>
                <span className="cp-summary-value" style={{ color: '#ef4444', fontWeight: 600 }}>{formData.blood_group}</span>
              </div>
              <div className="cp-summary-item">
                <span className="cp-summary-label">Height / Weight</span>
                <span className="cp-summary-value">{formData.height} cm / {formData.weight} kg</span>
              </div>
              <div className="cp-summary-item">
                <span className="cp-summary-label">Phone</span>
                <span className="cp-summary-value">{formData.phone}</span>
              </div>
              <div className="cp-summary-item">
                <span className="cp-summary-label">Emergency Contact</span>
                <span className="cp-summary-value">{formData.emergency_name} ({formData.emergency_relation})</span>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div className="cp-summary-item" style={{ flex: 1, minWidth: '200px' }}>
                <span className="cp-summary-label">Medical Conditions</span>
                <span className="cp-summary-value">{formData.medical_conditions.length > 0 ? formData.medical_conditions.join(', ') : 'None'}</span>
              </div>
              <div className="cp-summary-item" style={{ flex: 1, minWidth: '200px', background: '#fef2f2', borderColor: '#fee2e2' }}>
                <span className="cp-summary-label" style={{ color: '#b91c1c' }}>Allergies</span>
                <span className="cp-summary-value" style={{ color: '#991b1b' }}>{formData.allergies.length > 0 ? formData.allergies.join(', ') : 'None'}</span>
              </div>
            </div>

            <div className="cp-actions">
              <button type="button" className="cp-btn cp-btn-secondary" onClick={() => setStep(1)} disabled={loading}>
                Back to Edit
              </button>
              <button type="button" className="cp-btn cp-btn-primary" onClick={handleSubmit} disabled={loading}>
                {loading ? <Activity size={18} className="fa-spin" /> : <CheckCircle size={18} />}
                {loading ? 'Saving...' : 'Confirm & Save'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
