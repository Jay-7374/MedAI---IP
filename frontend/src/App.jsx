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
  ArrowLeft,
  Mic
} from 'lucide-react';


const DEFAULT_PROMPTS = {
  NaturalSpeechAuth: "You are the MedAI Natural Speech Authentication System. Your job is to verify the patient's identity. Empathetically prompt the patient for their Full Name and Date of Birth (DOB) via speech. If the patient provides their name (e.g., 'Alex Mercer') and DOB (e.g., 'July 24, 1995'), confirm that they are verified. If verification is successful, say: 'Thank you, Alex. Your identity is verified.' If the name or DOB doesn't match, ask them to repeat it. If it fails twice consecutively, state: 'I am sorry, I am having trouble verifying your details. Let me transfer you directly to our front desk receptionist.' and route them to human receptionist.",
  ConversationalScheduling: "You are the MedAI Conversational Scheduling & Diagnostic Enquiries Assistant. You help patients book, reschedule, or cancel doctor appointments and specific diagnostic tests (like X-rays or ultrasounds) naturally using voice. Keep responses short and conversational. When booking is complete, state the confirmed appointment details clearly so the system can generate a confirmation.",
  PostDischargeCheckIn: "You are the MedAI Post-Discharge Monitoring Assistant. Empathetically guide the patient through an automated 5-question recovery scorecard. Ask the questions one by one and wait for their answer: 1) What is your pain level on a scale of 1-10? 2) Is there any redness, swelling, or drainage near your surgical wound? 3) Are you able to tolerate food and fluids? 4) Have you taken all your prescribed medications today? 5) Do you have a fever above 101 degrees? Once all 5 questions are logged, summarize the scorecard and state that their recovery status has been recorded.",
  MedicationAdherence: "You are the MedAI Medication Adherence Assistant. Remind chronic care or elderly patients of their medication dosages. Read aloud: 'Lisinopril 10mg once daily in the morning' and 'Metformin 500mg twice daily with meals'. Capture their verbal 'Yes/No' or custom affirmations of adherence. If they confirm compliance, state: 'Thank you, medication compliance has been logged.'",
  InsurancePolicyIntake: "You are the MedAI Insurance & Financial Orchestrator. Prompt the patient to state or spell out their insurance provider name and policy group number. Once they state it, verbally deliver a plain-language financial estimate of covered costs and out-of-pocket liabilities (e.g., BlueCross Policy Group 98124 has a co-pay of $45 and is covered at 90%, leaving your estimated out-of-pocket liability at $45).",
  EmergencySeverity: "You are the MedAI Emergency Severity Classification Assistant. Assess acute medical crises using deterministic Emergency Severity Index (ESI) protocols. If the symptoms indicate a life-threatening crisis (like chest pain, severe difficulty breathing, or sudden numbness), instantly state: 'CRITICAL ALERT: Bypassing administrative hold lines. Routing to emergency floor floor in 2 seconds.' and output [EMERGENCY_ROUTING: Emergency floor connected]. Otherwise, suggest appropriate non-critical guidelines.",
  AiNurseAdvice: "You are the MedAI AI Nurse Assistant. Answer open-ended, non-diagnostic questions regarding diet restrictions, recovery milestones, or wound care. Anchor all advice strictly in approved guidelines: clear liquids for the first 24 hours, keep dressings clean and dry, avoid lifting items over 10 lbs, and contact the clinic if fever exceeds 101°F. Do not diagnose or prescribe treatment.",
  ElderCareTerminal: "You are the MedAI Elder Care Companion. Engage in a friendly companion check-in call with isolated elderly patients. Warmly ask about their comfort, mood, sleep, and appetite, while assessing conversational tone, sentiment, and environmental cues for cognitive or physical decline.",
  TelemedicineBridge: "You are the MedAI Telemedicine Assistant. Verify if the patient is ready for their virtual doctor consultation. Once they confirm, state: 'Perfect, initializing secure audio/video WebRTC telemedicine bridge to connect you with the doctor now.' and output [TELEMEDICINE_BRIDGE: Ready] to launch the WebRTC video link."
};

export default function App() {
  const [view, setView] = useState('landing'); // 'landing' or 'app'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState({ name: 'Alex Mercer', role: 'Patient' });
  // Only Doctor/Receptionist/Admin roles can access admin features
  const isAdmin = user.role === 'Doctor' || user.role === 'Receptionist' || user.role === 'Admin';
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
      const res = await fetch('/api/prompts', {
        headers: { 'X-User-Role': user.role }
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
      const res = await fetch('/api/sms');
      if (res.ok) {
        const data = await res.json();
        setSmsMessages(data);
      }
    } catch (err) {
      console.warn("SMS log fetch failed, using local mock", err);
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchMedicines();
    fetchPrompts();
    fetchSmsMessages();
  }, []);

  useEffect(() => {
    if (prompts.length > 0) {
      const active = prompts.find(p => p.bot_name === selectedBot);
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
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/ws/voice`;
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
      const welcomeText = `Hello. I am your MedAI ${selectedBot === 'NaturalSpeechAuth' ? 'Natural Speech Authentication' : selectedBot} Bot. How can I help you today?`;
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
        const res = await fetch('/api/auth/login', {
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
          setUser({ name: data.user.name, role: data.user.role });
          showToast(`Welcome back, ${data.user.name}!`, 'success');
          setView('app');
          setActiveTab('dashboard');
          // Reset form
          setAuthForm({ username: '', password: '', email: '', role: 'Patient' });
        } else {
          setAuthError(data.detail || "Authentication failed. Please verify credentials.");
        }
      } catch (err) {
        // Fallback local mode
        if (authForm.username.toLowerCase() === 'alex mercer' && authForm.password === '123456') {
          setUser({ name: 'Alex Mercer', role: 'Patient' });
          showToast("Welcome back, Alex Mercer (Offline mode)!", 'success');
          setView('app');
          setActiveTab('dashboard');
          setAuthForm({ username: '', password: '', email: '', role: 'Patient' });
        } else {
          setAuthError("Authentication server error. Try 'Alex Mercer' / '123456' for offline access.");
        }
      }
    } else {
      // signup mode
      if (!authForm.email) {
        setAuthError("Email is required for Sign Up.");
        return;
      }
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: authForm.username,
            email: authForm.email,
            password: authForm.password,
            role: authForm.role
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
        // Fallback local sign up
        setUser({ name: authForm.username, role: authForm.role });
        showToast(`Welcome, ${authForm.username} (Offline signup)!`, 'success');
        setView('app');
        setActiveTab('dashboard');
        setAuthForm({ username: '', password: '', email: '', role: 'Patient' });
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
      showToast("Access denied. Clinical staff only.", "danger");
      return;
    }
    try {
      const res = await fetch('/api/prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': user.role
        },
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
      <div className="landing-container view-transition-root" key="view-landing">
        {/* Background Grid & Scanline */}
        <div className="bg-grid-overlay"></div>
        <div className="bg-grid-scanline"></div>

        {/* Ambient Floating ECG Lines */}
        <div className="landing-bg-waves top-waves">
          <svg className="bg-wave-svg" viewBox="0 0 2880 200" preserveAspectRatio="none">
            <path 
              className="bg-wave-path bg-wave-path-1" 
              d="M 0 100 L 200 100 C 205 90, 215 90, 220 100 L 240 100 L 250 115 L 265 15 L 280 170 L 290 100 C 300 85, 310 85, 320 100 L 920 100 C 925 90, 935 90, 940 100 L 960 100 L 970 115 L 985 15 L 1000 170 L 1010 100 C 1020 85, 1030 85, 1040 100 L 1640 100 C 1645 90, 1655 90, 1660 100 L 1680 100 L 1690 115 L 1705 15 L 1720 170 L 1730 100 C 1740 85, 1750 85, 1760 100 L 2360 100 C 2365 90, 2375 90, 2380 100 L 2400 100 L 2410 115 L 2425 15 L 2440 170 L 2450 100 C 2460 85, 2470 85, 2480 100 L 2880 100" 
            />
          </svg>
          <div className="bg-wave-pulse bg-wave-pulse-primary"></div>
        </div>

        <div className="landing-bg-waves bottom-waves">
          <svg className="bg-wave-svg" viewBox="0 0 2880 200" preserveAspectRatio="none">
            <path 
              className="bg-wave-path bg-wave-path-2" 
              d="M 0 100 L 200 100 C 205 90, 215 90, 220 100 L 240 100 L 250 115 L 265 15 L 280 170 L 290 100 C 300 85, 310 85, 320 100 L 920 100 C 925 90, 935 90, 940 100 L 960 100 L 970 115 L 985 15 L 1000 170 L 1010 100 C 1020 85, 1030 85, 1040 100 L 1640 100 C 1645 90, 1655 90, 1660 100 L 1680 100 L 1690 115 L 1705 15 L 1720 170 L 1730 100 C 1740 85, 1750 85, 1760 100 L 2360 100 C 2365 90, 2375 90, 2380 100 L 2400 100 L 2410 115 L 2425 15 L 2440 170 L 2450 100 C 2460 85, 2470 85, 2480 100 L 2880 100" 
            />
          </svg>
          <div className="bg-wave-pulse bg-wave-pulse-secondary"></div>
        </div>

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
          </div>

          <div className="landing-hero-actions-container">
            <button className="btn btn-primary btn-cta btn-cta-single" onClick={() => navigateTo('login')}>
              Launch Console <Send size={16} />
            </button>

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
          </div>

          <div className="landing-hero-scroll-indicator" onClick={() => {
            const el = document.querySelector('.landing-features-circle-container');
            if (el) {
              el.scrollIntoView({ behavior: 'smooth' });
            }
          }}>
            <span className="scroll-text">Explore Features</span>
            <div className="scroll-mouse">
              <div className="scroll-wheel"></div>
            </div>
          </div>
        </section>

        {/* Circling Features Section */}
        <section className="landing-features-circle-container">
          <div className="landing-features-circle-bg-wrapper">
            <div className="landing-features-circle-bg"></div>
          </div>
          
          <div className="landing-features-circle-center">
            <h2 className="landing-features-circle-title">Features</h2>
            <div className="landing-features-circle-glow"></div>
          </div>

          <div className="landing-feature-circle-card-wrapper feat-top">
            <div className="feat-line"></div>
            <div className="landing-feature-circle-card">
              <div className="landing-feature-icon primary">
                <PhoneCall size={22} />
              </div>
              <h3 className="landing-feature-title">Real-Time Voice AI</h3>
              <p className="landing-feature-desc">
                Interact with custom voice assistants specialized in medicine, scheduling, and follow-ups.
              </p>
            </div>
          </div>

          <div className="landing-feature-circle-card-wrapper feat-right">
            <div className="feat-line"></div>
            <div className="landing-feature-circle-card">
              <div className="landing-feature-icon success">
                <Activity size={22} />
              </div>
              <h3 className="landing-feature-title">Biometric Stream</h3>
              <p className="landing-feature-desc">
                Continuously track patient pulse, oxygen levels, and core temps with live ECG waves.
              </p>
            </div>
          </div>

          <div className="landing-feature-circle-card-wrapper feat-bottom">
            <div className="feat-line"></div>
            <div className="landing-feature-circle-card">
              <div className="landing-feature-icon secondary">
                <Settings size={22} />
              </div>
              <h3 className="landing-feature-title">Prompt Orchestrator</h3>
              <p className="landing-feature-desc">
                Manage LLM contexts dynamically. Swap instructions or Nurse behaviors in real-time.
              </p>
            </div>
          </div>

          <div className="landing-feature-circle-card-wrapper feat-left">
            <div className="feat-line"></div>
            <div className="landing-feature-circle-card">
              <div className="landing-feature-icon warning">
                <AlertTriangle size={22} />
              </div>
              <h3 className="landing-feature-title">Crisis Triage SOS</h3>
              <p className="landing-feature-desc">
                Instantly bypass regular queue operations and dispatch active ambulances with ETAs.
              </p>
            </div>
          </div>
        </section>

        {/* Minimal Footer */}
        <footer className="landing-footer">
          <p>© {new Date().getFullYear()} MedAI Flow Automation. Designed with high-fidelity healthcare diagnostics.</p>
        </footer>
      </div>
    );
  }

  if (view === 'login') {
    return (
      <div className="login-container view-transition-root" key="view-login">
        {/* Background Grid & Scanline */}
        <div className="bg-grid-overlay"></div>
        <div className="bg-grid-scanline"></div>

        {/* Background Glow Layer */}
        <div className="bg-glow-layer">
          <div className="glow-blob glow-blob-1"></div>
          <div className="glow-blob glow-blob-2"></div>
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
              <Heart size={32} className="login-logo-icon" />
              <h2>{authMode === 'login' ? 'Access MedAI Console' : 'Register MedAI Account'}</h2>
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

  if (view === 'telemedicine') {
    return (
      <div className="app-container view-transition-root" style={{ padding: '2.5rem' }} key="view-telemedicine">
        <div className="bg-glow-layer">
          <div className="glow-blob glow-blob-1"></div>
          <div className="glow-blob glow-blob-2"></div>
        </div>

        <div className="telemedicine-bridge-container card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--divider)', paddingBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Activity size={24} style={{ color: 'var(--primary-hover)', animation: 'bounce 1s infinite' }} />
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Secure Telemedicine Video Consult</h2>
            </div>
            <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="pulse-dot"></span>
              Secure WebRTC Connection
            </span>
          </div>

          <div className="webrtc-call-layout" style={{ marginTop: '1rem' }}>
            {/* Local Video Stream */}
            <div className="video-window">
              <video id="localVideo" autoPlay playsInline muted style={{ transform: 'scaleX(-1)' }} />
              <div className="webrtc-overlay-label">
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary-hover)', display: 'inline-block' }}></span>
                Patient Feed (You)
              </div>
            </div>

            {/* Simulated Doctor Video Stream */}
            <div className="video-window" style={{ background: '#0b221a' }}>
              <div className="video-placeholder">
                <div className="avatar" style={{ width: '80px', height: '80px', fontSize: '2rem', background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)' }}>ER</div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>Dr. Evelyn Reed</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Cardiologist • Clinic Floor 3</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', background: 'rgba(0,0,0,0.3)', padding: '0.35rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <span className="pulse-dot"></span>
                  <span style={{ fontSize: '0.78rem', color: '#fff', fontWeight: 600 }}>Doctor Audio/Video Feed Active</span>
                </div>
              </div>
              <div className="webrtc-overlay-label">
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--danger)', display: 'inline-block' }}></span>
                Clinician Feed (Remote)
              </div>
            </div>
          </div>

          <div className="webrtc-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-secondary" onClick={() => showToast("Microphone muted", "warning")}>
                Mute Audio
              </button>
              <button className="btn btn-secondary" onClick={() => showToast("Camera stream stopped", "warning")}>
                Stop Camera
              </button>
            </div>
            <button className="btn btn-danger" onClick={() => {
              setView('app');
              setActiveTab('dashboard');
              setTelemedicineActive(false);
              telemedicineActiveRef.current = false;
              showToast("Telemedicine bridge closed gracefully.", "success");
            }}>
              Disconnect Call
            </button>
          </div>
        </div>
      </div>
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
        <div className="top-nav-header">
          <div className="brand" onClick={() => navigateTo('landing', 'dashboard')} style={{ cursor: 'pointer' }}>
            <Heart size={24} style={{ filter: 'drop-shadow(0 0 8px var(--primary))', marginRight: '8px' }} />
            <span>MedAI Flow</span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div className="profile-card">
              <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="pulse-dot"></span>
                System Status: Online
              </span>
            </div>
            
            <div className="user-profile-widget-top">
              <div className="avatar">{user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}</div>
              <div className="user-info-text">
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>{user.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{user.role}</div>
              </div>
              <button className="profile-action-btn" title="System Settings">
                <Settings size={16} />
              </button>
              <button className="profile-action-btn" title="Sign Out" onClick={() => {
                setView('landing');
                showToast("Logged out successfully.", "warning");
              }} style={{ color: 'var(--danger)', marginLeft: '4px' }}>
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="top-nav-menu-bar">
          <div className="nav-section-group">
            <span className="nav-section-title">Workspace</span>
            <div className="nav-buttons-container">
              <div className={`menu-item ${activeTab === 'dashboard' ? 'active' : ''}`}>
                <button onClick={() => navigateTo('app', 'dashboard')}><ActivitySquare size={16} /> Dashboard</button>
              </div>
            </div>
          </div>

          <div className="nav-section-group">
            <span className="nav-section-title">Management</span>
            <div className="nav-buttons-container">
              <div className={`menu-item ${activeTab === 'appointments' ? 'active' : ''}`}>
                <button onClick={() => navigateTo('app', 'appointments')}><Calendar size={16} /> Scheduling & Diagnostics</button>
              </div>
              <div className={`menu-item ${activeTab === 'medicines' ? 'active' : ''}`}>
                <button onClick={() => navigateTo('app', 'medicines')}><Pill size={16} /> Adherence Tracker</button>
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
                  title="Activate Voice AI Portal"
                >
                  <Mic size={18} />
                </button>
              </div>
            </div>
          </div>

          {isAdmin && (
          <div className="nav-section-group">
            <span className="nav-section-title">System</span>
            <div className="nav-buttons-container">
              <div className={`menu-item ${activeTab === 'prompts' ? 'active' : ''}`}>
                <button onClick={() => navigateTo('app', 'prompts')}><Settings size={16} /> Prompt Orchestrator</button>
              </div>
            </div>
          </div>
          )}

          <div className="nav-section-group">
            <span className="nav-section-title">Critical</span>
            <div className="nav-buttons-container">
              <div className={`menu-item danger-item ${activeTab === 'emergency' ? 'active' : ''}`}>
                <button onClick={() => navigateTo('app', 'emergency')}><AlertTriangle size={16} /> EMERGENCY SOS</button>
              </div>
            </div>
          </div>
        </div>
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
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <>
              {/* Top Row Grid: Streamlined Communications Status Overview */}
              <section className="metrics-grid">
                {/* Medication Adherence Overview */}
                <div className="card metric-card pulse">
                  <div className="metric-icon metric-icon-pulse">
                    <Pill size={24} />
                  </div>
                  <div className="metric-details">
                    <h4>Medication Adherence</h4>
                    <div className="metric-value">
                      {medicines.filter(m => m.status === 'Taken').length} / {medicines.length || 2} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Logged</span>
                    </div>
                  </div>
                </div>

                {/* Elder Care Companion Sentiment */}
                <div className="card metric-card oxygen">
                  <div className="metric-icon metric-icon-oxygen">
                    <Heart size={24} />
                  </div>
                  <div className="metric-details">
                    <h4>Elder Welfare Sentiment</h4>
                    <div className="metric-value">
                      Positive <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Warm</span>
                    </div>
                  </div>
                </div>

                {/* SIP Routing & Timeout Bypass */}
                <div className="card metric-card bp">
                  <div className="metric-icon metric-icon-bp">
                    <PhoneCall size={24} />
                  </div>
                  <div className="metric-details">
                    <h4>SIP Routing</h4>
                    <div className="metric-value" style={{ fontSize: '1.1rem', fontWeight: 700, color: simulateDbTimeout || consecutiveErrors >= 2 ? 'var(--danger)' : 'var(--success)' }}>
                      {simulateDbTimeout ? 'DB TIMEOUT' : consecutiveErrors >= 2 ? 'ASR ERROR' : 'TRUNK IDLE'}
                    </div>
                  </div>
                </div>

                {/* Emergency Triage SOS Status */}
                <div className="card metric-card temp">
                  <div className="metric-icon metric-icon-temp">
                    <AlertTriangle size={24} />
                  </div>
                  <div className="metric-details">
                    <h4>Triage SOS Status</h4>
                    <div className="metric-value" style={{ fontSize: '1.1rem', fontWeight: 700, color: sosStatus ? 'var(--danger)' : 'var(--text-secondary)' }}>
                      {sosStatus ? 'DISPATCHED' : 'NO ACTIVE SOS'}
                    </div>
                  </div>
                </div>
              </section>

              {/* Main Dashboard Layout */}
              <div className="dashboard-grid-layout">
                {/* Card 1: Patient Identity & Insurance Pre-Auth (Spans 2 columns) */}
                <div className="card grid-col-span-2">
                  <h3 style={{ marginBottom: '1.25rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Check size={18} style={{ color: 'var(--success)' }} /> Patient Identity Verification & Insurance Pre-Auth
                  </h3>
                  <div className="dashboard-row-grid">
                    <div className="subpanel subpanel-cyan">
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Patient Name</span>
                        <strong style={{ color: 'var(--text-main)' }}>Alex Mercer</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>DOB Authentication</span>
                        <strong style={{ color: 'var(--success)' }}>July 24, 1995 (VERIFIED)</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>EHR Record Link</span>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-main)' }}>#EHR-9831A (Active)</span>
                      </div>
                    </div>

                    <div className="subpanel subpanel-amber">
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Insurance Provider</span>
                        <strong style={{ color: 'var(--text-main)' }}>BlueCross Shield</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Policy Group ID</span>
                        <strong style={{ color: 'var(--text-main)' }}>98124</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--divider)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Est. Out-of-pocket</span>
                        <strong style={{ color: 'var(--warning)', fontSize: '1.05rem' }}>$45.00</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 2: Outbound SMS Activity Logs Feed (Spans 3 rows on the right) */}
                <div className="card sms-panel-container grid-row-span-3">
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                    <MessageSquare size={18} style={{ color: 'var(--secondary)' }} /> Outbound Transactional SMS Logs
                  </h3>
                  <div className="sms-feed-list" style={{ flex: 1, overflowY: 'auto' }}>
                    {smsMessages.map((sms) => (
                      <div key={sms.id} className="sms-message-card">
                        <div className="sms-meta-row">
                          <span style={{ fontWeight: 700 }}>To: {sms.recipient}</span>
                          <span>{new Date(sms.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <div className="sms-phone-bubble">
                          {sms.text}
                        </div>
                      </div>
                    ))}
                    {smsMessages.length === 0 && (
                      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        No transactional SMS alerts logged.
                      </div>
                    )}
                  </div>
                </div>

                {/* Card 3: Post-Discharge scorecard */}
                <div className="card">
                  <h3 style={{ marginBottom: '1.25rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={18} style={{ color: 'var(--secondary)' }} /> Post-Discharge Scorecard
                  </h3>
                  <div className="subpanel subpanel-green subpanel-fill">
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', borderBottom: '1px solid var(--divider)', paddingBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>48h Post-Op Survey</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Today</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.35rem', fontSize: '0.8rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Pain Level:</span> <strong style={{ color: 'var(--text-main)' }}>3 / 10</strong></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Wound status:</span> <strong style={{ color: 'var(--success)' }}>Normal</strong></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Food intake:</span> <strong style={{ color: 'var(--success)' }}>Tolerated</strong></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Fever status:</span> <strong style={{ color: 'var(--success)' }}>None (98.6°F)</strong></div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--divider)', paddingTop: '0.5rem', marginTop: '0.75rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Assessment:</span>
                      <span className="badge badge-success" style={{ fontSize: '0.7rem', padding: '0.2rem 0.4rem' }}>STABLE (5/5 Index)</span>
                    </div>
                  </div>
                </div>

                {/* Card 4: Medication Adherence Tracker */}
                <div className="card">
                  <h3 style={{ marginBottom: '1.25rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Pill size={18} style={{ color: 'var(--primary)' }} /> Regimen Adherence
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
                    {medicines.map((med, idx) => (
                      <div key={idx} style={{ background: 'rgba(255,255,255,0.01)', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '0.5rem' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-main)' }}>{med.name}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{med.dosage}</div>
                        </div>
                        <span className={`badge ${med.status === 'Taken' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.7rem', padding: '0.2rem 0.4rem' }}>
                          {med.status === 'Taken' ? 'Taken' : 'Alert Sent'}
                        </span>
                      </div>
                    ))}
                    {medicines.length === 0 && (
                      <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        No active medications.
                      </div>
                    )}
                  </div>
                </div>

                {/* Card 5: Elder Care Welfare checks */}
                <div className="card">
                  <h3 style={{ marginBottom: '1.25rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Heart size={18} style={{ color: 'var(--danger)' }} /> Elder Companion Checks
                  </h3>
                  <div className="subpanel subpanel-rose subpanel-fill">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.4rem', fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Relative Monitoring:</span> <strong style={{ color: 'var(--text-main)' }}>Welfare Active</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Acoustic Sentiment:</span> <strong style={{ color: 'var(--success)' }}>Stable / Cozy</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Cognitive Decline:</span> <strong style={{ color: 'var(--success)' }}>Negative (0 Alerts)</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Background Cue:</span> <strong style={{ color: 'var(--text-secondary)' }}>Normal environment</strong></div>
                    </div>
                    <div style={{ borderTop: '1px solid var(--divider)', paddingTop: '0.5rem', marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Daily Welfare Call status: <span style={{ color: 'var(--success)', fontWeight: 700 }}>Pass</span>
                    </div>
                  </div>
                </div>

                {/* Card 6: Conversational Diagnostics & EHR slots */}
                <div className="card">
                  <h3 style={{ marginBottom: '1.25rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={18} style={{ color: 'var(--primary-hover)' }} /> Diagnostics Registry
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
                    {appointments.map((appt, idx) => (
                      <div key={idx} style={{ background: 'rgba(255,255,255,0.01)', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-main)' }}>{appt.doctor}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{appt.date} at {appt.time}</div>
                        </div>
                        <span className={`badge ${appt.status === 'Confirmed' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.7rem', padding: '0.2rem 0.4rem' }}>
                          {appt.status}
                        </span>
                      </div>
                    ))}
                    {appointments.length === 0 && (
                      <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        No scheduled diagnostics slots.
                      </div>
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
                  <h3 style={{ marginBottom: '0.5rem', fontSize: '1.2rem', fontWeight: 700 }}>Voice AI Command Portal</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Select required voice feature persona and click portal to connect.</p>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Voice Agent Core Persona</label>
                  <select 
                    className="form-control" 
                    value={selectedBot}
                    onChange={(e) => setSelectedBot(e.target.value)}
                    disabled={callStatus !== 'Idle'}
                  >
                    {isAdmin ? (
                      <>
                        <option value="NaturalSpeechAuth">Natural Speech Authentication</option>
                        <option value="ConversationalScheduling">Conversational Scheduling & Diagnostics</option>
                        <option value="PostDischargeCheckIn">Post-Discharge Wellness Check-in</option>
                        <option value="MedicationAdherence">Active Medication Adherence Alert</option>
                        <option value="InsurancePolicyIntake">Insurance Policy Intake & Breakdown</option>
                        <option value="EmergencySeverity">Emergency Severity Classification</option>
                        <option value="AiNurseAdvice">Interactive AI Nurse Advice</option>
                        <option value="ElderCareTerminal">Elder Care Welfare Terminal</option>
                        <option value="TelemedicineBridge">Telemedicine Video Bridge Hand-off</option>
                      </>
                    ) : (
                      <>
                        <option value="NaturalSpeechAuth">Verify My Identity</option>
                        <option value="ConversationalScheduling">Book or Change an Appointment</option>
                        <option value="PostDischargeCheckIn">Post-Discharge Recovery Check-in</option>
                        <option value="MedicationAdherence">Medication Reminder</option>
                        <option value="InsurancePolicyIntake">Insurance & Cost Estimate</option>
                        <option value="EmergencySeverity">Report an Emergency</option>
                        <option value="AiNurseAdvice">Ask a Nurse</option>
                        <option value="ElderCareTerminal">Wellness Check-in</option>
                        <option value="TelemedicineBridge">Join My Video Consultation</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Simulation Control Panel — Admin only */}
                {isAdmin && (
                <div className="simulation-toggles-container">
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Settings size={14} /> Handoff & Error Simulation Control
                  </h4>
                  
                  <label className="simulation-checkbox-label">
                    <input 
                      type="checkbox" 
                      checked={simulateDbTimeout} 
                      onChange={(e) => setSimulateDbTimeout(e.target.checked)} 
                    />
                    Simulate Backend Database Timeout
                  </label>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Consecutive voice errors: <strong>{consecutiveErrors} / 2</strong>
                    </span>
                    <button 
                      className="simulation-btn"
                      onClick={() => {
                        const nextVal = consecutiveErrors + 1;
                        setConsecutiveErrors(nextVal);
                        showToast(`Simulated Speech failure logged (${nextVal}/2)`, "warning");
                        
                        if (nextVal >= 2 && callStatus === 'Connected') {
                          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                            wsRef.current.send(JSON.stringify({
                              type: 'text',
                              session_id: sessionId,
                              text: '[FAILED_TO_UNDERSTAND]',
                              bot_name: selectedBot,
                              simulate_db_timeout: simulateDbTimeout,
                              consecutive_errors: nextVal
                            }));
                          }
                        }
                      }}
                    >
                      Trigger Voice Recognition Error
                    </button>
                  </div>
                </div>
                )}

                {/* SIP Warm-Transfer active display */}
                {sipTransferActive && (
                  <div className="sip-transfer-banner">
                    <div className="sip-details">
                      <span className="sip-pulse-indicator"></span>
                      <div>
                        <h4 style={{ fontSize: '0.9rem', color: 'var(--danger)', fontWeight: 800, textTransform: 'uppercase' }}>SIP Warm-Transfer Active</h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500, marginTop: '0.15rem' }}>
                          Routing session to Front Desk receptionist: <strong>Sarah Conner</strong>
                        </p>
                      </div>
                    </div>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', borderRadius: '8px' }}
                      onClick={() => {
                        setSipTransferActive(false);
                        sipTransferActiveRef.current = false;
                        setConsecutiveErrors(0);
                        showToast("SIP session reset.", "success");
                      }}
                    >
                      Reset Handoff
                    </button>
                  </div>
                )}
                
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

                <div className="voice-meta-container">
                  <div className="voice-meta-row">
                    <span style={{ color: 'var(--text-secondary)' }}>Session Channel</span>
                    <span style={{ fontWeight: 700 }}>WebSockets Link</span>
                  </div>
                  <div className="voice-meta-row">
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
                  {transcripts.length === 0 && !interimText && (
                    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>
                      Dialogue stream is currently empty. Connect above to start.
                    </div>
                  )}

                  {/* Live partial transcription — appears as user speaks, before final result */}
                  {interimText && (
                    <div className="transcript-message user" style={{ opacity: 0.6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.72rem', opacity: 0.8, marginBottom: '0.35rem', fontWeight: 700 }}>
                        <span className="badge" style={{ padding: '0.1rem 0.4rem', fontSize: '0.62rem', background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
                          You
                        </span>
                        <span style={{ fontFamily: 'monospace', fontStyle: 'italic' }}>listening…</span>
                      </div>
                      <div style={{ fontWeight: 500, fontStyle: 'italic' }}>{interimText}</div>
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </div>
                
                 {callStatus === 'Connected' && (
                  <div className="voice-status-banner">
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
                <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem', fontWeight: 700 }}>Book Appointment or Diagnostics</h3>
                <form onSubmit={handleBookAppointment}>
                  <div className="form-group">
                    <label className="form-label">Practitioner Specialty / Node</label>
                    <select 
                      className="form-control" 
                      value={apptForm.doctor}
                      onChange={(e) => setApptForm(prev => ({ ...prev, doctor: e.target.value }))}
                      required
                    >
                      <option value="">Select Option...</option>
                      <option value="Dr. Reed">Dr. Evelyn Reed (Cardiology Specialist)</option>
                      <option value="Dr. Vance">Dr. Marcus Vance (Neurology Specialist)</option>
                      <option value="Dr. Foster">Dr. Sarah Foster (Pediatrics Specialist)</option>
                      <option value="Radiology Chest X-Ray">Radiology Floor (Chest X-Ray Diagnostic)</option>
                      <option value="Diagnostic Ultrasound">Diagnostics Lab (Abdomen Ultrasound)</option>
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
                    <label className="form-label">Clinical Indication / Symptoms</label>
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
                    <Plus size={18} /> Schedule Appointment
                  </button>
                </form>
              </div>

              <div>
                <h3 style={{ marginBottom: '1.25rem', fontSize: '1.2rem', fontWeight: 700 }}>EHR Scheduling Registry</h3>
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
                            <Clock size={12} /> Date: {appt.date} at {appt.time}
                          </p>
                          {appt.symptoms && (
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                              Symptoms: <i>{appt.symptoms}</i>
                            </p>
                          )}
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
                <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem', fontWeight: 700 }}>Configure Medication Directives</h3>
                <form onSubmit={handleAddMedicine}>
                  <div className="form-group">
                    <label className="form-label">Medication Name</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g., Lisinopril"
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
                      placeholder="e.g., 10mg once daily"
                      value={medForm.dosage}
                      onChange={(e) => setMedForm(prev => ({ ...prev, dosage: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Adherence Alert Time</label>
                    <input 
                      type="time" 
                      className="form-control" 
                      value={medForm.time}
                      onChange={(e) => setMedForm(prev => ({ ...prev, time: e.target.value }))}
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                    <Plus size={18} /> Add Adherence Directive
                  </button>
                </form>
              </div>

              <div>
                <h3 style={{ marginBottom: '1.25rem', fontSize: '1.2rem', fontWeight: 700 }}>Medication Adherence Checklist</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.25rem' }}>
                  {medicines.map((med, idx) => (
                    <div key={idx} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h4 style={{ color: 'var(--primary)', fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>{med.name}</h4>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Dosage: <strong>{med.dosage}</strong></span>
                        </div>
                        <span className={`badge ${med.status === 'Taken' ? 'badge-success' : 'badge-warning'}`}>
                          {med.status}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} /> alert at: {med.time}
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

          {/* TAB 5: PROMPT MANAGER — ADMIN ONLY */}
          {activeTab === 'prompts' && (
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
                    {isAdmin ? (
                      <>
                        <option value="NaturalSpeechAuth">Natural Speech Authentication</option>
                        <option value="ConversationalScheduling">Conversational Scheduling & Diagnostics</option>
                        <option value="PostDischargeCheckIn">Post-Discharge Wellness Check-in</option>
                        <option value="MedicationAdherence">Active Medication Adherence Alert</option>
                        <option value="InsurancePolicyIntake">Insurance Policy Intake & Breakdown</option>
                        <option value="EmergencySeverity">Emergency Severity Classification</option>
                        <option value="AiNurseAdvice">Interactive AI Nurse Advice</option>
                        <option value="ElderCareTerminal">Elder Care Welfare Terminal</option>
                        <option value="TelemedicineBridge">Telemedicine Video Bridge Hand-off</option>
                      </>
                    ) : (
                      <>
                        <option value="NaturalSpeechAuth">Verify My Identity</option>
                        <option value="ConversationalScheduling">Book or Change an Appointment</option>
                        <option value="PostDischargeCheckIn">Post-Discharge Recovery Check-in</option>
                        <option value="MedicationAdherence">Medication Reminder</option>
                        <option value="InsurancePolicyIntake">Insurance & Cost Estimate</option>
                        <option value="EmergencySeverity">Report an Emergency</option>
                        <option value="AiNurseAdvice">Ask a Nurse</option>
                        <option value="ElderCareTerminal">Wellness Check-in</option>
                        <option value="TelemedicineBridge">Join My Video Consultation</option>
                      </>
                    )}
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
          )}

          {/* TAB 6: EMERGENCY */}
          {activeTab === 'emergency' && (
            <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
              <div className="card" style={{ border: '1px solid rgba(231, 111, 81, 0.3)', background: 'rgba(231, 111, 81, 0.02)', textAlign: 'center', padding: '4rem 2rem' }}>
                <h2 style={{ color: 'var(--danger)', fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '-0.5px' }}>
                  Emergency Severity Classification Console
                </h2>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto 2.5rem', fontSize: '0.95rem', fontWeight: 500, lineHeight: 1.5 }}>
                  Triggering the SOS alert bypasses standard triage, automatically logs a priority dispatch call in the database, and allocates responder vectors using the Emergency Severity Index (ESI).
                </p>

                <div className="sos-trigger" onClick={handleTriggerSOS}>
                  <AlertTriangle size={42} style={{ marginBottom: '6px' }} />
                  <span style={{ fontSize: '1.35rem', fontWeight: 800 }}>SOS</span>
                </div>

                {sosStatus && (
                  <div className="sos-dispatch-box">
                    <p style={{ color: 'var(--danger)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      <Activity size={18} style={{ animation: 'bounce 1s infinite' }} /> Emergency Dispatch Confirmed (ESI Category 1)
                    </p>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginTop: '0.5rem', fontWeight: 600 }}>
                      Unit allocated: <span style={{ color: 'var(--primary)' }}>{sosStatus.unit}</span>
                    </p>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      Estimated Arrival Time (ETA): <strong style={{ color: 'var(--text-main)' }}>{sosStatus.eta_minutes} minutes</strong>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          </div>
        </main>
      </div>
    </div>
  );
}
