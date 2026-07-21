import React, { useState } from 'react';
import { 
  ActivitySquare, 
  Calendar, 
  Pill, 
  Mic, 
  Settings, 
  AlertTriangle,
  FileText,
  Leaf,
  LogOut,
  X
} from 'lucide-react';

export default function Sidebar({ user, setUser, setView, activeTab, navigateTo, isAdmin, sidebarOpen, setSidebarOpen, showToast }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isStaff = ['staff', 'doctor', 'receptionist', 'admin'].includes(user?.role?.toLowerCase());

  const handleLogout = () => {
    setUser(null);
    setView('landing');
    showToast("Logged out successfully.", "warning");
  };

  // Flattened navigation list without categories
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: ActivitySquare },
    { id: 'appointments', label: 'Scheduling', icon: Calendar },
    { id: 'medicines', label: 'Medication', icon: Pill },
    { id: 'voicebot', label: 'AI Assistant', icon: Mic },
    ...(isStaff ? [{ id: 'staffconsole', label: 'Staff Console', icon: FileText }] : []),
    ...(isAdmin ? [
      { id: 'prompts', label: 'Prompt Orchestrator', icon: Settings },
      { id: 'adminconsole', label: 'Admin Console', icon: Settings }
    ] : []),
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'emergency', label: 'Emergency SOS', icon: AlertTriangle, danger: true }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={() => setSidebarOpen(false)} 
          aria-hidden="true"
        />
      )}
      
      <aside
        className={`app-sidebar ${isExpanded ? 'sidebar-expanded' : ''} ${sidebarOpen ? 'mobile-open' : ''}`}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
        aria-label="Main navigation"
      >
        {/* Mobile Close Button */}
        <button className="sidebar-mobile-close" onClick={() => setSidebarOpen(false)}>
          <X size={20} />
        </button>

        {/* Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <Leaf size={22} />
          </div>
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-name">SALUS</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="nav-buttons-container">
            {navItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <div 
                  key={item.id} 
                  className={`menu-item ${isActive ? 'active' : ''} ${item.danger ? 'danger-item' : ''}`}
                >
                  <button 
                    onClick={() => {
                      navigateTo('app', item.id);
                      if (window.innerWidth <= 768) setSidebarOpen(false);
                    }}
                    title={!isExpanded ? item.label : undefined}
                  >
                    <span className="sidebar-icon">
                      <IconComponent size={20} />
                    </span>
                    <span className="sidebar-label">{item.label}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </nav>

        {/* Bottom Section / Profile */}
        <div className="sidebar-bottom">
          <div className="sidebar-divider" />
          
          <div className="sidebar-profile">
            <div className="sidebar-avatar">
              {user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
            </div>
            <div className="sidebar-profile-info">
              <span className="sidebar-profile-name">
                {user?.name || 'User'}
              </span>
              <span className="sidebar-profile-role">
                {user?.role || 'Patient'}
              </span>
            </div>
            
            <div className="sidebar-profile-actions">
              <button 
                className="profile-action-btn" 
                title="Sign Out" 
                onClick={(e) => { e.stopPropagation(); handleLogout(); }} 
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
