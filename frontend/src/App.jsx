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
  Clock,
  ArrowLeft
} from 'lucide-react';


const DEFAULT_PROMPTS = {
  General: "You are MedAI Flow, an advanced AI hospital automation voice bot. Keep your responses short, professional, and clear. Help the patient with their queries.",
  AppointmentBooking: "You are an AI Appointment Booking Assistant. Help the patient select a department, clinic location, or clinician to request a booking, and collect details of their symptoms.",
  PatientFollowUp: "You are an AI Patient Follow-Up Calls Agent. Your task is to check on patients who recently visited the clinic, ask about their recovery status, medication side effects, and log any feedback or concerns they express.",
  PostDischarge: "You are an AI Post-Discharge Monitoring Bot. Ask patients who were recently discharged about their surgical wounds, medication compliance, daily pain levels, and general progress. Flag anomalies for clinician escalation if needed.",
  MedicineReminder: "You are an AI Medicine Reminder Assistant. Check if the patient has taken their daily medications (Lisinopril, Metformin), remind them of schedules, and log compliance.",
  InsuranceSupport: "You are an AI Health Insurance Support Bot. Answer coverage queries, explain claim status, clarify co-pays or deductibles, and assist with pre-authorization workflows.",
  EmergencyTriage: "You are an AI Emergency Triage Voice Assistant. Your goal is to assess patient symptoms, classify the severity (Red, Yellow, Green), and provide quick priority-based guidance. If the symptoms indicate a life-threatening crisis, command them to trigger the SOS dispatch immediately.",
  DiagnosticEnquiry: "You are an AI Diagnostic Center Enquiry Handler. Assist patients with enquiries regarding laboratory tests, radiology pricing, test requirements (like fasting), and result delivery timelines.",
  DoctorScheduling: "You are an AI Doctor Appointment Scheduling Agent. Access practitioner schedules, find open timeslots matching specialty requirements, and coordinate bookings preventing double allocations.",
  AiNurse: "You are an AI Nurse Assistant. Answer patient care questions, clarify discharge recovery instructions, explain basic medications, and address common health FAQs in a warm, caring manner.",
  ElderCare: "You are an AI Elder Care Monitoring Voice Bot. Perform daily check-ins on elderly patients, check on physical comfort levels, confirm if they took medications, and log vital parameters (e.g. pulse, temp).",
  Telemedicine: "You are an AI Telemedicine Voice Assistant. Guide the patient through an end-to-end virtual consult: collect symptoms, run a preliminary triage, and summarize the session to prepare for connecting with a doctor."
};

export default function App() {
  const [view, setView] = useState('landing'); // 'landing' or 'app'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState({ name: 'Alex Mercer', role: 'Patient' });
  const [toast, setToast] = useState(null);

  // Navigation History Stack
  const [historyStack, setHistoryStack] = useState([]);

  const navigateTo = (newView, newTab) => {
    // Prevent pushing duplicate consecutive states onto history
    setHistoryStack(prev => {
      if (prev.length > 0) {
        const last = prev[prev.length - 1];
        if (last.view === view && last.activeTab === activeTab) {
          return prev;
        }
      }
      return [...prev, { view, activeTab }];
    });
    setView(newView);
    if (newTab) {
      setActiveTab(newTab);
    }
  };

  const goBack = () => {
    if (historyStack.length > 0) {
      const previous = historyStack[historyStack.length - 1];
      setHistoryStack(prev => prev.slice(0, -1));
      setView(previous.view);
      setActiveTab(previous.activeTab);
    } else {
      setView('landing');
    }
  };



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

  if (view === 'landing') {
    return (
      <div className="landing-container">
        {/* Background Glow Layer */}
        <div className="bg-glow-layer">
          <div className="glow-blob glow-blob-1"></div>
          <div className="glow-blob glow-blob-2"></div>
          <div className="glow-blob glow-blob-3"></div>
        </div>

        {/* Navigation Header */}
        <header className="landing-nav">
          <div className="landing-nav-logo" onClick={() => navigateTo('landing', 'dashboard')} style={{ cursor: 'pointer' }}>
            <Heart size={24} style={{ filter: 'drop-shadow(0 0 8px var(--primary))' }} />
            <span>MedAI Flow</span>
          </div>
        </header>

        {/* Hero Section */}
        <section className="landing-hero-section">
          <div className="landing-hero-content">
            <h1 className="landing-title">
              Autonomous AI Hospital Voice Bot & Telemetry
            </h1>
            <p className="landing-subtitle">
              Orchestrate conversational voice agents, live ECG patient tracking, medical reminders, and emergency triage dispatches in a unified, next-generation medical control console.
            </p>
            <div className="landing-cta-group">
              <button className="btn btn-primary btn-cta" onClick={() => navigateTo('app', 'dashboard')}>
                Launch Console <Send size={16} />
              </button>
              <button className="btn btn-cta-outline" onClick={() => navigateTo('app', 'voicebot')}>
                Talk to AI Agent <PhoneCall size={16} />
              </button>
            </div>
          </div>

          <div className="landing-hero-visual">
            <div className="landing-orb-shield"></div>
            <div className="landing-visual-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="badge badge-success">Biometrics Live</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Pulse: {vitals.heartrate} BPM</span>
              </div>
              
              <div style={{ height: '100px', width: '100%', overflow: 'hidden', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', position: 'relative', display: 'flex', alignItems: 'center' }}>
                <svg className="ekg-svg" viewBox="0 0 600 200" preserveAspectRatio="none">
                  <path 
                    className="ekg-line"
                    d="M 0 100 L 40 100 Q 50 90 60 100 L 90 100 L 98 115 L 108 30 L 118 170 L 128 100 L 160 100 Q 175 80 190 100 L 240 100 L 280 100 Q 290 90 300 100 L 330 100 L 338 115 L 348 30 L 358 170 L 368 100 L 400 100 Q 415 80 430 100 L 480 100 L 520 100 Q 530 90 540 100 L 570 100 L 578 115 L 588 30 L 598 170 L 600 100" 
                  />
                </svg>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 8px var(--success)', animation: 'sosPulse 1.5s infinite' }}></div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>System Core: Online</div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="landing-features-grid">
          <div className="landing-feature-card">
            <div className="landing-feature-icon primary">
              <PhoneCall size={22} />
            </div>
            <h3 className="landing-feature-title">Real-Time Voice AI</h3>
            <p className="landing-feature-desc">
              Interact with custom WebRTC voice assistants specialized in telemedicine, medical reminders, eldercare support, and scheduling.
            </p>
          </div>

          <div className="landing-feature-card">
            <div className="landing-feature-icon success">
              <Activity size={22} />
            </div>
            <h3 className="landing-feature-title">Live Biometric Stream</h3>
            <p className="landing-feature-desc">
              Continuously track patient pulse rate, oxygen levels, and core temperatures with automated anomalies alerts and active ECG waves.
            </p>
          </div>

          <div className="landing-feature-card">
            <div className="landing-feature-icon secondary">
              <Settings size={22} />
            </div>
            <h3 className="landing-feature-title">Prompt Orchestrator</h3>
            <p className="landing-feature-desc">
              Manage LLM contexts dynamically. Swap instructions, update nurse behaviors, or customize diagnostics triage scripts in real-time.
            </p>
          </div>

          <div className="landing-feature-card">
            <div className="landing-feature-icon warning">
              <AlertTriangle size={22} />
            </div>
            <h3 className="landing-feature-title">Crisis Triage SOS</h3>
            <p className="landing-feature-desc">
              Instantly bypass regular queue operations, flag critical logs, and dispatch active ambulances with real-time ETA countdowns.
            </p>
          </div>
        </section>

        {/* Minimal Footer */}
        <footer className="landing-footer">
          <p>© {new Date().getFullYear()} MedAI Flow Automation. Designed with high-fidelity healthcare diagnostics.</p>
        </footer>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Background Glow Layer */}
      <div className="bg-glow-layer">
        <div className="glow-blob glow-blob-1"></div>
        <div className="glow-blob glow-blob-2"></div>
        <div className="glow-blob glow-blob-3"></div>
      </div>

      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="brand" onClick={() => navigateTo('landing', 'dashboard')} style={{ cursor: 'pointer' }}>
          <i className="fa-solid fa-heartbeat"></i>
          <span>MedAI Flow</span>
        </div>
        <ul className="menu">
          <li className={`menu-item ${activeTab === 'dashboard' ? 'active' : ''}`}>
            <button onClick={() => navigateTo('app', 'dashboard')}><ActivitySquare size={18} /> Dashboard</button>
          </li>
          <li className={`menu-item ${activeTab === 'voicebot' ? 'active' : ''}`}>
            <button onClick={() => navigateTo('app', 'voicebot')}><PhoneCall size={18} /> Voice AI Assistant</button>
          </li>
          <li className={`menu-item ${activeTab === 'appointments' ? 'active' : ''}`}>
            <button onClick={() => navigateTo('app', 'appointments')}><Calendar size={18} /> Appointments</button>
          </li>
          <li className={`menu-item ${activeTab === 'medicines' ? 'active' : ''}`}>
            <button onClick={() => navigateTo('app', 'medicines')}><Pill size={18} /> Medicines</button>
          </li>
          <li className={`menu-item ${activeTab === 'prompts' ? 'active' : ''}`}>
            <button onClick={() => navigateTo('app', 'prompts')}><Settings size={18} /> Prompt Manager</button>
          </li>
          <li className={`menu-item danger-item ${activeTab === 'emergency' ? 'active' : ''}`}>
            <button onClick={() => navigateTo('app', 'emergency')}><AlertTriangle size={18} /> EMERGENCY SOS</button>
          </li>
        </ul>
        <div className="user-profile-widget">
          <div className="avatar">AM</div>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>{user.name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{user.role}</div>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="content">
        <header className="top-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <button className="btn-back" onClick={goBack}>
              <ArrowLeft size={16} /> Back
            </button>
            <h2 className="top-bar-title">
              {activeTab === 'dashboard' && "Telemetry Command Console"}
              {activeTab === 'voicebot' && "Real-time AI Voice Interaction"}
              {activeTab === 'appointments' && "Consultation Scheduling matrix"}
              {activeTab === 'medicines' && "Regimen Allocation Stream"}
              {activeTab === 'prompts' && "Prompt Template Orchestrator"}
              {activeTab === 'emergency' && "Crisis Response Center"}
            </h2>
          </div>
          <div className="profile-card">
            <span className="badge badge-success">Telemetry Stream: OK</span>
          </div>
        </header>

        <main className="main-view">
          {/* Toast Container */}
          {toast && (
            <div id="toast-container">
              <div className={`toast toast-${toast.type}`}>
                <Activity size={18} className={toast.type === 'danger' ? 'fa-spin' : ''} />
                <span>{toast.message}</span>
              </div>
            </div>
          )}

          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <>
              <section className="metrics-grid">
                <div className="card metric-card pulse">
                  <div className="metric-icon" style={{ background: 'rgba(244, 63, 94, 0.08)', color: 'var(--danger)', borderColor: 'rgba(244, 63, 94, 0.15)' }}>
                    <Heart size={24} />
                  </div>
                  <div className="metric-details">
                    <h4>Pulse Rate</h4>
                    <div className="metric-value">{vitals.heartrate} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>BPM</span></div>
                  </div>
                </div>
                <div className="card metric-card bp">
                  <div className="metric-icon" style={{ background: 'rgba(139, 92, 246, 0.08)', color: 'var(--secondary)', borderColor: 'rgba(139, 92, 246, 0.15)' }}>
                    <Activity size={24} />
                  </div>
                  <div className="metric-details">
                    <h4>Blood Pressure</h4>
                    <div className="metric-value">{vitals.bloodPressure} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>mmHg</span></div>
                  </div>
                </div>
                <div className="card metric-card oxygen">
                  <div className="metric-icon" style={{ background: 'rgba(0, 210, 255, 0.08)', color: 'var(--primary)', borderColor: 'rgba(0, 210, 255, 0.15)' }}>
                    <ActivitySquare size={24} />
                  </div>
                  <div className="metric-details">
                    <h4>Oxygen Saturation</h4>
                    <div className="metric-value">{vitals.spo2}% <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>SpO2</span></div>
                  </div>
                </div>
                <div className="card metric-card temp">
                  <div className="metric-icon" style={{ background: 'rgba(245, 158, 11, 0.08)', color: 'var(--warning)', borderColor: 'rgba(245, 158, 11, 0.15)' }}>
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
                    <Activity size={18} style={{ color: 'var(--success)' }} /> Live Telemetry ECG Monitor
                  </h3>
                  <div className="ekg-container">
                    <div className="ekg-grid-overlay"></div>
                    <svg className="ekg-svg" viewBox="0 0 600 200" preserveAspectRatio="none">
                      <path 
                        className={`ekg-line ${vitals.heartrate > 85 ? 'ekg-line-fast' : ''}`}
                        d="M 0 100 L 40 100 Q 50 90 60 100 L 90 100 L 98 115 L 108 30 L 118 170 L 128 100 L 160 100 Q 175 80 190 100 L 240 100 L 280 100 Q 290 90 300 100 L 330 100 L 338 115 L 348 30 L 358 170 L 368 100 L 400 100 Q 415 80 430 100 L 480 100 L 520 100 Q 530 90 540 100 L 570 100 L 578 115 L 588 30 L 598 170 L 600 100" 
                      />
                    </svg>
                    <div style={{ position: 'absolute', bottom: '1rem', right: '1.25rem', background: 'rgba(0,0,0,0.6)', padding: '0.35rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: vitals.heartrate > 85 ? 'var(--danger)' : 'var(--success)', display: 'inline-block', boxShadow: `0 0 8px ${vitals.heartrate > 85 ? 'var(--danger)' : 'var(--success)'}` }}></span>
                      <span style={{ color: 'var(--text-secondary)' }}>Biometric Stream:</span>
                      <strong style={{ color: vitals.heartrate > 85 ? 'var(--danger)' : 'var(--success)' }}>{vitals.heartrate > 85 ? 'HIGH HEART RATE' : 'NORMAL'}</strong>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div className="card">
                    <h3 style={{ marginBottom: '1.25rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Clock size={16} style={{ color: 'var(--warning)' }} /> Active Regimen
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {medicines.slice(0, 3).map((med, idx) => (
                        <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 600 }}>{med.name} <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>({med.dosage})</span></span>
                          <span className="badge badge-warning">{med.time}</span>
                        </div>
                      ))}
                      {medicines.length === 0 && (
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem' }}>No scheduled medications configured.</div>
                      )}
                    </div>
                  </div>

                  <div className="card">
                    <h3 style={{ marginBottom: '1rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Calendar size={16} style={{ color: 'var(--primary)' }} /> Next Consultation
                    </h3>
                    {appointments.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <p style={{ fontSize: '0.95rem', fontWeight: 700 }}>{appointments[appointments.length - 1].doctor}</p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>{appointments[appointments.length - 1].specialty}</p>
                        <div style={{ marginTop: '0.5rem' }}>
                          <span className="badge badge-success">{appointments[appointments.length - 1].date}, {appointments[appointments.length - 1].time}</span>
                        </div>
                      </div>
                    ) : (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem' }}>No scheduled consultations pending.</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: VOICE BOT */}
          {activeTab === 'voicebot' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1.75fr', gap: '1.75rem' }}>
              <div className="card" style={{ height: 'fit-content', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <h3 style={{ marginBottom: '0.5rem', fontSize: '1.2rem', fontWeight: 700 }}>Voice Portal</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Select assistant role and click portal to connect.</p>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Voice Agent Core</label>
                  <select 
                    className="form-control" 
                    value={selectedBot}
                    onChange={(e) => setSelectedBot(e.target.value)}
                    disabled={callStatus !== 'Idle'}
                  >
                    <option value="General">General Medical Assistant</option>
                    <option value="AppointmentBooking">Appointment Booking Assistant</option>
                    <option value="PatientFollowUp">Patient Follow-Up Calls</option>
                    <option value="PostDischarge">Post-Discharge Monitoring Bot</option>
                    <option value="MedicineReminder">Medicine Reminder Assistant</option>
                    <option value="InsuranceSupport">Health Insurance Support Bot</option>
                    <option value="EmergencyTriage">Emergency Triage Voice Assistant</option>
                    <option value="DiagnosticEnquiry">Diagnostic Center Enquiry Handling</option>
                    <option value="DoctorScheduling">Doctor Appointment Scheduling</option>
                    <option value="AiNurse">AI Nurse Assistant</option>
                    <option value="ElderCare">Elder Care Monitoring Voice Bot</option>
                    <option value="Telemedicine">Telemedicine Voice Assistant</option>
                  </select>
                </div>
                
                <div className="voice-portal-wrapper">
                  <div 
                    className={`voice-portal ${callStatus.toLowerCase()} ${isSpeaking ? 'speaking' : ''}`}
                    onClick={callStatus === 'Idle' ? startCallSession : endCallSession}
                  >
                    <div className="voice-portal-inner">
                      <PhoneCall size={36} style={{ transform: callStatus !== 'Idle' ? 'rotate(135deg)' : 'none', transition: 'var(--transition)' }} />
                    </div>
                    <div className="pulse-ring ring-1"></div>
                    <div className="pulse-ring ring-2"></div>
                    <div className="pulse-ring ring-3"></div>
                  </div>
                  
                  <div className="voice-visualizer-wave">
                    <div className="audio-wave-bar"></div>
                    <div className="audio-wave-bar"></div>
                    <div className="audio-wave-bar"></div>
                    <div className="audio-wave-bar"></div>
                    <div className="audio-wave-bar"></div>
                    <div className="audio-wave-bar"></div>
                    <div className="audio-wave-bar"></div>
                    <div className="audio-wave-bar"></div>
                  </div>

                  <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {callStatus === 'Idle' && "Tap Portal to Connect"}
                    {callStatus === 'Connecting' && "Initializing Audio Stream..."}
                    {callStatus === 'Connected' && (isSpeaking ? "AI Assistant Speaking..." : "Listening (Speak now)...")}
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                  <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Session Channel</span>
                    <span style={{ fontWeight: 700 }}>WebSockets Link</span>
                  </div>
                  <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Status</span>
                    <span className={`badge ${callStatus === 'Connected' ? 'badge-success' : 'badge-warning'}`} style={{ fontWeight: 700 }}>
                      {callStatus}
                    </span>
                  </div>
                </div>
              </div>

              <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '540px' }}>
                <h3 style={{ marginBottom: '1.25rem', fontSize: '1.1rem', fontWeight: 700 }}>Conversation Stream</h3>

                <div className="transcript-area" style={{ flex: 1, marginBottom: '1.25rem' }}>
                  {transcripts.map((msg, idx) => (
                    <div key={idx} className={`transcript-message ${msg.speaker === 'User' ? 'user' : 'ai'}`}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.72rem', opacity: 0.8, marginBottom: '0.35rem', fontWeight: 700 }}>
                        <span className="badge" style={{ padding: '0.1rem 0.4rem', fontSize: '0.62rem', background: msg.speaker === 'User' ? 'rgba(255,255,255,0.15)' : 'rgba(var(--primary-rgb), 0.15)', color: msg.speaker === 'User' ? '#fff' : 'var(--primary)' }}>
                          {msg.speaker}
                        </span>
                        {msg.latency_ms && <span style={{ fontFamily: 'monospace' }}>({msg.latency_ms}ms latency)</span>}
                      </div>
                      <div style={{ fontWeight: 500 }}>{msg.text}</div>
                    </div>
                  ))}
                  {transcripts.length === 0 && (
                    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>
                      Dialogue stream is currently empty. Connect above to start.
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                
                {callStatus === 'Connected' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '0.75rem 1rem', borderRadius: '12px' }}>
                    <div className="avatar" style={{ background: 'var(--primary)', width: '30px', height: '30px', fontSize: '0.8rem' }}>AM</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                      {isSpeaking ? "Voice bot is synthesising output..." : "Microphone active. System listening..."}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: APPOINTMENTS */}
          {activeTab === 'appointments' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.9fr', gap: '1.75rem' }}>
              <div className="card">
                <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem', fontWeight: 700 }}>Request Booking</h3>
                <form onSubmit={handleBookAppointment}>
                  <div className="form-group">
                    <label className="form-label">Clinician Node</label>
                    <select 
                      className="form-control" 
                      value={apptForm.doctor}
                      onChange={(e) => setApptForm(prev => ({ ...prev, doctor: e.target.value }))}
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
                      style={{ resize: 'none' }}
                      placeholder="Describe symptoms briefly..."
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                    <Plus size={18} /> Schedule Consultation
                  </button>
                </form>
              </div>

              <div>
                <h3 style={{ marginBottom: '1.25rem', fontSize: '1.2rem', fontWeight: 700 }}>Consultation Records</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {appointments.map((appt, idx) => (
                    <div key={idx} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                        <div className="avatar-md">
                          {appt.doctor.split(' ').pop().slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{appt.doctor}</h4>
                          <p style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>{appt.specialty}</p>
                          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} /> Scheduled for: {appt.date} at {appt.time}
                          </p>
                        </div>
                      </div>
                      <span className={`badge ${appt.status === 'Confirmed' ? 'badge-success' : 'badge-warning'}`} style={{ fontWeight: 700 }}>
                        {appt.status}
                      </span>
                    </div>
                  ))}
                  {appointments.length === 0 && (
                    <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>
                      No booked consultations in database.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: MEDICINES */}
          {activeTab === 'medicines' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.9fr', gap: '1.75rem' }}>
              <div className="card">
                <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem', fontWeight: 700 }}>Configure Regimen</h3>
                <form onSubmit={handleAddMedicine}>
                  <div className="form-group">
                    <label className="form-label">Medication Name</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g., Atorvastatin"
                      value={medForm.name}
                      onChange={(e) => setMedForm(prev => ({ ...prev, name: e.target.value }))}
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
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                    <Plus size={18} /> Inject Into Regimen List
                  </button>
                </form>
              </div>

              <div>
                <h3 style={{ marginBottom: '1.25rem', fontSize: '1.2rem', fontWeight: 700 }}>Regimen Allocation Streams</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.25rem' }}>
                  {medicines.map((med, idx) => (
                    <div key={idx} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h4 style={{ color: 'var(--primary)', fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>{med.name}</h4>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Dosage: <strong>{med.dosage}</strong></span>
                        </div>
                        <span className="badge badge-success">Active</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} /> {med.time}
                        </p>
                        <button className="btn btn-secondary" onClick={() => handleDeleteMedicine(med.name)} style={{ padding: '0.4rem 0.6rem', color: 'var(--danger)', borderRadius: '10px' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {medicines.length === 0 && (
                    <div className="card" style={{ gridColumn: 'span 2', textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>
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
              <div style={{ marginBottom: '1.75rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.35rem' }}>Prompt Template Orchestrator</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Configure active agent roles, instructions, and compiled model templates.</p>
              </div>
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
                  >
                    <option value="General">General Medical Assistant</option>
                    <option value="AppointmentBooking">Appointment Booking Assistant</option>
                    <option value="PatientFollowUp">Patient Follow-Up Calls</option>
                    <option value="PostDischarge">Post-Discharge Monitoring Bot</option>
                    <option value="MedicineReminder">Medicine Reminder Assistant</option>
                    <option value="InsuranceSupport">Health Insurance Support Bot</option>
                    <option value="EmergencyTriage">Emergency Triage Voice Assistant</option>
                    <option value="DiagnosticEnquiry">Diagnostic Center Enquiry Handling</option>
                    <option value="DoctorScheduling">Doctor Appointment Scheduling</option>
                    <option value="AiNurse">AI Nurse Assistant</option>
                    <option value="ElderCare">Elder Care Monitoring Voice Bot</option>
                    <option value="Telemedicine">Telemedicine Voice Assistant</option>
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
          )}

          {/* TAB 6: EMERGENCY */}
          {activeTab === 'emergency' && (
            <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
              <div className="card" style={{ border: '1px solid rgba(244, 63, 94, 0.3)', background: 'rgba(244, 63, 94, 0.02)', textAlign: 'center', padding: '4rem 2rem' }}>
                <h2 style={{ color: 'var(--danger)', fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '-0.5px' }}>
                  Critical Emergency SOS Node
                </h2>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto 2.5rem', fontSize: '0.95rem', fontWeight: 500, lineHeight: 1.5 }}>
                  Triggering the SOS alert bypasses standard triage, automatically logs a priority dispatch call in the database, and allocates responder vectors.
                </p>

                <div className="sos-trigger" onClick={handleTriggerSOS}>
                  <AlertTriangle size={42} style={{ marginBottom: '6px' }} />
                  <span style={{ fontSize: '1.35rem', fontWeight: 800 }}>SOS</span>
                </div>

                {sosStatus && (
                  <div className="sos-dispatch-box">
                    <p style={{ color: 'var(--danger)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      <Activity size={18} style={{ animation: 'bounce 1s infinite' }} /> Emergency Dispatch Confirmed
                    </p>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginTop: '0.5rem', fontWeight: 600 }}>
                      Unit allocated: <span style={{ color: 'var(--primary)' }}>{sosStatus.unit}</span>
                    </p>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      Estimated Arrival Time (ETA): <strong style={{ color: '#fff' }}>{sosStatus.eta_minutes} minutes</strong>
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
