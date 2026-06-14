/**
 * AI HEALTHCARE & HOSPITAL AUTOMATION SYSTEM - CLIENT CONTROLLER ENGINE
 */

document.addEventListener('DOMContentLoaded', () => {
    initGlobalFeatures();
    initAnimatedCounters();
    initDynamicMetrics();
    initFormInteractions();
    initSearchAndFilters();
});

/* --- Engine State & Mock Storage --- */
const AppState = {
    user: { name: "Alex Mercer", role: "Patient" },
    appointments: [
        { id: "A101", doctor: "Dr. Evelyn Reed", specialty: "Cardiology", date: "2026-06-18", time: "10:30 AM", status: "Confirmed" },
        { id: "A102", doctor: "Dr. Marcus Vance", specialty: "Neurology", date: "2026-06-22", time: "02:15 PM", status: "Pending" }
    ],
    reminders: [
        { id: 1, name: "Lisinopril", dosage: "10mg", time: "08:00 AM", freq: "Once Daily", status: "Taken" },
        { id: 2, name: "Metformin", dosage: "500mg", time: "13:00 PM", freq: "Twice Daily", status: "Pending" }
    ]
};

/* --- Global Functional Framework Initialization --- */
function initGlobalFeatures() {
    // Dismiss System Loader Layer
    const loader = document.getElementById('loading-screen');
    if (loader) {
        setTimeout(() => {
            loader.style.opacity = '0';
            setTimeout(() => loader.remove(), 400);
        }, 600);
    }

    // Interactive Sidebar View Toggles
    const toggleBtn = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => sidebar.classList.toggle('mobile-open'));
    }

    // Dynamic Notifications Dropdown Mock Trigger
    const alertBell = document.querySelector('.nav-actions .fa-bell');
    if (alertBell) {
        alertBell.addEventListener('click', () => {
            showToast("System Alert: Your monthly health metrics summary report is ready.");
        });
    }
}

/* --- Custom Modular Toast Notifications --- */
function showToast(message, variant = 'primary') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast toast-${variant}`;
    toast.style.borderLeftColor = `var(--${variant})`;
    toast.innerText = message;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

/* --- Numeric Dashboard Counter Automation --- */
function initAnimatedCounters() {
    const counters = document.querySelectorAll('.counter-target');
    counters.forEach(counter => {
        const goal = parseInt(counter.getAttribute('data-target'), 10) || 0;
        let running = 0;
        const incrementalSpeed = Math.max(Math.floor(goal / 40), 1);
        
        const countEngine = setInterval(() => {
            running += incrementalSpeed;
            if (running >= goal) {
                counter.innerText = goal.toLocaleString();
                clearInterval(countEngine);
            } else {
                counter.innerText = running.toLocaleString();
            }
        }, 20);
    });
}

/* --- Real-Time Health Diagnostic Streaming Simulation --- */
function initDynamicMetrics() {
    const heartValue = document.getElementById('dynamic-heartrate');
    const oxygenValue = document.getElementById('dynamic-spo2');
    
    if (heartValue) {
        setInterval(() => {
            const variance = Math.floor(Math.random() * 5) - 2; 
            const baseValue = parseInt(heartValue.innerText, 10) || 72;
            let finalValue = baseValue + variance;
            if (finalValue < 60) finalValue = 65;
            if (finalValue > 110) finalValue = 95;
            heartValue.innerText = finalValue;
        }, 4000);
    }

    if (oxygenValue) {
        setInterval(() => {
            const fluctuation = Math.floor(Math.random() * 3) - 1;
            if (fluctuation > 0) oxygenValue.innerText = "99";
            else if (fluctuation < 0) oxygenValue.innerText = "97";
            else oxygenValue.innerText = "98";
        }, 7000);
    }
}

/* --- Multi-Context Form Submission & Validation Suite --- */
function initFormInteractions() {
    // Unified Handler for Standard Diagnostic and Action Modals
    const closeModals = document.querySelectorAll('[data-dismiss="modal"]');
    closeModals.forEach(btn => {
        btn.addEventListener('click', () => {
            const openModal = document.querySelector('.modal-overlay.active');
            if (openModal) openModal.classList.remove('active');
        });
    });

    // Custom Interceptor for Login Form Layout
    const authForm = document.getElementById('loginSystemForm');
    if (authForm) {
        authForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const passField = document.getElementById('uPass').value;
            if (passField.length < 6) {
                showToast("Security Exception: Password parameter requires at least 6 characters.", "danger");
                return;
            }
            showToast("Authorization validation passed. Initializing session...", "success");
            setTimeout(() => window.location.href = 'dashboard.html', 1000);
        });
    }

    // Custom Interceptor for Appointment Scheduler Form Layout
    const schedForm = document.getElementById('appointmentBookingForm');
    if (schedForm) {
        schedForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const confirmationOverlay = document.getElementById('bookingConfirmationModal');
            if (confirmationOverlay) confirmationOverlay.classList.add('active');
        });
    }
}

/* --- Client-Side Component Searching & Analytical Content Filtering --- */
function initSearchAndFilters() {
    const lookupElement = document.getElementById('globalSystemSearch');
    if (lookupElement) {
        lookupElement.addEventListener('input', (e) => {
            const criteria = e.target.value.toLowerCase();
            const rows = document.querySelectorAll('.custom-table tbody tr');
            const units = document.querySelectorAll('.searchable-card');
            
            rows.forEach(row => {
                const innerTxt = row.innerText.toLowerCase();
                row.style.display = innerTxt.includes(criteria) ? '' : 'none';
            });

            units.forEach(card => {
                const innerTxt = card.innerText.toLowerCase();
                card.style.display = innerTxt.includes(criteria) ? '' : 'none';
            });
        });
    }
}

/* --- Contextual Medicine Tracker Sub-Routines --- */
function executeAddMedicineRow() {
    const medTitle = document.getElementById('medNameInput')?.value;
    const medDose = document.getElementById('medDoseInput')?.value;
    const medTime = document.getElementById('medTimeInput')?.value;

    if (!medTitle || !medDose || !medTime) {
        showToast("Validation Error: All tracking attributes are mandatory.", "warning");
        return;
    }

    const targetList = document.getElementById('activeMedicineScheduleGrid');
    if (targetList) {
        const element = document.createElement('div');
        element.className = 'card searchable-card';
        element.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div>
                    <h3 style="color:var(--accent); font-size:1.1rem; margin-bottom:0.25rem;">${medTitle}</h3>
                    <p style="font-size:0.9rem; margin-bottom:0.2rem;">Dosage: <strong>${medDose}</strong></p>
                    <p style="font-size:0.85rem; color:var(--text-secondary);"><i class="far fa-clock"></i> Scheduled: ${medTime}</p>
                </div>
                <button class="btn btn-secondary" onclick="this.closest('.card').remove(); showToast('Tracking target deleted.', 'warning');" style="padding:0.4rem; color:var(--danger);">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        targetList.appendChild(element);
        showToast(`Asset tracking initialized for: ${medTitle}`, "success");
        document.getElementById('medNameInput').value = '';
    }
}

/* --- Crisis Mode Core Routing Dispatcher --- */
function executeEmergencySOSSignal() {
    showToast("CRITICAL SIGNAL BROADCASTING: GPS coordinates and real-time medical vectors routed to first response units.", "danger");
    const operationalTracker = document.getElementById('emergencyDispatchStatusFlow');
    if (operationalTracker) {
        operationalTracker.innerHTML = `
            <div style="border-left: 3px solid var(--danger); padding-left: 1rem; margin-top: 1rem;">
                <p style="color:var(--danger); font-weight:600;"><i class="fas fa-spinner fa-spin"></i> Emergency Units Dispatched</p>
                <p style="font-size:0.85rem; color:var(--text-secondary);">Ambulance Unit #4B is moving toward your location. ETA: 7 minutes.</p>
            </div>
        `;
    }
}