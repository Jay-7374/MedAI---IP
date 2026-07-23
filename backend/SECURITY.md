# Security Notes

## Authentication Limitation (Development/Demo Only)

**Vulnerability**: The current implementation relies on a client-supplied `X-User-Id` HTTP header to identify users in the backend APIs (e.g. `get_user_from_header` in `chatbot.py`). 

- **Trusting Client Input**: Trusting an unverified, client-provided ID is inherently insecure. A malicious actor can easily manipulate the header to spoof any other user's identity.
- **Silent Fallback**: If the `X-User-Id` is missing or invalid, the backend silently falls back to the first user in the database (`db.query(User).first()`). This fallback behavior prevents development crashes but allows silent identity spoofing across the application.

**Required Production Fix**: 
This mechanism MUST NOT be used in a production environment. Before production deployment, the `X-User-Id` header authentication must be completely replaced with:
1. Verified JWT (JSON Web Tokens)
2. OAuth2 implementation
3. Or robust server-side session authentication.

Identity enforcement must occur securely on the backend, ensuring that users can only access their own sessions, messages, and documents.
