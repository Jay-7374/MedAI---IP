# SALUS System Architecture

This document describes the final architecture for the SALUS healthcare management platform mini-project.

## 1. Frontend Architecture
The frontend is a Single Page Application (SPA) built with React and Vite. It heavily utilizes modular functional components. 
- **Routing**: Client-side state-based routing is used via the `view` and `activeTab` states in `App.jsx`, avoiding complex external routing libraries for simplicity.
- **State Management**: React's built-in `useState` and `useEffect` hooks manage session and application states.
- **Layout Shell**: The application uses a persistent `Sidebar` and `TopNavigationPanel` wrapping dynamic views (Dashboard, Chat, Scheduling, etc.).

## 2. Backend Architecture
The backend is a monolithic RESTful API built with FastAPI (Python), following a clean layered architecture:
- `routers/`: Expose API endpoints and handle HTTP/WebSocket requests.
- `services/`: Contain the core business logic (LLM integrations, STT, TTS, Authentication).
- `models.py`: Define SQLAlchemy ORM classes.
- `schemas.py`: Define Pydantic models for validation.

## 3. Authentication Flow
- **Mechanism**: JWT (JSON Web Tokens).
- **Flow**: User logs in -> FastAPI verifies credentials -> issues a JWT access token.
- **Persistence**: Token is stored in the browser's `localStorage` and sent in the `Authorization: Bearer <token>` header for subsequent requests. 
- *Note: Password hashing (bcrypt) is intentionally deferred. Plain-text evaluation is used for this prototype.*

## 4. Chat Request & SSE Streaming Flow
- **Streaming**: AI Chat Assistant relies on Server-Sent Events (SSE).
- **Flow**:
  1. Frontend calls `POST /api/chatbot/message`.
  2. Backend immediately responds with a `StreamingResponse`.
  3. The LLM (Groq) streams tokens to the backend via `async for chunk in ...`.
  4. Backend yields these chunks to the frontend.
  5. Frontend `EventSource` (or async reader) appends tokens in real-time.

## 5. Session Isolation & Context
- **Isolation**: Every chat `Session` is tied directly to a `user_id` in the database. `deps.get_current_user` ensures endpoints can only modify sessions owned by the authenticated user.
- **Context/Rolling Summary**: Instead of sending massive histories to the LLM, the backend uses `context_manager.py` to maintain a running summary of the conversation. This keeps context windows small and API costs low.

## 6. Document QA Flow
- **Upload**: User uploads a file. The frontend extracts text using a lightweight library (`pdf.js` or `mammoth`) and sends plain text to the backend.
- **Storage**: Text is stored in the database associated with the session.
- **RAG (Retrieval-Augmented Generation)**: When the user asks a question, the backend retrieves the stored document text and injects it into the LLM system prompt.

## 7. Voice Assistant Flow
- **STT (Speech-to-Text)**: Frontend uses the Web Speech API (native browser functionality) to capture and transcribe user voice in real-time.
- **Logic**: The transcription is sent to the backend `/api/voice` WebSocket.
- **TTS (Text-to-Speech)**: The backend generates a text response via Groq, requests audio generation from ElevenLabs via TTS service, and streams the raw MP3 audio bytes back through the WebSocket.
- **Playback**: Frontend plays the audio chunk by chunk using an `AudioContext`.

## 8. LLM Fallback Behavior
- **Primary**: `llama-3.3-70b-versatile` (via Groq) is used for fast inference.
- **Fallback**: If the primary model hits a rate limit (429), the backend automatically degrades to `llama3-8b-8192` within the same request cycle to ensure continuous uptime.

## 9. Database Interaction
- **Engine**: Supabase PostgreSQL.
- **ORM**: SQLAlchemy is used synchronously.
- *Note: Supabase Row Level Security (RLS) is intentionally not implemented. The backend handles all data-isolation enforcement explicitly at the router level.*

## 10. Testing Architecture
- **Framework**: `pytest`
- **Isolation**: A secondary, ephemeral SQLite database (`sqlite:///./test.db`) is used during `pytest` execution. 
- **Mocking**: External API calls to Groq and ElevenLabs are mocked out to ensure unit tests run quickly, safely, and without incurring costs.
