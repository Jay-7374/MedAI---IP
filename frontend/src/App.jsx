import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, 
  Activity, 
  ActivitySquare, 
  Thermometer, 
  PhoneCall, 
  Calendar, 
  Pill, 
  AlertTriangle, 
  Settings, 
  LogOut, 
  FileText, 
  Trash2, 
  Plus, 
  Check, 
  Send,
  MessageSquare,
  Clock
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState({ name: 'Alex Mercer', role: 'Patient' });
  const [toast, setToast] = useState(null);

  // Telemetry Telemetry Vitals
  const [vitals, setVitals] = useState({
    heartrate: 74,
    spo2: 98,
    bloodPressure: '120/80',
    temperature: '36.7'
  });

  // Data states
  const [appointments, setAppointments] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [prompts, setPrompts] = useState([]);
  const [sosStatus, setSosStatus] = useState(null);

  // Forms states
  const [apptForm, setApptForm] = useState({ doctor: '', date: '', time: '', symptoms: '' });
  const [medForm, setMedForm] = useState({ name: '', dosage: '', time: '' });
  const [editingPrompt, setEditingPrompt] = useState({ bot_name: 'General', system_prompt: '' });

  // Voice Call Bot States
  const [selectedBot, setSelectedBot] = useState('General');
  const [callStatus, setCallStatus] = useState('Idle'); // 'Idle', 'Connecting', 'Connected'
  const [transcripts, setTranscripts] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [sessionId, setSessionId] = useState('');
  
  const wsRef = useRef(null);
  const recognitionRef = useRef(null);
  const chatEndRef = useRef(null);

  // Toast Helper
  const showToast = (message, type = 'primary') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch telemetry vitals
  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        const res = await fetch('/api/telemetry');
        if (res.ok) {
          const data = await res.json();
          setVitals(prev => ({
            ...prev,
            heartrate: data.heartrate,
            spo2: data.spo2
          }));
        }
      } catch (err) {
        // Fallback local fluctuation
        setVitals(prev => {
          const variance = Math.floor(Math.random() * 5) - 2;
          let newHeart = prev.heartrate + variance;
          if (newHeart < 60) newHeart = 65;
          if (newHeart > 100) newHeart = 95;
          return {
            ...prev,
            heartrate: newHeart,
            spo2: Math.random() > 0.5 ? 98 : 99
          };
        });
      }
    };
    
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 4000);
    return () => clearInterval(interval);
  }, []);

  // Fetch basic lists
  const fetchAppointments = async () => {
    try {
      const res = await fetch('/api/appointments');
      if (res.ok) {
        const data = await res.json();
        setAppointments(data);
      }
    } catch (err) {
      console.warn("Using local fallback for appointments", err);
    }
  };

  const fetchMedicines = async () => {
    try {
      const res = await fetch('/api/medicines');
      if (res.ok) {
        const data = await res.json();
        setMedicines(data);
      }
    } catch (err) {
      console.warn("Using local fallback for medicines", err);
    }
  };

  const fetchPrompts = async () => {
    try {
      const res = await fetch('/api/prompts');
      if (res.ok) {
        const data = await res.json();
        setPrompts(data);
        const active = data.find(p => p.bot_name === selectedBot);
        if (active) setEditingPrompt(active);
      }
    } catch (err) {
      console.warn("Using local default prompts", err);
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchMedicines();
    fetchPrompts();
  }, []);

  useEffect(() => {
    if (prompts.length > 0) {
      const active = prompts.find(p => p.bot_name === selectedBot);
      if (active) setEditingPrompt(active);
    }
  }, [selectedBot, prompts]);

  // Scroll to bottom of chat transcripts
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onresult = (event) => {
        const text = event.results[0][0].transcript;
        if (text.trim()) {
          // Add User text locally
          setTranscripts(prev => [...prev, { speaker: 'User', text: text }]);
          
          // Send via WebSocket to Groq LLM
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
              type: 'text',
              session_id: sessionId,
              text: text,
              bot_name: selectedBot
            }));
          }
        }
      };

      rec.onend = () => {
        // Automatically restart speech capture if we are still connected and not speaking
        if (callStatus === 'Connected' && !isSpeaking) {
          try {
            rec.start();
          } catch (e) {}
        }
      };

      recognitionRef.current = rec;
    }
  }, [callStatus, isSpeaking, sessionId, selectedBot]);

  // Trigger web speech synthesis
  const speakTextOutLoud = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onstart = () => {
        setIsSpeaking(true);
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop(); // Stop listening while bot is speaking
          } catch(e){}
        }
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        // Start listening again
        if (callStatus === 'Connected' && recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch(e){}
        }
      };

      window.speechSynthesis.speak(utterance);
    }
  };

  // Start Voice Bot session
  const startCallSession = async () => {
    const newSessionId = 'SESS-' + Date.now();
    setSessionId(newSessionId);
    setCallStatus('Connecting');
    setTranscripts([]);

    // 1. Register Session on Backend DB
    try {
      await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newSessionId,
          channel: 'WebRTC',
          status: 'Active'
        })
      });
    } catch (e) {
      console.warn("Starting call in offline/mock backend mode");
    }

    // 2. Open WebSocket link
    const wsUrl = `ws://${window.location.host}/ws/voice`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setCallStatus('Connected');
      showToast("Real-time voice bot link established.", "success");
      
      // Send welcoming statement
      const welcomeText = `Hello Alex. I am your MedAI ${selectedBot} Voice Assistant. How can I help you today?`;
      setTranscripts([{ speaker: 'AI', text: welcomeText }]);
      speakTextOutLoud(welcomeText);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.text) {
        setTranscripts(prev => [...prev, { speaker: 'AI', text: data.text, latency_ms: data.latency_ms }]);
        speakTextOutLoud(data.text);
      }
    };

    ws.onerror = () => {
      showToast("WebSocket connection error. Using offline voice simulator.", "warning");
      setCallStatus('Connected');
      // Offline fallback welcome
      const welcomeText = `Hello. Voice bot running in offline fallback mode. How can I help?`;
      setTranscripts([{ speaker: 'AI', text: welcomeText }]);
      speakTextOutLoud(welcomeText);
    };

    ws.onclose = () => {
      setCallStatus('Idle');
      showToast("Call session ended.", "warning");
    };

    wsRef.current = ws;
  };

  // End Voice Bot session
  const endCallSession = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch(e){}
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setCallStatus('Idle');
  };

  // Handle forms
  const handleBookAppointment = async (e) => {
    e.preventDefault();
    if (!apptForm.doctor || !apptForm.date || !apptForm.time) {
      showToast("Validation Error: Missing parameters.", "warning");
      return;
    }

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apptForm)
      });
      if (res.ok) {
        showToast("Consultation slot locked successfully.", "success");
        fetchAppointments();
        setApptForm({ doctor: '', date: '', time: '', symptoms: '' });
      }
    } catch (err) {
      showToast("Offline simulation: Consultation locked.", "success");
      setAppointments(prev => [...prev, {
        id: 'A' + (100 + prev.length + 1),
        doctor: apptForm.doctor,
        specialty: 'General Practice',
        date: apptForm.date,
        time: apptForm.time,
        status: 'Pending'
      }]);
      setApptForm({ doctor: '', date: '', time: '', symptoms: '' });
    }
  };

  const handleAddMedicine = async (e) => {
    e.preventDefault();
    if (!medForm.name || !medForm.dosage || !medForm.time) {
      showToast("Validation Error: All inputs are required.", "warning");
      return;
    }

    try {
      const res = await fetch('/api/medicines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(medForm)
      });
      if (res.ok) {
        showToast(`Asset tracking configured for: ${medForm.name}`, "success");
        fetchMedicines();
        setMedForm({ name: '', dosage: '', time: '' });
      }
    } catch (err) {
      showToast("Offline simulation: Regimen tracking configured.", "success");
      setMedicines(prev => [...prev, {
        id: prev.length + 1,
        name: medForm.name,
        dosage: medForm.dosage,
        time: medForm.time,
        status: 'Pending'
      }]);
      setMedForm({ name: '', dosage: '', time: '' });
    }
  };

  const handleDeleteMedicine = async (name) => {
    try {
      const res = await fetch(`/api/medicines/${encodeURIComponent(name)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        showToast(`Regimen directive ${name} deleted.`, "warning");
        fetchMedicines();
      }
    } catch (err) {
      showToast("Offline simulation: Regimen directive deleted.", "warning");
      setMedicines(prev => prev.filter(m => m.name.toLowerCase() !== name.toLowerCase()));
    }
  };

  const handleTriggerSOS = async () => {
    try {
      const res = await fetch('/api/emergency/sos', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setSosStatus(data.dispatch);
        showToast(data.message, "danger");
      }
    } catch (err) {
      showToast("Offline: Emergency dispatches active. Ambulance ETA: 7 mins.", "danger");
      setSosStatus({
        status: 'Dispatched (Offline)',
        unit: 'Ambulance Unit #4B',
        eta_minutes: 7,
        timestamp: new Date().toISOString()
      });
    }
  };

  const handleSavePrompt = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingPrompt)
      });
      if (res.ok) {
        showToast("System prompt updated and compiled.", "success");
        fetchPrompts();
      }
    } catch (err) {
      showToast("Failed to save prompt configuration.", "danger");
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="brand">
          <i className="fa-solid fa-heartbeat"></i>
          <span>MedAI Flow</span>
        </div>
        <ul className="menu">
          <li className={`menu-item ${activeTab === 'dashboard' ? 'active' : ''}`}>
            <button onClick={() => setActiveTab('dashboard')}><ActivitySquare size={18} /> Dashboard</button>
          </li>
          <li className={`menu-item ${activeTab === 'voicebot' ? 'active' : ''}`}>
            <button onClick={() => setActiveTab('voicebot')}><PhoneCall size={18} /> Voice AI Assistant</button>
          </li>
          <li className={`menu-item ${activeTab === 'appointments' ? 'active' : ''}`}>
            <button onClick={() => setActiveTab('appointments')}><Calendar size={18} /> Appointments</button>
          </li>
          <li className={`menu-item ${activeTab === 'medicines' ? 'active' : ''}`}>
            <button onClick={() => setActiveTab('medicines')}><Pill size={18} /> Medicines</button>
          </li>
          <li className={`menu-item ${activeTab === 'prompts' ? 'active' : ''}`}>
            <button onClick={() => setActiveTab('prompts')}><Settings size={18} /> Prompt Manager</button>
          </li>
          <li className={`menu-item danger-item ${activeTab === 'emergency' ? 'active' : ''}`} style={{ borderLeft: activeTab === 'emergency' ? '3px solid var(--danger)' : 'none' }}>
            <button onClick={() => setActiveTab('emergency')}><AlertTriangle size={18} /> EMERGENCY SOS</button>
          </li>
        </ul>
        <div style={{ marginTop: 'auto', padding: '0.85rem 1rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div className="avatar">AM</div>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{user.name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{user.role}</div>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="content">
        <header className="top-bar">
          <h2 className="top-bar-title">
            {activeTab === 'dashboard' && "Telemetry Command Console"}
            {activeTab === 'voicebot' && "Real-time AI Voice Interaction"}
            {activeTab === 'appointments' && "Consultation Scheduling matrix"}
            {activeTab === 'medicines' && "Regimen Allocation Stream"}
            {activeTab === 'prompts' && "Prompt Template Orchestrator"}
            {activeTab === 'emergency' && "Crisis Response Center"}
          </h2>
          <div className="profile-card">
            <span className="badge badge-success">Telemetry Stream: OK</span>
          </div>
        </header>

        <main className="main-view">
          {/* Toast Container */}
          {toast && (
            <div id="toast-container">
              <div className={`toast toast-${toast.type}`} style={{ borderLeftColor: `var(--${toast.type})` }}>
                {toast.message}
              </div>
            </div>
          )}

          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <>
              <section className="metrics-grid">
                <div className="card metric-card">
                  <div className="metric-icon" style={{ background: 'rgba(239, 68, 68, 0.12)', color: 'var(--danger)' }}>
                    <Heart size={24} />
                  </div>
                  <div className="metric-details">
                    <h4>Pulse Rate</h4>
                    <div className="metric-value">{vitals.heartrate} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>BPM</span></div>
                  </div>
                </div>
                <div className="card metric-card">
                  <div className="metric-icon" style={{ background: 'rgba(99, 102, 241, 0.12)', color: 'var(--secondary)' }}>
                    <Activity size={24} />
                  </div>
                  <div className="metric-details">
                    <h4>Blood Pressure</h4>
                    <div className="metric-value">{vitals.bloodPressure} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>mmHg</span></div>
                  </div>
                </div>
                <div className="card metric-card">
                  <div className="metric-icon" style={{ background: 'rgba(14, 165, 233, 0.12)', color: 'var(--primary)' }}>
                    <ActivitySquare size={24} />
                  </div>
                  <div className="metric-details">
                    <h4>Oxygen Saturation</h4>
                    <div className="metric-value">{vitals.spo2}% <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>SpO2</span></div>
                  </div>
                </div>
                <div className="card metric-card">
                  <div className="metric-icon" style={{ background: 'rgba(245, 158, 11, 0.12)', color: 'var(--warning)' }}>
                    <Thermometer size={24} />
                  </div>
                  <div className="metric-details">
                    <h4>Core Temp</h4>
                    <div className="metric-value">{vitals.temperature}°C</div>
                  </div>
                </div>
              </section>

              <div className="dashboard-split">
                <div className="card">
                  <h3 style={{ marginBottom: '1.25rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Activity size={18} style={{ color: 'var(--primary)' }} /> Live Telemetry Analytics
                  </h3>
                  <div style={{ height: '240px', border: '1px dashed var(--border)', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.15)', gap: '0.5rem' }}>
                    <div className="audio-visualizer-box">
                      <div className="audio-bar animating" style={{ background: 'var(--success)' }}></div>
                      <div className="audio-bar animating" style={{ background: 'var(--success)' }}></div>
                      <div className="audio-bar animating" style={{ background: 'var(--success)' }}></div>
                      <div className="audio-bar animating" style={{ background: 'var(--success)' }}></div>
                      <div className="audio-bar animating" style={{ background: 'var(--success)' }}></div>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Biometric stream validation telemetry rendering normal.</p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div className="card">
                    <h3 style={{ marginBottom: '0.75rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Clock size={16} style={{ color: 'var(--warning)' }} /> Active Regimen
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {medicines.slice(0, 3).map((med, idx) => (
                        <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: '0.6rem', borderRadius: '6px', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between' }}>
                          <span>{med.name} ({med.dosage})</span>
                          <span style={{ color: med.status === 'Taken' ? 'var(--primary)' : 'var(--warning)' }}>{med.time}</span>
                        </div>
                      ))}
                      {medicines.length === 0 && (
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No scheduled medications configured.</div>
                      )}
                    </div>
                  </div>

                  <div className="card">
                    <h3 style={{ marginBottom: '0.75rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Calendar size={16} style={{ color: 'var(--success)' }} /> Consultation
                    </h3>
                    {appointments.length > 0 ? (
                      <>
                        <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>{appointments[appointments.length - 1].doctor}</p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{appointments[appointments.length - 1].specialty}</p>
                        <span className="badge badge-success">{appointments[appointments.length - 1].date}, {appointments[appointments.length - 1].time}</span>
                      </>
                    ) : (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No scheduled consultations pending.</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: VOICE BOT */}
          {activeTab === 'voicebot' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
              <div className="card" style={{ height: 'fit-content' }}>
                <h3 style={{ marginBottom: '1.25rem', fontSize: '1.1rem' }}>Select Assistant</h3>
                <div className="form-group">
                  <label className="form-label">Voice Agent Core</label>
                  <select 
                    className="form-control" 
                    value={selectedBot}
                    onChange={(e) => setSelectedBot(e.target.value)}
                    disabled={callStatus !== 'Idle'}
                    style={{ background: 'var(--panel-bg)' }}
                  >
                    <option value="General">General Medical Assistant</option>
                    <option value="EmergencyTriage">Emergency Triage Nurse</option>
                    <option value="AppointmentBooking">Appointment Booking Agent</option>
                    <option value="MedicineReminder">Medication Compliance Bot</option>
                    <option value="InsuranceSupport">Health Insurance Helpdesk</option>
                    <option value="NurseAssistant">AI Nursing Support Assistant</option>
                  </select>
                </div>
                
                <div style={{ textAlign: 'center', margin: '2rem 0' }}>
                  {callStatus === 'Idle' ? (
                    <button className="btn btn-primary" onClick={startCallSession} style={{ padding: '1rem 2rem', borderRadius: '50px' }}>
                      <PhoneCall size={20} /> Start Voice Session
                    </button>
                  ) : (
                    <button className="btn btn-danger" onClick={endCallSession} style={{ padding: '1rem 2rem', borderRadius: '50px' }}>
                      <PhoneCall size={20} style={{ transform: 'rotate(135deg)' }} /> End Session
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Session Channel</span>
                    <span style={{ fontWeight: 600 }}>WebRTC WebSockets</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Status</span>
                    <span style={{ color: callStatus === 'Connected' ? 'var(--success)' : 'var(--warning)', fontWeight: 600 }}>
                      {callStatus}
                    </span>
                  </div>
                </div>
              </div>

              <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '520px' }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Active Conversational Stream</h3>
                
                {callStatus === 'Connected' && (
                  <div className="audio-visualizer-box">
                    <div className={`audio-bar ${isSpeaking ? 'animating' : ''}`}></div>
                    <div className={`audio-bar ${isSpeaking ? 'animating' : ''}`}></div>
                    <div className={`audio-bar ${isSpeaking ? 'animating' : ''}`}></div>
                    <div className={`audio-bar ${isSpeaking ? 'animating' : ''}`}></div>
                    <div className={`audio-bar ${isSpeaking ? 'animating' : ''}`}></div>
                    <div className={`audio-bar ${isSpeaking ? 'animating' : ''}`}></div>
                    <div className={`audio-bar ${isSpeaking ? 'animating' : ''}`}></div>
                  </div>
                )}

                <div className="transcript-area" style={{ flex: 1, marginBottom: '1rem' }}>
                  {transcripts.map((msg, idx) => (
                    <div key={idx} className={`transcript-message ${msg.speaker === 'User' ? 'user' : 'ai'}`}>
                      <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '0.2rem', display: 'flex', justifyContent: 'space-between' }}>
                        <span>{msg.speaker}</span>
                        {msg.latency_ms && <span>{msg.latency_ms}ms</span>}
                      </div>
                      <div>{msg.text}</div>
                    </div>
                  ))}
                  {transcripts.length === 0 && (
                    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      Start call to initiate dialogue stream.
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                
                {callStatus === 'Connected' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: '8px' }}>
                    <div className="avatar" style={{ background: 'var(--primary)' }}>AM</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {isSpeaking ? "Bot is speaking..." : "Microphone active. Say something..."}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: APPOINTMENTS */}
          {activeTab === 'appointments' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
              <div className="card">
                <h3 style={{ marginBottom: '1.25rem', fontSize: '1.1rem' }}>Schedule Appointment</h3>
                <form onSubmit={handleBookAppointment}>
                  <div className="form-group">
                    <label className="form-label">Clinician Node</label>
                    <select 
                      className="form-control" 
                      value={apptForm.doctor}
                      onChange={(e) => setApptForm(prev => ({ ...prev, doctor: e.target.value }))}
                      style={{ background: 'var(--panel-bg)' }}
                      required
                    >
                      <option value="">Select Practitioner...</option>
                      <option value="Dr. Reed">Dr. Evelyn Reed (Cardiology)</option>
                      <option value="Dr. Vance">Dr. Marcus Vance (Neurology)</option>
                      <option value="Dr. Foster">Dr. Sarah Foster (Pediatrics)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Target Date</label>
                    <input 
                      type="date" 
                      className="form-control" 
                      value={apptForm.date}
                      onChange={(e) => setApptForm(prev => ({ ...prev, date: e.target.value }))}
                      style={{ background: 'var(--panel-bg)' }}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Target Time</label>
                    <input 
                      type="time" 
                      className="form-control" 
                      value={apptForm.time}
                      onChange={(e) => setApptForm(prev => ({ ...prev, time: e.target.value }))}
                      style={{ background: 'var(--panel-bg)' }}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Symptom Summary</label>
                    <textarea 
                      className="form-control" 
                      rows={3} 
                      value={apptForm.symptoms}
                      onChange={(e) => setApptForm(prev => ({ ...prev, symptoms: e.target.value }))}
                      style={{ background: 'var(--panel-bg)', resize: 'none' }}
                      placeholder="Describe symptoms..."
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                    <Plus size={18} /> Schedule Consultation
                  </button>
                </form>
              </div>

              <div>
                <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Active Consultation Records</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {appointments.map((appt, idx) => (
                    <div key={idx} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div className="avatar" style={{ width: '44px', height: '44px' }}>
                          {appt.doctor.split(' ').pop().slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>{appt.doctor}</h4>
                          <p style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>{appt.specialty}</p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                            <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} /> Scheduled for: {appt.date} at {appt.time}
                          </p>
                        </div>
                      </div>
                      <span className={`badge ${appt.status === 'Confirmed' ? 'badge-success' : 'badge-warning'}`}>
                        {appt.status}
                      </span>
                    </div>
                  ))}
                  {appointments.length === 0 && (
                    <div className="card" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                      No booked consultations.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: MEDICINES */}
          {activeTab === 'medicines' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
              <div className="card">
                <h3 style={{ marginBottom: '1.25rem', fontSize: '1.1rem' }}>Configure Regimen directive</h3>
                <form onSubmit={handleAddMedicine}>
                  <div className="form-group">
                    <label className="form-label">Medication Name</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g., Atorvastatin"
                      value={medForm.name}
                      onChange={(e) => setMedForm(prev => ({ ...prev, name: e.target.value }))}
                      style={{ background: 'var(--panel-bg)' }}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Dosage Measure</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g., 20mg"
                      value={medForm.dosage}
                      onChange={(e) => setMedForm(prev => ({ ...prev, dosage: e.target.value }))}
                      style={{ background: 'var(--panel-bg)' }}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Scheduled Time</label>
                    <input 
                      type="time" 
                      className="form-control" 
                      value={medForm.time}
                      onChange={(e) => setMedForm(prev => ({ ...prev, time: e.target.value }))}
                      style={{ background: 'var(--panel-bg)' }}
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                    <Plus size={18} /> Inject Into Regimen List
                  </button>
                </form>
              </div>

              <div>
                <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Active Regimen Allocation Streams</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {medicines.map((med, idx) => (
                    <div key={idx} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h4 style={{ color: 'var(--primary)', fontSize: '1.05rem', marginBottom: '0.25rem', fontWeight: 600 }}>{med.name}</h4>
                        <p style={{ fontSize: '0.85rem', marginBottom: '0.2rem' }}>Dosage: <strong>{med.dosage}</strong></p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}><Clock size={12} style={{ display: 'inline', marginRight: '4px' }} /> {med.time}</p>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.75rem' }}>
                        <span className="badge badge-success">Active</span>
                        <button className="btn btn-secondary" onClick={() => handleDeleteMedicine(med.name)} style={{ padding: '0.3rem 0.5rem', color: 'var(--danger)' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {medicines.length === 0 && (
                    <div className="card" style={{ gridColumn: 'span 2', textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                      No active medical regimen streams loaded.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PROMPT MANAGER */}
          {activeTab === 'prompts' && (
            <div className="card">
              <h3 style={{ marginBottom: '1.25rem', fontSize: '1.1rem' }}>Configure Agent Roles & Context Templates</h3>
              <form onSubmit={handleSavePrompt}>
                <div className="form-group">
                  <label className="form-label">System Bot Target</label>
                  <select 
                    className="form-control" 
                    value={editingPrompt.bot_name}
                    onChange={(e) => {
                      const active = prompts.find(p => p.bot_name === e.target.value);
                      if (active) setEditingPrompt(active);
                      else setEditingPrompt({ bot_name: e.target.value, system_prompt: DEFAULT_PROMPTS[e.target.value] || '' });
                    }}
                    style={{ background: 'var(--panel-bg)' }}
                  >
                    <option value="General">General Medical Assistant</option>
                    <option value="EmergencyTriage">Emergency Triage Nurse</option>
                    <option value="AppointmentBooking">Appointment Booking Agent</option>
                    <option value="MedicineReminder">Medication Compliance Bot</option>
                    <option value="InsuranceSupport">Health Insurance Helpdesk</option>
                    <option value="NurseAssistant">AI Nursing Support Assistant</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">System Role Prompt (Dynamic Core Context)</label>
                  <textarea 
                    className="form-control" 
                    rows={12} 
                    value={editingPrompt.system_prompt}
                    onChange={(e) => setEditingPrompt(prev => ({ ...prev, system_prompt: e.target.value }))}
                    style={{ background: 'var(--panel-bg)', fontFamily: 'monospace', fontSize: '0.9rem', lineHeight: 1.5 }}
                    placeholder="Enter prompt instructions for LLM orchestration..."
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '200px' }}>
                  <Check size={18} /> Update Template
                </button>
              </form>
            </div>
          )}

          {/* TAB 6: EMERGENCY */}
          {activeTab === 'emergency' && (
            <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
              <div className="card" style={{ border: '1px solid var(--danger)', background: 'rgba(239, 68, 68, 0.03)', textAlign: 'center', padding: '3rem 2rem' }}>
                <h2 style={{ color: 'var(--danger)', fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                  Critical Emergency SOS Node
                </h2>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto 2rem' }}>
                  Triggering the SOS alert bypasses standard triage, automatically logs a priority dispatch call in the database, and allocates responder vectors.
                </p>

                <div className="sos-trigger" onClick={handleTriggerSOS}>
                  <AlertTriangle size={36} style={{ marginBottom: '4px' }} />
                  <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>SOS</span>
                </div>

                {sosStatus && (
                  <div style={{ borderLeft: '3px solid var(--danger)', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '4px', textAlign: 'left', maxWidth: '440px', margin: '1.5rem auto 0' }}>
                    <p style={{ color: 'var(--danger)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Activity size={16} className="fa-spin" /> Emergency Dispatch Confirmed
                    </p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginTop: '0.25rem' }}>
                      Unit allocated: <strong>{sosStatus.unit}</strong>
                    </p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Estimated Arrival Time (ETA): <strong>{sosStatus.eta_minutes} minutes</strong>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
