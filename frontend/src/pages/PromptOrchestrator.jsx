import React, { useState } from 'react';
import { Settings, Check, Plus, X } from 'lucide-react';

export default function PromptOrchestrator({ 
  isAdmin, 
  editingPrompt, 
  setEditingPrompt, 
  prompts, 
  handleSavePrompt, 
  DEFAULT_PROMPTS 
}) {
  const [isAddingNew, setIsAddingNew] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (isAddingNew && !editingPrompt.bot_name.trim()) {
      alert("Please enter a bot name");
      return;
    }
    const success = await handleSavePrompt(e);
    if (success) {
      setIsAddingNew(false);
    }
  };

  return (
    isAdmin ? (
      <div className="card">
        <div style={{ marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.35rem' }}>System Prompt Orchestrator</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Configure active agent roles, instructions, and compiled model templates.</p>
          </div>
          
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={() => {
              if (isAddingNew) {
                setIsAddingNew(false);
                // Reset to first existing prompt
                if (prompts.length > 0) setEditingPrompt(prompts[0]);
              } else {
                setIsAddingNew(true);
                setEditingPrompt({ bot_name: '', system_prompt: '' });
              }
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', padding: '0.5rem 1rem', height: 'fit-content' }}
          >
            {isAddingNew ? (
              <>
                <X size={14} /> Cancel New Bot
              </>
            ) : (
              <>
                <Plus size={14} /> Add New Bot Persona
              </>
            )}
          </button>
        </div>

        <form onSubmit={onSubmit}>
          {isAddingNew ? (
            <div className="form-group">
              <label className="form-label">New Bot Identifier Name (CamelCase, no spaces)</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="e.g. ChronicCareAssistant" 
                value={editingPrompt.bot_name}
                onChange={(e) => setEditingPrompt(prev => ({ ...prev, bot_name: e.target.value.replace(/\s+/g, '') }))}
                required
              />
            </div>
          ) : (
            <div className="form-group">
              <label className="form-label">System Bot Target Core</label>
              <select 
                className="form-control" 
                value={editingPrompt.bot_name}
                onChange={(e) => {
                  const active = prompts.find(p => p.bot_name === e.target.value);
                  if (active) setEditingPrompt(active);
                }}
              >
                {prompts.map(p => (
                  <option key={p.bot_name} value={p.bot_name}>
                    {p.bot_name}
                  </option>
                ))}
              </select>
            </div>
          )}

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
            <Check size={18} style={{ marginRight: '4px' }} /> {isAddingNew ? 'Create New Persona' : 'Update Template'}
          </button>
        </form>
      </div>
    ) : (
      <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <Settings size={40} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Access Restricted</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>The Prompt Orchestrator is available to administrators only. Please contact your administrator.</p>
      </div>
    )
  );
}
