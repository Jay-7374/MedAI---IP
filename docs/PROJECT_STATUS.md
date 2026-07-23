# SALUS Project Status

## COMPLETED
- Authentication/JWT
- Per-user chat isolation
- Chat sessions/history
- Streaming responses
- Stop generation
- Persona/language controls
- Document upload/QA
- STT/TTS (Voice Assistant)
- Unified AI Assistant UI
- Responsive chat UI
- Automated tests
- Documentation

## KNOWN LIMITATIONS / FUTURE WORK
- Scheduling backend integration pending
- Medication backend integration pending
- Password hashing intentionally omitted for prototype
- Supabase RLS redesign deferred
- Skipped streaming-cancellation automated tests due to TestClient hang on streaming disconnect
- Frontend bundle-size warning (vite warning for large chunks)
- External AI/TTS services depend on API quota/network
