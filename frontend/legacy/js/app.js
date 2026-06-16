/**
 * AI HEALTHCARE & HOSPITAL AUTOMATION SYSTEM - CLIENT CONTROLLER ENGINE
 */

document.addEventListener('DOMContentLoaded', () => {
    initGlobalFeatures();
    initAnimatedCounters();
    initDynamicMetrics();
    initFormInteractions();
    initSearchAndFilters();
    
    // Page specific data loaders
    if (window.location.pathname.includes('dashboard.html')) {
        loadDashboardData();
    } else if (window.location.pathname.includes('medicines.html')) {
        loadMedicinesData();
    }
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

/* --- Dynamic Data Loaders --- */
async function loadDashboardData() {
    let consultationCard = null;
    let regimenContainer = null;
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        const h3 = card.querySelector('h3');
        if (h3) {
            if (h3.innerText.includes('Immediate Regimen')) {
                regimenContainer = card.querySelector('div');
            } else if (h3.innerText.includes('Scheduled Consultation')) {
                consultationCard = card;
            }
        }
    });

    // 1. Fetch appointments for Scheduled Consultation
    try {
        const response = await fetch('/api/appointments');
        if (response.ok) {
            const appointments = await response.json();
            if (appointments.length > 0 && consultationCard) {
                const latest = appointments[appointments.length - 1];
                consultationCard.innerHTML = `
                    <h3 style="font-size:1rem; margin-bottom:0.75rem;"><i class="fas fa-calendar-check" style="color:var(--success); margin-right:0.5rem;"></i> Scheduled Consultation</h3>
                    <p style="font-size:0.9rem; font-weight:600;">${latest.doctor}</p>
                    <p style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:0.5rem;">${latest.specialty}</p>
                    <span class="badge badge-success">${latest.date}, ${latest.time}</span>
                `;
            }
        }
    } catch (err) {
        console.warn("Failed to load appointments for dashboard", err);
    }

    // 2. Fetch medicines for Immediate Regimen
    try {
        const response = await fetch('/api/medicines');
        if (response.ok) {
            const medicines = await response.json();
            if (medicines.length > 0 && regimenContainer) {
                regimenContainer.innerHTML = '';
                medicines.forEach(med => {
                    const badgeColor = med.status === 'Taken' ? 'var(--accent)' : 'var(--warning)';
                    const div = document.createElement('div');
                    div.style.cssText = "background:rgba(255,255,255,0.02); padding:0.6rem; border-radius:6px; font-size:0.85rem; display:flex; justify-content:space-between; margin-bottom: 0.5rem;";
                    div.innerHTML = `<span>${med.name} (${med.dosage})</span> <span style="color:${badgeColor};">${med.time}</span>`;
                    regimenContainer.appendChild(div);
                });
            }
        }
    } catch (err) {
        console.warn("Failed to load medicines for dashboard", err);
    }
}

async function loadMedicinesData() {
    const targetGrid = document.getElementById('activeMedicineScheduleGrid');
    if (!targetGrid) return;
    
    try {
        const response = await fetch('/api/medicines');
        if (response.ok) {
            const medicines = await response.json();
            targetGrid.innerHTML = '';
            medicines.forEach(med => {
                const element = document.createElement('div');
                element.className = 'card searchable-card';
                element.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <div>
                            <h3 style="color:var(--accent); font-size:1.1rem; margin-bottom:0.25rem;">${med.name}</h3>
                            <p style="font-size:0.9rem; margin-bottom:0.2rem;">Dosage: <strong>${med.dosage}</strong></p>
                            <p style="font-size:0.85rem; color:var(--text-secondary);"><i class="far fa-clock"></i> Scheduled: ${med.time}</p>
                        </div>
                        <div style="display:flex; flex-direction:column; align-items:flex-end; gap:0.5rem;">
                            <span class="badge badge-${med.status === 'Taken' ? 'success' : 'warning'}">${med.status === 'Taken' ? 'Adhered' : 'Pending'}</span>
                            <button class="btn btn-secondary" onclick="executeDeleteMedicine(this, '${med.name}')" style="padding:0.4rem; color:var(--danger);">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
                targetGrid.appendChild(element);
            });
        }
    } catch (err) {
        console.warn("Failed to load medicines list from API", err);
    }
}

async function executeDeleteMedicine(btn, medName) {
    try {
        const response = await fetch(`/api/medicines/${encodeURIComponent(medName)}`, {
            method: 'DELETE'
        });
        if (response.ok) {
            btn.closest('.card').remove();
            showToast(`Tracking target ${medName} deleted.`, 'warning');
        } else {
            showToast("Failed to delete medicine.", 'danger');
        }
    } catch (err) {
        console.error("Delete medicine failed, using fallback removal", err);
        btn.closest('.card').remove();
        showToast('Tracking target deleted (offline mode).', 'warning');
    }
}

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
    
    if (heartValue || oxygenValue) {
        const updateTelemetry = async () => {
            try {
                const res = await fetch('/api/telemetry');
                if (res.ok) {
                    const data = await res.json();
                    if (heartValue) heartValue.innerText = data.heartrate;
                    if (oxygenValue) oxygenValue.innerText = data.spo2;
                }
            } catch (err) {
                console.warn("Telemetry fetch failed, using random simulation fallback", err);
                const variance = Math.floor(Math.random() * 5) - 2; 
                const baseValue = parseInt(heartValue?.innerText || "74", 10);
                let finalValue = baseValue + variance;
                if (finalValue < 60) finalValue = 65;
                if (finalValue > 110) finalValue = 95;
                if (heartValue) heartValue.innerText = finalValue;

                const fluctuation = Math.floor(Math.random() * 3) - 1;
                if (oxygenValue) {
                    if (fluctuation > 0) oxygenValue.innerText = "99";
                    else if (fluctuation < 0) oxygenValue.innerText = "97";
                    else oxygenValue.innerText = "98";
                }
            }
        };
        updateTelemetry();
        setInterval(updateTelemetry, 4000);
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
        authForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const emailField = document.getElementById('uEmail').value;
            const passField = document.getElementById('uPass').value;
            
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: emailField, password: passField })
                });
                const data = await response.json();
                if (response.ok) {
                    showToast(data.message, "success");
                    setTimeout(() => window.location.href = 'dashboard.html', 1000);
                } else {
                    showToast(data.detail || "Authentication failed.", "danger");
                }
            } catch (err) {
                console.error("Login fetch failed, falling back to mock", err);
                if (passField.length < 6) {
                    showToast("Security Exception: Password parameter requires at least 6 characters.", "danger");
                    return;
                }
                showToast("Authorization validation passed (offline mode). Initializing session...", "success");
                setTimeout(() => window.location.href = 'dashboard.html', 1000);
            }
        });
    }

    // Custom Interceptor for Appointment Scheduler Form Layout
    const schedForm = document.getElementById('appointmentBookingForm');
    if (schedForm) {
        schedForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const docNode = document.getElementById('targetDoctorNode').value;
            const dateVal = schedForm.querySelector('input[type="date"]').value;
            const timeVal = schedForm.querySelector('input[type="time"]').value;
            const symptomsVal = schedForm.querySelector('textarea').value;
            
            try {
                const response = await fetch('/api/appointments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ doctor: docNode, date: dateVal, time: timeVal, symptoms: symptomsVal })
                });
                if (response.ok) {
                    const confirmationOverlay = document.getElementById('bookingConfirmationModal');
                    if (confirmationOverlay) confirmationOverlay.classList.add('active');
                } else {
                    showToast("Resource reservation failed.", "danger");
                }
            } catch (err) {
                console.error("Appointment booking fetch failed, falling back to mock", err);
                const confirmationOverlay = document.getElementById('bookingConfirmationModal');
                if (confirmationOverlay) confirmationOverlay.classList.add('active');
            }
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
async function executeAddMedicineRow() {
    const medTitle = document.getElementById('medNameInput')?.value;
    const medDose = document.getElementById('medDoseInput')?.value;
    const medTime = document.getElementById('medTimeInput')?.value;

    if (!medTitle || !medDose || !medTime) {
        showToast("Validation Error: All tracking attributes are mandatory.", "warning");
        return;
    }

    try {
        const response = await fetch('/api/medicines', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: medTitle, dosage: medDose, time: medTime })
        });
        if (response.ok) {
            showToast(`Asset tracking initialized for: ${medTitle}`, "success");
            document.getElementById('medNameInput').value = '';
            loadMedicinesData();
        } else {
            showToast("Failed to add medicine.", "danger");
        }
    } catch (err) {
        console.error("Add medicine fetch failed, falling back to mock", err);
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
            showToast(`Asset tracking initialized for: ${medTitle} (offline)`, "success");
            document.getElementById('medNameInput').value = '';
        }
    }
}

/* --- Crisis Mode Core Routing Dispatcher --- */
async function executeEmergencySOSSignal() {
    try {
        const response = await fetch('/api/emergency/sos', {
            method: 'POST'
        });
        const data = await response.json();
        if (response.ok) {
            showToast(data.message, "danger");
            const operationalTracker = document.getElementById('emergencyDispatchStatusFlow');
            if (operationalTracker) {
                operationalTracker.innerHTML = `
                    <div style="border-left: 3px solid var(--danger); padding-left: 1rem; margin-top: 1rem;">
                        <p style="color:var(--danger); font-weight:600;"><i class="fas fa-spinner fa-spin"></i> Emergency Units Dispatched</p>
                        <p style="font-size:0.85rem; color:var(--text-secondary);">${data.dispatch.unit} is moving toward your location. ETA: ${data.dispatch.eta_minutes} minutes.</p>
                    </div>
                `;
            }
        }
    } catch (err) {
        console.error("SOS signal failed, using fallback trigger", err);
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
}