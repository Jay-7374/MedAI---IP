# Instructions Guide - MedAI Flow Bot Platform

MedAI Flow is an advanced AI-powered full-stack hospital automation and voice assistant platform. It handles medical triage, appointment bookings, medication adherence checks, and other clinical tasks using a high-fidelity React dashboard and a FastAPI backend with PostgreSQL.

---

## 1. Technical Stack Used

### Frontend Layer
*   **React.js (Vite)**: Ultra-fast single-page React client engine.
*   **Vanilla CSS3**: Tailored styling system using CSS variables, glassmorphic grids, responsive sidebars, custom scrollbars, and pulse animations.
*   **Lucide React**: Premium icon set for visual clarity.
*   **Web Speech API (`webkitSpeechRecognition` & `SpeechSynthesis`)**: Zero-cost, zero-latency client-side speech processing running locally on the user's browser without requiring GPU hardware.

### Backend Layer
*   **FastAPI (Python)**: High-performance, asynchronous REST and WebSocket server.
*   **SQLAlchemy ORM**: Relational mapper communicating with PostgreSQL.
*   **Psycopg (v3)**: Modern PostgreSQL driver for safe, pre-compiled connections.
*   **Groq Cloud SDK**: Powers LLaMA 3.3 70B and LLaMA 3 8B models (providing 300+ tokens/sec inference) for instant dialogue generation, and Whisper (`whisper-large-v3`) for audio transcription.
*   **Twilio (Optional)**: Telephony support for routing real phone calls via WebSocket streams.

### Database Layer
*   **PostgreSQL (Supabase)**: Managed database hosting conversation logs, patient session timelines, and active prompt configurations.

---

## 2. Platform Features

The MedAI Flow dashboard is split into 6 core sections:
1.  **Telemetry Dashboard**: Periodic biometrics stream checking heart rate, oxygen saturation, blood pressure, and core temperature, rendering live analytics graphs.
2.  **Voice AI Assistant**: Interactive voice call panel connecting via WebSockets to our LLM prompt orchestrator, featuring visualizer audio waves and auto-scrolling transcripts.
3.  **Appointments Scheduler**: Dynamic scheduling console to book consultations and allocate clinician nodes.
4.  **Medicines Tracker**: Configures prescription regimen streams and manages patient compliance checks.
5.  **Prompt Manager**: Interactive system prompt template editor allowing administrators to update and re-compile system instructions for all 11 bot personas.
6.  **Emergency SOS Dispatch Node**: Glowing emergency panic trigger that bypasses normal queues, dispatches responders (Ambulance Unit #4B), and reports ETA.

---

## 3. The 11 Voice Agent Core Personas

The system features 11 specialist bot personas, each automatically loaded with a custom system prompt:

| Agent Persona | Focus & Role |
| :--- | :--- |
| **Appointment Booking Assistant** | Gathers patient parameters to request clinical consultations. |
| **Patient Follow-Up Calls** | Checks on recovery progress post-consultation and logs patient feedback. |
| **Post-Discharge Monitoring Bot** | Validates wound status, medication adherence, and alerts clinicians on anomalies. |
| **Medicine Reminder Assistant** | Verifies daily pharmacological compliance (Lisinopril, Metformin). |
| **Health Insurance Support Bot** | Guides users on claim status, deductibles, and pre-authorizations. |
| **Emergency Triage Voice Assistant** | Assesses symptom severity (Red, Yellow, Green) and directs to ER / SOS. |
| **Diagnostic Center Enquiry Handling** | Explains pricing, test availability, and report timelines. |
| **Doctor Appointment Scheduling** | Smart-checks practitioner calendars to coordinate clinical resource blocks. |
| **AI Nurse Assistant** | Answers post-treatment care questions and explains curated medical FAQs. |
| **Elder Care Monitoring Voice Bot** | Performs daily check-ins on vitals and coordinates with emergency contacts. |
| **Telemedicine Voice Assistant** | Full consult wrapper (symptom log &rarr; triage &rarr; prescription generation). |

---

## 4. Local Development Setup

To run the application locally on your machine, follow these steps:

### Prerequisites
1.  Install **Python 3.10+**.
2.  Install **Node.js LTS**.
3.  Provision a **PostgreSQL** database (locally or using a free cloud option like Supabase).

### Step-by-Step Setup
1.  **Clone / Prepare Workspace**: Open the project folder `f:\MedAI - IP\`.
2.  **Backend Configuration**:
    *   Create a `.env` file inside `backend/` with the following variables:
        ```env
        GROQ_API_KEY=your_groq_api_key_here
        DATABASE_URL=postgresql://user:password@host:5432/db_name
        TWILIO_ACCOUNT_SID=your_twilio_sid
        TWILIO_AUTH_TOKEN=your_twilio_token
        ```
3.  **Install Python Dependencies**:
    ```bash
    cd backend
    python -m venv venv
    # Activate virtual environment
    # On Windows:
    .\venv\Scripts\Activate.ps1
    # On Mac/Linux:
    source venv/bin/activate
    
    pip install -r requirements.txt
    ```
4.  **Install Node Dependencies**:
    ```bash
    cd ../frontend
    npm install
    ```
5.  **Compile Frontend Bundle**:
    ```bash
    npm run build
    ```
6.  **Run Dev Server**:
    Start the FastAPI server inside `backend/`:
    ```bash
    uvicorn main:app --reload
    ```
    Visit `http://localhost:8000/` in your browser.

---

## 5. Deployment Guide

### Easiest Deployment Architecture
*   **Database**: Supabase PostgreSQL (Free Tier).
*   **Frontend**: React static assets compiled and deployed to **Vercel** or served via **Render**.
*   **Backend**: Python FastAPI service running on **Render** (Free Web Service) or **Railway** (supports persistent WebSockets).

### Production Deploy Checklist
1.  Ensure Nginx/Server utilizes SSL (`https://` / `wss://`). WebRTC and the Web Speech API **require a secure connection** to grant microphone permissions.
2.  In Render, add environment variables for `GROQ_API_KEY`, `DATABASE_URL`, `TWILIO_ACCOUNT_SID`, and `TWILIO_AUTH_TOKEN`.
3.  Deploy the built `frontend/dist/` index package.
