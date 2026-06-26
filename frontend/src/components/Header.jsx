import React from 'react';
import { Leaf, Settings, LogOut } from 'lucide-react';

export default function Header({ user, setUser, setView, navigateTo, showToast }) {
  return (
    <div className="top-nav-header">
      <div className="brand" onClick={() => navigateTo('landing', 'dashboard')} style={{ cursor: 'pointer' }}>
        <Leaf size={24} style={{ filter: 'drop-shadow(0 0 8px var(--primary))', marginRight: '8px' }} />
        <span>Salus</span>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div className="profile-card">
          <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="pulse-dot"></span>
            System Status: Online
          </span>
        </div>
        
        {user && (
          <div className="user-profile-widget-top">
            <div className="avatar">
              {user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
            </div>
            <div className="user-info-text">
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>{user.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                {user.role}
              </div>
            </div>
            <button className="profile-action-btn" title="System Settings">
              <Settings size={16} />
            </button>
            <button 
              className="profile-action-btn" 
              title="Sign Out" 
              onClick={() => {
                setUser(null);
                setView('landing');
                showToast("Logged out successfully.", "warning");
              }} 
              style={{ color: 'var(--danger)', marginLeft: '4px' }}
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
