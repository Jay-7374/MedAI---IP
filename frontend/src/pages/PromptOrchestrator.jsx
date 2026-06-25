import React from 'react';
import { Settings, Check } from 'lucide-react';

export default function PromptOrchestrator({ 
  isAdmin, 
  editingPrompt, 
  setEditingPrompt, 
  prompts, 
  handleSavePrompt, 
  DEFAULT_PROMPTS 
}) {
  return (
    isAdmin ? (
      <div className="card">
        <div style={{ marginBottom: '1.75rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.35rem' }}>System Prompt Orchestrator</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Configure active agent roles, instructions, and compiled model templates.</p>
        </div>
        <form onSubmit={handleSavePrompt}>
          <div className="form-group">
            <label className="form-label">System Bot Target Core</label>
            <select 
              className="form-control" 
              value={editingPrompt.bot_name}
              onChange={(e) => {
                const active = prompts.find(p => p.bot_name === e.target.value);
                if (active) setEditingPrompt(active);
                else setEditingPrompt({ bot_name: e.target.value, system_prompt: DEFAULT_PROMPTS[e.target.value] || '' });
              }}
            >
              <option value="NaturalSpeechAuth">Natural Speech Authentication</option>
              <option value="ConversationalScheduling">Conversational Scheduling & Diagnostics</option>
              <option value="PostDischargeCheckIn">Post-Discharge Wellness Check-in</option>
              <option value="MedicationAdherence">Active Medication Adherence Alert</option>
              <option value="InsurancePolicyIntake">Insurance Policy Intake & Breakdown</option>
              <option value="EmergencySeverity">Emergency Severity Classification</option>
              <option value="AiNurseAdvice">Interactive AI Nurse Advice</option>
              <option value="ElderCareTerminal">Elder Care Welfare Terminal</option>
              <option value="TelemedicineBridge">Telemedicine Video Bridge Hand-off</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">System Role Prompt (Dynamic Core Context)</label>
            <textarea 
              className="form-control" 
              rows={12} 
              value={editingPrompt.system_prompt}
              onChange={(e) => setEditingPrompt(prev => ({ ...prev, system_prompt: e.target.value }))}
              style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.9rem', lineHeight: 1.6 }}
              placeholder="Enter prompt instructions for LLM orchestration..."
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ padding: '0.85rem 2rem' }}>
            <Check size={18} /> Update Template
          </button>
        </form>
      </div>
    ) : (
      <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <Settings size={40} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Access Restricted</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>The Prompt Orchestrator is available to clinical staff only. Please contact your administrator.</p>
      </div>
    )
  );
}
