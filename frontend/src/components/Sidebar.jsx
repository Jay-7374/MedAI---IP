import React from 'react';
import { 
  ActivitySquare, 
  Calendar, 
  Pill, 
  Mic, 
  Settings, 
  AlertTriangle,
  FileText
} from 'lucide-react';

export default function Sidebar({ user, activeTab, navigateTo, isAdmin }) {
  const isStaff = ['staff', 'doctor', 'receptionist', 'admin'].includes(user?.role?.toLowerCase());

  return (
    <div className="top-nav-menu-bar">
      <div className="nav-section-group">
        <span className="nav-section-title">Workspace</span>
        <div className="nav-buttons-container">
          <div className={`menu-item ${activeTab === 'dashboard' ? 'active' : ''}`}>
            <button onClick={() => navigateTo('app', 'dashboard')}>
              <ActivitySquare size={16} /> Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="nav-section-group">
        <span className="nav-section-title">Management</span>
        <div className="nav-buttons-container">
          <div className={`menu-item ${activeTab === 'appointments' ? 'active' : ''}`}>
            <button onClick={() => navigateTo('app', 'appointments')}>
              <Calendar size={16} /> Scheduling & Diagnostics
            </button>
          </div>
          <div className={`menu-item ${activeTab === 'medicines' ? 'active' : ''}`}>
            <button onClick={() => navigateTo('app', 'medicines')}>
              <Pill size={16} /> Adherence Tracker
            </button>
          </div>
        </div>
      </div>

      <div className="nav-section-group voice-ai-middle-group">
        <span className="nav-section-title">Voice AI</span>
        <div className="nav-buttons-container">
          <div className={`menu-item voice-mic-item ${activeTab === 'voicebot' ? 'active' : ''}`}>
            <button 
              className="voice-mic-btn"
              onClick={() => navigateTo('app', 'voicebot')} 
              title="Activate Voice AI Simulator"
            >
              <Mic size={18} />
            </button>
          </div>
        </div>
      </div>

      {isStaff && (
        <div className="nav-section-group">
          <span className="nav-section-title">Clinical Staff</span>
          <div className="nav-buttons-container">
            <div className={`menu-item ${activeTab === 'staffconsole' ? 'active' : ''}`}>
              <button onClick={() => navigateTo('app', 'staffconsole')}>
                <FileText size={16} /> Staff Console
              </button>
            </div>
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="nav-section-group">
          <span className="nav-section-title">System Admin</span>
          <div className="nav-buttons-container">
            <div className={`menu-item ${activeTab === 'prompts' ? 'active' : ''}`}>
              <button onClick={() => navigateTo('app', 'prompts')}>
                <Settings size={16} /> Prompt Orchestrator
              </button>
            </div>
            <div className={`menu-item ${activeTab === 'adminconsole' ? 'active' : ''}`}>
              <button onClick={() => navigateTo('app', 'adminconsole')}>
                <FileText size={16} /> Admin Console
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="nav-section-group">
        <span className="nav-section-title">Critical</span>
        <div className="nav-buttons-container">
          <div className={`menu-item danger-item ${activeTab === 'emergency' ? 'active' : ''}`}>
            <button onClick={() => navigateTo('app', 'emergency')}>
              <AlertTriangle size={16} /> EMERGENCY SOS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
