# REQUIREMENTS.md

---

## 1. Vision & Problem

* **What it Solves:** Healthcare administration is bottlenecked by repetitive, high-volume patient interactions (booking, follow-ups, general triage), leading to severe staff burnout, long patient hold times, and leaked revenue from missed appointments or unmanaged post-discharge care.
* **For Whom:** Mid-to-large regional hospital networks and multi-specialty diagnostic centers managing over 10,000 patient touchpoints monthly.
* **Why Now:** Recent advancements in low-latency voice AI and strict orchestration frameworks allow conversational bots to handle complex medical routing and transactional tasks reliably, securely, and empathetically—without exposing hospital networks to hallucinatory clinical risks.

---

## 2. Target User & Positioning

* **Ideal Customer Profile (ICP):** Operations Directors and Chief Medical Officers (CMOs) at multi-facility healthcare networks operating under constrained administrative budgets.
* **The Wedge We Win On:** **The Zero-Hold Voice Gateway.** Unlike horizontal chatbot builders or fragile IVRs, this platform deploys a highly specialized, HIPAA-compliant conversational voice system that handles complex booking and basic triage instantly, integrating natively into healthcare Electronic Health Records (EHRs).

---

## 3. Non-Goals

* **Autonomous Clinical Diagnosis:** The system will never independently diagnose a patient or prescribe treatment regimens.
* **Direct Insurance Claim Adjudication:** The bot will gather insurance details and explain coverage rules but will not process or settle financial claims directly with carriers.
* **Real-time Emergency Dispatch Orchestration:** The bot will not integrate directly with municipal emergency services (like dispatching a 911/112 vehicle); it redirects the call to human personnel or instructs the user directly.

---

## 4. Constraints

* **Latency Budget:** Total voice-to-voice latency must remain under **800ms** (turn-taking detection to speech output) to prevent conversational overlap and friction.
* **Deployment Target:** Hybrid cloud deployment (AWS/Azure) with a dedicated VPN link to on-premise hospital Electronic Health Record (EHR) databases.
* **Data & Compliance:** Full compliance with **HIPAA** and **GDPR**. Zero retention of Protected Health Information (PHI) within the AI model training logs; data must be encrypted in transit (TLS 1.3) and at rest (AES-256) with BAA agreements executed for all downstream APIs.
* **AI Limits:** Maximum AI cost budget capped at **$0.05 per voice minute**. Prompt engineering must enforce strict deterministic fallbacks to prevent clinical hallucinations.

---

## 5. Features & Milestones

### Devil's Advocate Pass & Sequence Optimization

> **Review Note:** The initial idea list features an overly broad layout spanning severe clinical care (Emergency Triage, AI Nurse, Elder Care Monitoring) and low-stakes administrative tasks (Appointment booking, Diagnostic enquiry).

* *The Critique:* Mixing critical clinical triage with general inquiries in an early-stage product introduces profound legal, safety, and operational risks. An AI Nurse or Emergency Triage Voice Bot cannot be reliably validated in MVP1 without months of clinical trials.
* *The Pivot:* We will sequence all high-stakes clinical capabilities (AI Nurse, Elder Care, Emergency Triage) into MVP3+. MVP1 will focus strictly on the high-volume transactional wedge: automated outbound/inbound scheduling, basic enquiries, and structured post-discharge follow-ups where safe fallback pathways are straightforward.

---

### MVP1: The Core Transactional & Administrative Wedge

* **[AI] Inbound Doctor Appointment Scheduling & Diagnostic Enquiry**
* *User Story:* As a patient, I want to call the clinic, check availability for a specialist or a diagnostic test (e.g., X-ray), and book/reschedule an appointment naturally using my voice.
* *Done when:* A user can dial a live number, converse with the agent, successfully write an appointment directly into the simulated EHR slot, and receive a confirmation SMS.


* **[AI] Post-Discharge Monitoring & Outbound Patient Follow-up Calls**
* *User Story:* As a hospital operations manager, I want the system to trigger automated outbound calls to discharged patients 48 hours post-op to check their recovery status via a structured questionnaire.
* *Done when:* The system initiates a scheduled outbound call, completes a 5-question health assessment scorecard, logs the structured structured responses to the database, and flags anomalous answers for human review.


* **[AI] Medicine Reminder Assistant**
* *User Story:* As an elderly or chronic care patient, I want to receive proactive calls or voice alerts reminding me of my medication dosages, with the ability to confirm adherence over the phone.
* *Done when:* The system executes an outbound call based on a cron schedule, captures "Yes/No" or detailed voice confirmations, and records adherence logs.



---

### MVP2: Insurance Orchestration & Care Coordination

* **[AI] Health Insurance Support Bot**
* *User Story:* As a patient scheduling a procedure, I want to state my provider and policy group number over the phone to verify if my upcoming treatment is covered under standard hospital pre-authorization rules.
* *Done when:* The system extracts policy numbers via voice, references a structured insurance coverage lookup table, and provides an estimated out-of-pocket breakdown.


* **[AI] Telemedicine Voice Assistant Integration**
* *User Story:* As a remote patient, I want the voice assistant to seamlessly hand me off to a virtual waiting room and initialize a secure digital audio/video link with an on-call doctor.
* *Done when:* The voice session validates patient readiness and hands off the metadata payload to a WebRTC telemedicine bridge.



---

### MVP3+: Advanced Clinical Triage & Specialized Care

* **[AI] Emergency Triage Voice Assistant**
* *User Story:* As a caller facing an acute medical situation, I want to state my primary symptoms so the system can instantly classify severity and immediately route me to the top of the human emergency response queue.
* *Done when:* The system uses deterministic clinical protocols (e.g., Emergency Severity Index) to evaluate speech patterns, bypasses administrative queues within 2 seconds, and hands off to the ER floor with an acoustic summary.


* **[AI] Interactive AI Nurse Assistant**
* *User Story:* As an inpatient or home-care patient, I want to ask detailed, non-diagnostic questions regarding recovery milestones, diet constraints, and wound-care instructions.
* *Done when:* The system queries a restricted, RAG-augmented medical knowledge base to give validated, safe clinical advice anchored entirely in hospital-approved pamphlets.


* **[AI] Elder Care Monitoring Voice Bot**
* *User Story:* As a family caregiver, I want a dedicated home voice terminal to check in on an isolated elderly relative daily, assessing mood, mobility, and ambient environmental issues through natural check-ins.
* *Done when:* The system handles automated daily multi-minute welfare checks, analyzing conversational tone and semantic sentiment for cognitive or physical decline indicators.



---

## 6. Centralized Intelligence Layer

All [AI] tagged user stories route through a singular internal orchestration gateway: the **Clinical Voice Gateway Service (CVGS)**.

```
[Voice Gateway / Twilio Media Streams]
                 │ (Low-latency audio)
                 ▼
     [Clinical Voice Gateway Service]
                 │
        ┌────────┴────────┬────────────────────────┐
        ▼                 ▼                        ▼
 [Model Selection]  [Prompts & Guardrails]   [Budget Controls]
 - Groq / Whisper    - Strict System Anchor   - Session tokens capped
 - Llama-3-Groq-70b  - PII Scrubbing          - Automatic fallback 
   (Primary LLM)     - NeMo Guardrails          to human agent

```

* **MVP1 Capabilities:** The CVGS configures and locks down two primary models: **Groq/Whisper Cloud API** for ultra-fast audio transcription/generation, and **Llama-3-Groq-70b** (or an equivalent ultra-low latency inference provider) for natural language orchestration. It applies strict regex-based and LLM-based guardrails to instantly terminate and redirect any session attempting to elicit custom medical diagnoses.

---

## 7. Entity & Navigation Map

| Entity | Relationships | Primary Outbound Navigation Path | Return Navigation Path |
| --- | --- | --- | --- |
| **Patient Profile** | 1:M with Appointments<br>

<br>1:M with Follow-up Logs | Click patient name -> View Appointment History tab. | Click back button or breadcrumb -> Return to Patient Profile view. |
| **Appointment** | 1:1 with Patient Profile<br>

<br>1:1 with Provider | Click Provider slot within Appointment card -> View Provider Schedule. | Click "View Linked Patient" -> Return to Patient Profile. |
| **Follow-up Session** | 1:1 with Patient Profile<br>

<br>1:1 with Alert Flag | Click Alert Flag inside Session list -> Open System Escalation Dashboard. | Click Close Escalation -> Return to Follow-up Session grid. |
| **Provider (Doctor)** | 1:M with Appointments | Click on specific booked appointment block -> View underlying Patient Profile. | Click "Back to Calendar" -> Return to Provider Dashboard grid. |

---

## 8. Design Direction

* **The Aesthetic:** **Clinical Utility & High-Trust Efficiency.** The design avoids playful, consumer-app elements. It operates as a high-density, mission-critical workspace for hospital staff monitoring automated operations.
* **Reference Vibes:** Palantir Foundry meets Epic Systems EHR. Clean, boxy, predictable layout optimized for situational awareness.
* **Seeds:**
* *Type Personality:* Inter or SF Pro Display (Clean, highly readable sans-serif; monospace elements for call durations, timestamps, and insurance codes).
* *Color Mood:* Restrained, clinical palette. Dark Slate (`#1E293B`) text headers, crisp clinical backgrounds (`#F8FAFC`), with targeted high-contrast Alert Red (`#EF4444`) used *exclusively* for failed triage or flagged follow-up exceptions.
* *Density:* High density. Grid systems and tabular data layouts maximize information-above-the-fold for administrative staff.
* *Motion Intent:* Static, instant transitions. No whimsical animations or decorative fades; loading skeletons appear instantly to mirror the low-latency target.


* **What We Are NOT:** A trendy B2B SaaS tool with rounded pastel buttons, emojis, or airy layouts that waste screen space.

---

## 9. Pages & Flows

### Core Flow: Inbound Scheduling & Triage Hand-off

* **Happy Path:**
1. Patient dials the system line.
2. Voice bot answers within 400ms, greets patient, and captures identity via Name and DOB.
3. Patient states: *"I need to book an ultrasound for tomorrow morning."*
4. Bot queries available EHR database slots, offers 9:00 AM, and patient accepts.
5. Bot reads confirmation text, writes the slot to the database, sends an SMS, and gracefully disconnects.


* **Alternate Paths:**
* *Rescheduling:* Patient calls to alter an existing appointment. System authenticates, retrieves the active booking, prompts for new timing options, cancels the old slot, and updates the registry.


* **Error & Failure States:**
* *EHR Database Timeout:* If the database takes $>1.5$ seconds to return open slots, the bot states: *"I am currently experiencing an issue accessing our schedule system. Let me transfer you directly to our clinic coordinator to finish your booking right away."* Call executes a SIP transfer to the front desk.
* *ASR Disconnect / Unintelligible Audio:* If user audio cuts or falls below confidence thresholds twice consecutively, the bot prompts: *"I'm having trouble hearing you clearly. I am transferring you to a live coordinator now."*


* **Screen States (Internal Operations Dashboard Monitor):**
* *Empty State:* *"No active voice sessions in progress. System operational."*
* *Loading State:* Skeleton rows representing voice channels initializing dynamically during peak-hour traffic spikes.
* *Degraded State:* If the transcription engine drops latency below targets, a yellow persistent banner appears: *"Voice transcription latency degraded (1.4s). System dynamically falling back to high-speed deterministic fallback dialogue trees."*


* **Edge & Boundary Cases:**
* *Concurrency Limits:* If 200 concurrent calls hit the system while only 150 channels are open, the extra 50 calls hit an immediate, standard telecom-level fallback queue or direct bypass line to a physical trunk line.



---

## 10. Success Criteria

* **Call Resolution Rate (MVP1):** $\ge 75\%$ of inbound appointment/enquiry calls fully resolved without needing human agent intervention.
* **Turn-Taking Latency:** Sub-**800ms** P95 latency from end of patient speech to start of synthetic voice output.
* **Data Integrity Check:** Exactly $0\%$ of patient calls contain unmasked PII within the centralized AI logging infrastructure.

---

## 11. Open Questions & Assumptions

* **Logged Assumption 1 (Critical):** We assume mid-market regional hospitals will allow write-access APIs to their EHR systems (e.g., HL7/FHIR or custom integrations) for automated AI schedulers. If locked out, MVP1 must fallback to an intermediate queue table that requires human approval.
* **Logged Assumption 2:** We assume that patients will comfortably interact with an automated voice system for medical booking without hanging up immediately to dial human dispatch.
* **Logged Assumption 3:** We assume Groq/Whisper API infrastructures remain stable enough to maintain sub-800ms latency budgets globally during regional internet routing anomalies.

---

# REQUIREMENTS REVIEW GATE

### 1. MVP1 Feature Challenge

* *Challenge:* Are the scheduled features actual capabilities or junk?
* *Assessment:* Every element of MVP1 is strictly scoped to core operations. We removed broad clinical features (AI Nurse, Triage) to keep MVP1 bounded entirely within transactional text/audio workflows (Booking, Medication logging, Post-op tracking) which are clear, high-ROI, measurable automated actions.

### 2. Duplicate or Overlapping Capabilities

* *Assessment:* "Diagnostic center enquiry handling" and "Doctor appointment scheduling" are consolidated into one unified semantic processing pattern inside the Centralized Intelligence Layer (routing to an availability matrix).

### 3. MVP1 Core Outcome Verification

* *Assessment:* Yes. By enabling a hospital to automate inbound scheduling and run automated outbound follow-ups, the core business objective—reducing front-desk staff burdens and stabilizing patient attendance metrics—is completely achievable without any MVP2/3 features present.

### 4. Milestone Dependency Verification

* *Assessment:* * MVP2 (Insurance verification) builds directly upon the identity-and-booking foundation laid out in MVP1.
* MVP3+ (Clinical triage, interactive nursing advice) depends strictly on the system maintaining robust operational baseline security and low-latency voice pipes established in MVP1/MVP2.



### 5. Top 3 Highest-Risk Assumptions

1. **EHR Write-Access Integration:** The willingness of traditional healthcare IT systems to open secure, real-time read/write endpoints to an AI system.
2. **Voice Turn-Taking Latency:** The risk of network jitter breaking the conversational rhythm, causing patients to talk over the bot or grow frustrated.
3. **Strict Compliance Boundary Maintenance:** The operational risk of patients shifting conversation from an administrative task (booking) to an unscripted emergency scenario, requiring flawless real-time human escalation execution.