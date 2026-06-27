import React from 'react';
import { Leaf, AlertTriangle, ArrowLeft } from 'lucide-react';

export default function Login({ 
  authMode, 
  setAuthMode, 
  authForm, 
  setAuthForm, 
  authError, 
  setAuthError, 
  userUnregistered, 
  setUserUnregistered, 
  handleAuthSubmit, 
  setView 
}) {
  return (
    <div className="login-container view-transition-root" key="view-login">
      {/* Background Grid */}
      <div className="bg-grid-overlay"></div>

      {/* Floating Diagonal Dotted Waves */}
      <svg className="landing-diagonal-wave" viewBox="0 0 1920 1080" preserveAspectRatio="none">
        <path 
          className="diagonal-wave-path wave-path-1" 
          d="M -50 1130 C 300 900, 200 700, 600 650 C 1000 600, 920 400, 1320 350 C 1720 300, 1620 100, 1970 -50" 
        />
        <path 
          className="diagonal-wave-path wave-path-2" 
          d="M -50 1150 C 250 950, 250 650, 650 600 C 1050 550, 880 450, 1280 400 C 1680 350, 1650 50, 1970 -30" 
        />
      </svg>

      {/* Background Glow Layer */}
      <div className="bg-glow-layer">
        <div className="glow-blob glow-blob-1"></div>
        <div className="glow-blob glow-blob-2"></div>
        <div className="glow-blob glow-blob-3"></div>
      </div>

      {/* Back to landing link */}
      <div className="login-back-nav">
        <button className="btn-back" onClick={() => setView('landing')}>
          <ArrowLeft size={16} /> Back to Landing
        </button>
      </div>

      {/* Login/Signup Card */}
      <div className="login-card-wrapper">
        <div className="login-card">
          <div className="login-card-header">
            <Leaf size={32} className="login-logo-icon" />
            <h2>{authMode === 'login' ? 'Access Salus Console' : 'Register Salus Account'}</h2>
            <p>{authMode === 'login' ? 'Enter clinical credentials to authorize session.' : 'Create new clinical profile in hospital directory.'}</p>
          </div>

          {authError && (
            <div className={`auth-alert ${userUnregistered ? 'auth-alert-warning' : 'auth-alert-danger'}`}>
              <AlertTriangle size={18} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
                <span>{authError}</span>
                {userUnregistered && (
                  <button 
                    className="auth-alert-action-btn"
                    onClick={() => {
                      setAuthMode('signup');
                      setAuthError('');
                      setUserUnregistered(false);
                    }}
                  >
                    Click here to Sign Up instead
                  </button>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label">Username (Full Name)</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="e.g., Alex Mercer"
                value={authForm.username}
                onChange={(e) => setAuthForm(prev => ({ ...prev, username: e.target.value }))}
                required
              />
            </div>

            {authMode === 'signup' && (
              <>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input 
                    type="email" 
                    className="form-control" 
                    placeholder="e.g., patient@medai.com"
                    value={authForm.email || ''}
                    onChange={(e) => setAuthForm(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">User Role</label>
                  <select 
                    className="form-control"
                    value={authForm.role}
                    onChange={(e) => setAuthForm(prev => ({ ...prev, role: e.target.value }))}
                  >
                    <option value="Patient">Patient</option>
                    <option value="Doctor">Doctor / Clinician</option>
                    <option value="Receptionist">Receptionist</option>
                  </select>
                </div>
              </>
            )}

            <div className="form-group">
              <label className="form-label">Security Password</label>
              <input 
                type="password" 
                className="form-control" 
                placeholder="••••••••"
                value={authForm.password}
                onChange={(e) => setAuthForm(prev => ({ ...prev, password: e.target.value }))}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary btn-login-submit" style={{ width: '100%', marginTop: '1rem' }}>
              {authMode === 'login' ? 'Authorize & Connect' : 'Register Profile'}
            </button>
          </form>

          <div className="login-card-footer" style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem' }}>
            {authMode === 'login' ? (
              <p style={{ color: 'var(--text-secondary)' }}>
                Username not registered?{' '}
                <button className="auth-toggle-link" onClick={() => { setAuthMode('signup'); setAuthError(''); setUserUnregistered(false); }} style={{ background: 'none', border: 'none', color: 'var(--primary-hover)', cursor: 'pointer', fontWeight: 600, padding: 0, textDecoration: 'underline' }}>
                  Sign Up
                </button>
              </p>
            ) : (
              <p style={{ color: 'var(--text-secondary)' }}>
                Already have an account?{' '}
                <button className="auth-toggle-link" onClick={() => { setAuthMode('login'); setAuthError(''); setUserUnregistered(false); }} style={{ background: 'none', border: 'none', color: 'var(--primary-hover)', cursor: 'pointer', fontWeight: 600, padding: 0, textDecoration: 'underline' }}>
                  Log In
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
