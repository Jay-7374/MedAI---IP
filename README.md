# SALUS

SALUS is a healthcare management platform with an integrated AI Assistant. Designed as a college mini-project, it demonstrates a modular architecture for patient scheduling, medicine adherence, and multimodal conversational AI capabilities.

## Main Features
- Patient authentication & session persistence
- Dashboard for unified view
- **Pending/Incomplete Integrations:** Scheduling backend integration and Medication backend integration are intentionally pending for this prototype.
- Unified AI Assistant:
  - **Chat Assistant** (streaming LLM responses with fallback behavior)
  - **Voice Assistant** (speech-to-text / text-to-speech)
  - **Multiple AI personas** (General, Symptom Checker, Medicine Guide, Post-Discharge Recovery)
  - **Multi-language support**
  - **Chat history** with session switching
  - **Document upload** and Document Q&A capabilities
- Per-user chat isolation (application-level authorization)
- Responsive UI design (desktop and mobile)

## Technology Stack
- **Frontend**: React, Vite, Vanilla CSS, Lucide React
- **Backend**: FastAPI, Python, SQLAlchemy
- **Database**: Supabase PostgreSQL
- **AI**: Groq API
- **Voice**: Browser Web Speech API (STT), ElevenLabs (TTS)
- **Testing**: pytest (with an isolated SQLite test database)

## Architecture Overview
```text
React Frontend
      ↓
FastAPI REST/SSE/WebSocket Backend
      ↓
Authentication / Chat / Context / Documents / Voice
      ↓
Supabase PostgreSQL
      ↓
External AI/TTS services
```

## Setup Instructions (Windows)

### Prerequisites
- Node.js (v18+)
- Python (3.9+)
- A Supabase PostgreSQL database
- API Keys for Groq (LLM) and ElevenLabs (TTS)

### Backend Setup
1. Open a terminal and navigate to the backend directory:
   ```powershell
   cd backend
   ```
2. Create and activate a virtual environment:
   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```
3. Install dependencies:
   ```powershell
   pip install -r requirements.txt
   ```
4. Configure environment variables by copying `.env.example` to `.env` and filling in the required values.
5. Run the FastAPI server:
   ```powershell
   uvicorn main:app --reload
   ```

### Frontend Setup
1. Open a separate terminal and navigate to the frontend directory:
   ```powershell
   cd frontend
   ```
2. Install dependencies:
   ```powershell
   npm install
   ```
3. Start the Vite development server:
   ```powershell
   npm run dev
   ```

## Environment Variables
Ensure the following variable names are configured in your `backend/.env` file:
- `DATABASE_URL`
- `GROQ_API_KEY`
- `JWT_SECRET_KEY`
- `JWT_ALGORITHM`
- `ACCESS_TOKEN_EXPIRE_MINUTES`
- `ELEVENLABS_API_KEY`
- `ALLOWED_ORIGIN`

*(Never commit actual secrets to version control).*

## Testing & Validation
- **Backend**: Run the automated test suite with `pytest`:
  ```powershell
  cd backend
  .\venv\Scripts\Activate.ps1
  pytest tests/ -v
  ```
- **Frontend**: Verify production build integrity:
  ```powershell
  cd frontend
  npm run build
  ```

## Project Structure
```text
SALUS/
├── backend/
│   ├── app/
│   │   ├── routers/       # API endpoints (auth, chat, voice, etc.)
│   │   ├── services/      # Business logic (LLM, TTS, STT, Auth)
│   │   ├── models.py      # SQLAlchemy models
│   │   └── ...
│   ├── tests/             # Pytest automated testing suite
│   ├── main.py            # FastAPI application entry point
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/    # Reusable React components (Chatbot, Sidebar, etc.)
│   │   ├── pages/         # View layouts (Dashboard, Login, AdminConsole, etc.)
│   │   ├── App.jsx        # Frontend router & root component
│   │   └── index.css      # Global styling rules
│   └── package.json
└── docs/
    └── ARCHITECTURE.md    # In-depth system architecture documentation
```

## Security Notes
- **JWT Authentication**: Users securely authenticate using JSON Web Tokens.
- **Resource Ownership**: The backend enforces strict ownership checks; users can only query their own chat sessions and histories. User chat isolation is implemented.
- **Secrets Management**: All sensitive API keys and database strings are confined to local `.env` variables and excluded from the repository.
- *(Note: Supabase Row Level Security (RLS) is not relied upon for backend authorization because the backend uses application-level ownership checks. Advanced password hashing (bcrypt) was intentionally not implemented for this college prototype).*

## Known Limitations
- **Not a Production System**: This is a college mini-project prototype and is NOT a production medical system.
- **Pending Features**: Scheduling backend integration and Medication backend integration are pending/incomplete.
- **Browser Dependency**: The Voice Assistant's STT relies on the Web Speech API, which requires a compatible browser (like Chrome or Edge) to function reliably.
- **Rate Limits**: Heavy usage may trigger LLM or TTS API rate limits (e.g., Groq's Tokens Per Day).
- **Scope**: Developed as a college prototype; not intended for real-world production medical deployment. Certain resilience features (like forced cancellation of active streaming loops) are intentionally skipped in automated tests to prevent quota exhaustion.
