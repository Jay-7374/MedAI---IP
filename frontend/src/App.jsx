import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft,
  Activity
} from 'lucide-react';
import { apiFetch, getWsUrl } from './apiClient';

// Components
import Header from './components/Header';
import Sidebar from './components/Sidebar';

// Pages
import Landing from './pages/Landing';
import Features from './pages/Features';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Scheduling from './pages/Scheduling';
import Adherence from './pages/Adherence';
import VoiceSimulator from './pages/VoiceSimulator';
import PromptOrchestrator from './pages/PromptOrchestrator';
import EmergencySOS from './pages/EmergencySOS';
import Telemedicine from './pages/Telemedicine';
import StaffConsole from './pages/StaffConsole';
import AdminConsole from './pages/AdminConsole';


const DEFAULT_PROMPTS = {
  NaturalSpeechAuth: "You are the Salus Natural Speech Authentication System. Your job is to verify the patient's identity. Empathetically prompt the patient for their Full Name and Date of Birth (DOB) via speech. If the patient provides their name (e.g., 'Alex Mercer') and DOB (e.g., 'July 24, 1995'), confirm that they are verified. If verification is successful, say: 'Thank you, Alex. Your identity is verified.' If the name or DOB doesn't match, ask them to repeat it. If it fails twice consecutively, state: 'I am sorry, I am having trouble verifying your details. Let me transfer you directly to our front desk receptionist.' and route them to human receptionist.",
  ConversationalScheduling: "You are the Salus Conversational Scheduling & Diagnostic Enquiries Assistant. You help patients book, reschedule, or cancel doctor appointments and specific diagnostic tests (like X-rays or ultrasounds) naturally using voice. Keep responses short and conversational. When booking is complete, state the confirmed appointment details clearly so the system can generate a confirmation.",
  PostDischargeCheckIn: "You are the Salus Post-Discharge Monitoring Assistant. Empathetically guide the patient through an automated 5-question recovery scorecard. Ask the questions one by one and wait for their answer: 1) What is your pain level on a scale of 1-10? 2) Is there any redness, swelling, or drainage near your surgical wound? 3) Are you able to tolerate food and fluids? 4) Have you taken all your prescribed medications today? 5) Do you have a fever above 101 degrees? Once all 5 questions are logged, summarize the scorecard and state that their recovery status has been recorded.",
  MedicationAdherence: "You are the Salus Medication Adherence Assistant. Remind chronic care or elderly patients of their medication dosages. Read aloud: 'Lisinopril 10mg once daily in the morning' and 'Metformin 500mg twice daily with meals'. Capture their verbal 'Yes/No' or custom affirmations of adherence. If they confirm compliance, state: 'Thank you, medication compliance has been logged.'",
  InsurancePolicyIntake: "You are the Salus Insurance & Financial Orchestrator. Prompt the patient to state or spell out their insurance provider name and policy group number. Once they state it, verbally deliver a plain-language financial estimate of covered costs and out-of-pocket liabilities (e.g., BlueCross Policy Group 98124 has a co-pay of $45 and is covered at 90%, leaving your estimated out-of-pocket liability at $45).",
  EmergencySeverity: "You are the Salus Emergency Severity Classification Assistant. Assess acute medical crises using deterministic Emergency Severity Index (ESI) protocols. If the symptoms indicate a life-threatening crisis (like chest pain, severe difficulty breathing, or sudden numbness), instantly state: 'CRITICAL ALERT: Bypassing administrative hold lines. Routing to emergency floor floor in 2 seconds.' and output [EMERGENCY_ROUTING: Emergency floor connected]. Otherwise, suggest appropriate non-critical guidelines.",
  AiNurseAdvice: "You are the Salus AI Nurse Assistant. Answer open-ended, non-diagnostic questions regarding diet restrictions, recovery milestones, or wound care. Anchor all advice strictly in approved guidelines: clear liquids for the first 24 hours, keep dressings clean and dry, avoid lifting items over 10 lbs, and contact the clinic if fever exceeds 101°F. Do not diagnose or prescribe treatment.",
  ElderCareTerminal: "You are the Salus Elder Care Companion. Engage in a friendly companion check-in call with isolated elderly patients. Warmly ask about their comfort, mood, sleep, and appetite, while assessing conversational tone, sentiment, and environmental cues for cognitive or physical decline.",
  TelemedicineBridge: "You are the Salus Telemedicine Assistant. Verify if the patient is ready for their virtual doctor consultation. Once they confirm, state: 'Perfect, initializing secure audio/video WebRTC telemedicine bridge to connect you with the doctor now.' and output [TELEMEDICINE_BRIDGE: Ready] to launch the WebRTC video link."
};

export default function App() {
  const [view, setView] = useState('landing'); // 'landing' or 'app'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState(null);
  // Only Admin role can access admin features
  const isAdmin = user?.role?.toLowerCase() === 'admin';
  const [toast, setToast] = useState(null);
  const [toastExiting, setToastExiting] = useState(false);

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
  const [editingPrompt, setEditingPrompt] = useState({ bot_name: 'NaturalSpeechAuth', system_prompt: '' });

  // Voice Call Bot States
  const [selectedBot, setSelectedBot] = useState('NaturalSpeechAuth');
  const [callStatus, setCallStatus] = useState('Idle'); // 'Idle', 'Connecting', 'Connected'
  const setCallStatusSynced = (val) => {
    callStatusRef.current = val;
    setCallStatus(val);
  };
  const [transcripts, setTranscripts] = useState([]);
  const [interimText, setInterimText] = useState(''); // live partial transcription
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [sessionId, setSessionId] = useState('');
  
  // Custom Simulation and Streamlined Feature States
  const [simulateDbTimeout, setSimulateDbTimeout] = useState(false);
  const [consecutiveErrors, setConsecutiveErrors] = useState(0);
  const [sipTransferActive, setSipTransferActive] = useState(false);
  const [telemedicineActive, setTelemedicineActive] = useState(false);
  const [smsMessages, setSmsMessages] = useState([]);

  // Authentication states
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [authForm, setAuthForm] = useState({ username: '', password: '', email: '', role: 'Patient' });
  const [authError, setAuthError] = useState('');
  const [userUnregistered, setUserUnregistered] = useState(false);

  // Refs to prevent stale closures in Speech API event loops
  const sipTransferActiveRef = useRef(false);
  const telemedicineActiveRef = useRef(false);
  const callStatusRef = useRef('Idle');
  const wsRef = useRef(null);
  const recognitionRef = useRef(null);
  const chatEndRef = useRef(null);

  // Toast Helper
  const showToast = (message, type = 'primary') => {
    setToastExiting(false);
    setToast({ message, type });
    setTimeout(() => setToastExiting(true), 3600);
    setTimeout(() => {
      setToast(null);
      setToastExiting(false);
    }, 4000);
  };

  // Fetch telemetry vitals
  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        const res = await apiFetch('/api/telemetry');
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
      const res = await apiFetch('/api/appointments');
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
      const res = await apiFetch('/api/medicines');
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
      const res = await apiFetch('/api/prompts', {
        headers: { 'X-User-Role': user?.role || '' }
      });
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

  const fetchSmsMessages = async () => {
    try {
      const res = await apiFetch('/api/sms');
      if (res.ok) {
        const data = await res.json();
        setSmsMessages(data);
      }
    } catch (err) {
      console.warn("SMS log fetch failed, using local mock", err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAppointments();
      fetchMedicines();
      fetchPrompts();
      fetchSmsMessages();
    } else {
      setAppointments([]);
      setMedicines([]);
      setPrompts([]);
      setSmsMessages([]);
    }
  }, [user]);

  useEffect(() => {
    if (prompts.length > 0) {
      const active = prompts.find(p => p.bot_name === editingPrompt.bot_name) || prompts.find(p => p.bot_name === selectedBot);
      if (active) setEditingPrompt(active);
    }
  }, [selectedBot, prompts]);

  // Scroll to bottom whenever a new message or interim text appears
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts, interimText]);

  // Camera stream activation for WebRTC telemedicine bridge
  useEffect(() => {
    let localStream = null;
    if (view === 'telemedicine') {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          localStream = stream;
          const localVid = document.getElementById('localVideo');
          if (localVid) {
            localVid.srcObject = stream;
          }
        })
        .catch(err => {
          console.warn("Camera/microphone access blocked or unavailable:", err);
          showToast("Camera access unavailable. Displaying secure voice-only placeholder.", "warning");
        });
    }
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [view]);

  // Stable refs so event handlers always read latest values without stale closures
  const sessionIdRef = useRef('');
  const selectedBotRef = useRef('NaturalSpeechAuth');
  const simulateDbTimeoutRef = useRef(false);
  const consecutiveErrorsRef = useRef(0);
  const isSpeakingRef = useRef(false);

  useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);
  useEffect(() => { selectedBotRef.current = selectedBot; }, [selectedBot]);
  useEffect(() => { simulateDbTimeoutRef.current = simulateDbTimeout; }, [simulateDbTimeout]);
  useEffect(() => { consecutiveErrorsRef.current = consecutiveErrors; }, [consecutiveErrors]);
  useEffect(() => { isSpeakingRef.current = isSpeaking; }, [isSpeaking]);

  // Initialize Speech Recognition ONCE on mount
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const rec = new SpeechRecognition();
    rec.continuous = true;       // keep listening — don't cut off mid-sentence
    rec.interimResults = true;   // stream partial text as the user speaks
    rec.lang = 'en-US';

    rec.onresult = (event) => {
      // Build the latest interim transcript from all current results
      let interim = '';
      let finalText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const chunk = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += chunk;
        } else {
          interim += chunk;
        }
      }

      // Always update the live typing bubble with what's being heard right now
      if (interim) {
        setInterimText(interim);
      }

      // When a final result arrives, commit it to the transcript and send to bot
      if (finalText.trim()) {
        setInterimText('');
        setConsecutiveErrors(0);
        consecutiveErrorsRef.current = 0;
        setTranscripts(prev => [...prev, { speaker: 'User', text: finalText.trim() }]);
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'text',
            session_id: sessionIdRef.current,
            text: finalText.trim(),
            bot_name: selectedBotRef.current,
            simulate_db_timeout: simulateDbTimeoutRef.current,
            consecutive_errors: 0
          }));
        }
      }
    };

    rec.onerror = (event) => {
      console.warn("Speech recognition error:", event.error);
      if (event.error === 'no-speech' || event.error === 'audio-capture') {
        setConsecutiveErrors(prev => {
          const nextVal = prev + 1;
          consecutiveErrorsRef.current = nextVal;
          if (nextVal >= 2 && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
              type: 'text',
              session_id: sessionIdRef.current,
              text: '[FAILED_TO_UNDERSTAND]',
              bot_name: selectedBotRef.current,
              simulate_db_timeout: simulateDbTimeoutRef.current,
              consecutive_errors: nextVal
            }));
          }
          return nextVal;
        });
      }
      // Do NOT call rec.start() here — the browser always fires onend right after
      // onerror and the session isn't fully closed yet, so calling start() here
      // throws InvalidStateError and can permanently silence the mic.
      // onend below handles the restart reliably.
    };

    rec.onend = () => {
      // Give the audio subsystem a short moment to fully release before restarting.
      // Without this delay, rec.start() can throw InvalidStateError on Chrome/Safari
      // when onend fires right after onerror or immediately after utterance.onend
      // already started a new session.
      if (callStatusRef.current === 'Connected' && !isSpeakingRef.current &&
          !sipTransferActiveRef.current && !telemedicineActiveRef.current) {
        setTimeout(() => {
          if (callStatusRef.current === 'Connected' && !isSpeakingRef.current &&
              !sipTransferActiveRef.current && !telemedicineActiveRef.current) {
            try { rec.start(); } catch(e) {}
          }
        }, 150);
      }
    };

    recognitionRef.current = rec;
    return () => { try { rec.stop(); } catch(e) {} };
  }, []); // empty deps: create once, never re-create

  // Trigger web speech synthesis
  const speakTextOutLoud = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onstart = () => {
        isSpeakingRef.current = true;
        setIsSpeaking(true);
        setInterimText(''); // clear any partial transcription
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop(); // Stop listening while bot is speaking
          } catch(e){}
        }
      };

      utterance.onend = () => {
        // Update the ref synchronously FIRST so any concurrent rec.onend
        // timer that fires during the 150 ms window sees the correct value.
        isSpeakingRef.current = false;
        setIsSpeaking(false);
        if (telemedicineActiveRef.current) {
          setView('telemedicine');
          setCallStatusSynced('Idle');
          if (wsRef.current) wsRef.current.close();
        } else if (sipTransferActiveRef.current) {
          setCallStatusSynced('Idle');
          if (wsRef.current) wsRef.current.close();
        } else if (callStatusRef.current === 'Connected' && recognitionRef.current) {
          // Small delay so the browser audio subsystem fully releases from TTS
          // before we try to open the mic again.  Without this, rec.start()
          // silently fails on Chrome and the mic goes permanently dark.
          setTimeout(() => {
            if (callStatusRef.current === 'Connected' && !isSpeakingRef.current &&
                !sipTransferActiveRef.current && !telemedicineActiveRef.current) {
              try { recognitionRef.current.start(); } catch(e) {}
            }
          }, 150);
        }
      };

      window.speechSynthesis.speak(utterance);
    }
  };

  // Start Voice Bot session
  const startCallSession = async () => {
    const newSessionId = 'SESS-' + Date.now();
    setSessionId(newSessionId);
    setCallStatusSynced('Connecting');
    setTranscripts([]);
    setConsecutiveErrors(0);
    setSipTransferActive(false);
    setTelemedicineActive(false);
    sipTransferActiveRef.current = false;
    telemedicineActiveRef.current = false;

    // 1. Register Session on Backend DB
    try {
      await apiFetch('/api/sessions', {
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
    const wsUrl = getWsUrl('/ws/voice');
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setCallStatusSynced('Connected');
      showToast("Real-time voice bot link established.", "success");
      
      // If db timeout is simulated on start
      if (simulateDbTimeout) {
        ws.send(JSON.stringify({
          type: 'text',
          session_id: newSessionId,
          text: '[INITIALIZE_CALL_DB_TIMEOUT]',
          bot_name: selectedBot,
          simulate_db_timeout: true,
          consecutive_errors: 0
        }));
        return;
      }
      
      // Send welcoming statement
      const welcomeText = `Hello. I am your Salus ${selectedBot === 'NaturalSpeechAuth' ? 'Natural Speech Authentication' : selectedBot} Bot. How can I help you today?`;
      setTranscripts([{ speaker: 'AI', text: welcomeText }]);
      speakTextOutLoud(welcomeText);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.text) {
        setTranscripts(prev => [...prev, { speaker: 'AI', text: data.text, latency_ms: data.latency_ms }]);
        
        // Handle triggers before speaking to prepare state transitions
        if (data.sip_transfer) {
          setSipTransferActive(true);
          sipTransferActiveRef.current = true;
        }
        if (data.emergency_routing) {
          setTimeout(() => {
            setActiveTab('emergency');
            handleTriggerSOS();
          }, 1800);
        }
        if (data.telemedicine_bridge) {
          setTelemedicineActive(true);
          telemedicineActiveRef.current = true;
        }

        speakTextOutLoud(data.text);
        
        // Refresh telemetry database elements
        fetchAppointments();
        fetchMedicines();
        fetchSmsMessages();
      }
    };

    ws.onerror = () => {
      showToast("WebSocket connection error. Using offline voice simulator.", "warning");
      setCallStatusSynced('Connected');
      const welcomeText = `Hello. Voice bot running in offline fallback mode. How can I help?`;
      setTranscripts([{ speaker: 'AI', text: welcomeText }]);
      speakTextOutLoud(welcomeText);
    };

    ws.onclose = () => {
      setCallStatusSynced('Idle');
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
    isSpeakingRef.current = false;
    setIsSpeaking(false);
    setInterimText('');
    setCallStatusSynced('Idle');
  };

  // Authentication handlers
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setUserUnregistered(false);

    if (authMode === 'login') {
      try {
        const res = await apiFetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: authForm.username,
            password: authForm.password
          })
        });

        if (res.status === 404) {
          setUserUnregistered(true);
          setAuthError("This username is not registered yet. Switch to Sign Up below to create an account.");
          return;
        }

        const data = await res.json();
        if (res.ok) {
          const name = data.name || data.user?.name;
          const role = data.role || data.user?.role;
          setUser({ name, role });
          showToast(`Welcome back, ${name}!`, 'success');
          setView('app');
          setActiveTab('dashboard');
          // Reset form
          setAuthForm({ username: '', password: '', email: '', role: 'Patient' });
        } else {
          setAuthError(data.detail || "Authentication failed. Please verify credentials.");
        }
      } catch (err) {
        setAuthError("Authentication server error. Please check if the authentication service is running.");
      }
    } else {
      // signup mode
      if (!authForm.email) {
        setAuthError("Email is required for Sign Up.");
        return;
      }
      try {
        const res = await apiFetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: authForm.username,
            email: authForm.email,
            password: authForm.password,
            role: authForm.role || 'Patient'
          })
        });

        const data = await res.json();
        if (res.ok) {
          setUser({ name: data.name, role: data.role });
          showToast(`Account created successfully! Welcome, ${data.name}!`, 'success');
          setView('app');
          setActiveTab('dashboard');
          // Reset form
          setAuthForm({ username: '', password: '', email: '', role: 'Patient' });
        } else {
          setAuthError(data.detail || "Sign up failed. Username or email might be taken.");
        }
      } catch (err) {
        setAuthError("Registration server error. Please check if the authentication service is running.");
      }
    }
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
    if (!isAdmin) {
      showToast("Access denied. Admin privileges required.", "danger");
      return false;
    }
    try {
      const res = await fetch('/api/prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': user?.role || ''
        },
        body: JSON.stringify(editingPrompt)
      });
      if (res.ok) {
        showToast("System prompt updated and compiled.", "success");
        fetchPrompts();
        return true;
      }
    } catch (err) {
      showToast("Failed to save prompt configuration.", "danger");
    }
    return false;
  };

  if (view === 'landing' || view === 'features' || view === 'login') {
    return (
      <div className={`landing-portal-wrapper view-${view}`}>
        <div className="portal-slide slide-landing">
          <Landing vitals={vitals} navigateTo={navigateTo} />
        </div>
        <div className="portal-slide slide-features">
          <Features navigateTo={navigateTo} />
        </div>
        <div className="portal-slide slide-login">
          <Login 
            authMode={authMode}
            setAuthMode={setAuthMode}
            authForm={authForm}
            setAuthForm={setAuthForm}
            authError={authError}
            setAuthError={setAuthError}
            userUnregistered={userUnregistered}
            setUserUnregistered={setUserUnregistered}
            handleAuthSubmit={handleAuthSubmit}
            setView={setView}
          />
        </div>
      </div>
    );
  }

  if (view === 'telemedicine') {
    return (
      <Telemedicine 
        setView={setView}
        setActiveTab={setActiveTab}
        setTelemedicineActive={setTelemedicineActive}
        telemedicineActiveRef={telemedicineActiveRef}
        showToast={showToast}
      />
    );
  }

  return (
    <div className="app-container view-transition-root" key="view-app">
      {/* Background Glow Layer */}
      <div className="bg-glow-layer">
        <div className="glow-blob glow-blob-1"></div>
        <div className="glow-blob glow-blob-2"></div>
        <div className="glow-blob glow-blob-3"></div>
      </div>

      {/* Top Navigation Panel */}
      <header className="top-navigation-panel">
        <Header 
          user={user}
          setUser={setUser}
          setView={setView}
          navigateTo={navigateTo}
          showToast={showToast}
        />
        <Sidebar 
          user={user}
          activeTab={activeTab}
          navigateTo={navigateTo}
          isAdmin={isAdmin}
        />
      </header>

      {/* Main Container */}
      <div className="content">
        <header className="top-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <button className="btn-back" onClick={goBack}>
              <ArrowLeft size={16} /> Back
            </button>
            <h2 className="top-bar-title">
              {activeTab === 'dashboard' && "Telemetry & Operations Dashboard"}
              {activeTab === 'voicebot' && "Real-time AI Voice Simulator Portal"}
              {activeTab === 'appointments' && "Conversational Scheduling & Diagnostics"}
              {activeTab === 'medicines' && "Active Medication Adherence Alert System"}
              {activeTab === 'prompts' && "System Prompt Orchestrator"}
              {activeTab === 'emergency' && "Emergency Severity Classification (ESI)"}
              {activeTab === 'staffconsole' && "Clinical Staff Console Station"}
              {activeTab === 'adminconsole' && "Salus System Administration Console"}
            </h2>
          </div>
        </header>

        <main className="main-view">
          {/* Toast Container */}
          {toast && (
            <div id="toast-container">
              <div className={`toast toast-${toast.type}${toastExiting ? ' toast-exit' : ''}`}>
                <Activity size={18} className={toast.type === 'danger' ? 'fa-spin' : ''} />
                <span>{toast.message}</span>
              </div>
            </div>
          )}

          <div className="view-fade-in" key={activeTab}>
            {activeTab === 'dashboard' && (
              <Dashboard 
                user={user}
                medicines={medicines}
                smsMessages={smsMessages}
                appointments={appointments}
                simulateDbTimeout={simulateDbTimeout}
                consecutiveErrors={consecutiveErrors}
                sosStatus={sosStatus}
                navigateTo={navigateTo}
              />
            )}
            
            {activeTab === 'voicebot' && (
              <VoiceSimulator 
                user={user}
                isAdmin={isAdmin}
                selectedBot={selectedBot}
                setSelectedBot={setSelectedBot}
                callStatus={callStatus}
                simulateDbTimeout={simulateDbTimeout}
                setSimulateDbTimeout={setSimulateDbTimeout}
                consecutiveErrors={consecutiveErrors}
                setConsecutiveErrors={setConsecutiveErrors}
                sipTransferActive={sipTransferActive}
                setSipTransferActive={setSipTransferActive}
                sipTransferActiveRef={sipTransferActiveRef}
                isSpeaking={isSpeaking}
                startCallSession={startCallSession}
                endCallSession={endCallSession}
                transcripts={transcripts}
                interimText={interimText}
                chatEndRef={chatEndRef}
                wsRef={wsRef}
                sessionId={sessionId}
                showToast={showToast}
              />
            )}

            {activeTab === 'appointments' && (
              <Scheduling 
                appointments={appointments}
                apptForm={apptForm}
                setApptForm={setApptForm}
                handleBookAppointment={handleBookAppointment}
              />
            )}

            {activeTab === 'medicines' && (
              <Adherence 
                medicines={medicines}
                medForm={medForm}
                setMedForm={setMedForm}
                handleAddMedicine={handleAddMedicine}
                handleDeleteMedicine={handleDeleteMedicine}
              />
            )}

            {activeTab === 'prompts' && (
              <PromptOrchestrator 
                isAdmin={isAdmin}
                editingPrompt={editingPrompt}
                setEditingPrompt={setEditingPrompt}
                prompts={prompts}
                handleSavePrompt={handleSavePrompt}
                DEFAULT_PROMPTS={DEFAULT_PROMPTS}
              />
            )}

            {activeTab === 'emergency' && (
              <EmergencySOS 
                sosStatus={sosStatus}
                handleTriggerSOS={handleTriggerSOS}
              />
            )}

            {activeTab === 'staffconsole' && (
              <StaffConsole 
                appointments={appointments}
                medicines={medicines}
                vitals={vitals}
                sosStatus={sosStatus}
                navigateTo={navigateTo}
                showToast={showToast}
              />
            )}

            {activeTab === 'adminconsole' && (
              <AdminConsole 
                simulateDbTimeout={simulateDbTimeout}
                setSimulateDbTimeout={setSimulateDbTimeout}
                consecutiveErrors={consecutiveErrors}
                setConsecutiveErrors={setConsecutiveErrors}
                smsMessages={smsMessages}
                showToast={showToast}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
