import re

with open('../frontend/src/App.jsx', 'r') as f:
    content = f.read()

# Replace login handler success block
old_login_success = """          const data = await res.json();
          if (res.ok) {
            const name = data.name || data.user?.name;
            const role = data.role || data.user?.role;
            setUser({ name, role });
            showToast(`Welcome back, ${name}!`, 'success');
            setView('app');"""

new_login_success = """          const data = await res.json();
          if (res.ok) {
            const name = data.name || data.user?.name;
            const role = data.role || data.user?.role;
            const userId = data.id || data.user?.id;
            setUser({ id: userId, name, role });
            if (data.access_token) {
              localStorage.setItem('access_token', data.access_token);
              localStorage.setItem('user', JSON.stringify({ id: userId, name, role }));
            }
            showToast(`Welcome back, ${name}!`, 'success');
            setView('app');"""

content = content.replace(old_login_success, new_login_success)

# Replace logout handler
old_logout = """  const handleLogout = () => {
    setUser(null);
    setView('landing');
    showToast("You have been logged out.", 'success');
  };"""

new_logout = """  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setUser(null);
    setView('landing');
    showToast("You have been logged out.", 'success');
  };"""

content = content.replace(old_logout, new_logout)

# Global 401 handler effect
unauth_effect = """  useEffect(() => {
    const handleUnauthorized = () => {
      handleLogout();
      showToast("Session expired. Please log in again.", "danger");
      setAuthMode('login');
      setView('login');
    };
    window.addEventListener('unauthorized', handleUnauthorized);
    return () => window.removeEventListener('unauthorized', handleUnauthorized);
  }, []);"""

if 'handleUnauthorized' not in content:
    # Insert right after useEffect(() => { if (user) { fetchAppointments()... }
    content = re.sub(r'(}, \[user\]\);)', r'\1\n\n' + unauth_effect, content)

# Also check initial user load from localStorage
initial_user = """  const [user, setUser] = useState(null);"""
new_initial_user = """  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });"""
content = content.replace(initial_user, new_initial_user)

with open('../frontend/src/App.jsx', 'w') as f:
    f.write(content)
