import re

def update_app_jsx():
    with open('frontend/src/App.jsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Add handleLogout inside App component
    if 'const handleLogout =' not in content:
        logout_func = """
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setUser(null);
    setView('landing');
    showToast("Logged out successfully.", "warning");
  };
"""
        content = re.sub(
            r"(const \[historyStack, setHistoryStack\] = useState\(\[\]\);)",
            r"\1\n" + logout_func,
            content,
            count=1
        )

    # 2. Update navigateTo to intercept 'login' if already authenticated
    navigate_to_replacement = """
  const navigateTo = (newView, newTab) => {
    if (newView === 'login' && user && localStorage.getItem('access_token')) {
      newView = 'app';
      newTab = newTab || 'dashboard';
    }
    // Prevent pushing duplicate consecutive states onto history
"""
    content = re.sub(
        r"  const navigateTo = \(newView, newTab\) => \{\n    // Prevent pushing duplicate consecutive states onto history\n",
        navigate_to_replacement,
        content,
        count=1
    )

    # 3. Update handleAuthSubmit to store access_token and user (login)
    login_success = """
        const data = await res.json();
        if (res.ok) {
          const name = data.name || data.user?.name;
          const role = data.role || data.user?.role;
          setUser({ name, role });
          
          if (data.access_token) {
            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('user', JSON.stringify({ name, role, id: data.user?.id, email: data.user?.email }));
          }

          showToast(`Welcome back, ${name}!`, 'success');
"""
    content = re.sub(
        r"        const data = await res\.json\(\);\n        if \(res\.ok\) \{\n          const name = data\.name \|\| data\.user\?\.name;\n          const role = data\.role \|\| data\.user\?\.role;\n          setUser\(\{ name, role \}\);\n          showToast\(`Welcome back, \$\{name\}!`, 'success'\);",
        login_success,
        content,
        count=1
    )

    # 4. Update handleAuthSubmit to store access_token and user (register)
    # The register endpoint right now in auth.py DOES NOT return an access_token. It only returns the User model.
    # The user says "Login once with valid credentials." Let's check register endpoint if it returns token.
    # In auth.py: return user. It doesn't return access_token. So user has to login after signup?
    # Wait, the user prompt says: "A. Login once with valid credentials."

    # 5. Pass handleLogout to Sidebar
    content = re.sub(
        r"setSidebarOpen=\{setSidebarOpen\}",
        r"setSidebarOpen={setSidebarOpen}\n          handleLogout={handleLogout}",
        content
    )

    with open('frontend/src/App.jsx', 'w', encoding='utf-8') as f:
        f.write(content)

def update_sidebar_jsx():
    with open('frontend/src/components/Sidebar.jsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # Change signature to accept handleLogout
    content = re.sub(
        r"export default function Sidebar\(\{ user, setUser, setView, activeTab, navigateTo, isAdmin, sidebarOpen, setSidebarOpen, showToast \}\) \{",
        r"export default function Sidebar({ user, setUser, setView, activeTab, navigateTo, isAdmin, sidebarOpen, setSidebarOpen, showToast, handleLogout }) {",
        content,
        count=1
    )

    # Remove the local handleLogout
    content = re.sub(
        r"\s*const handleLogout = \(\) => \{\s*setUser\(null\);\s*setView\('landing'\);\s*showToast\(\"Logged out successfully\.\", \"warning\"\);\s*\};\s*",
        r"\n  ",
        content,
        count=1
    )

    with open('frontend/src/components/Sidebar.jsx', 'w', encoding='utf-8') as f:
        f.write(content)

update_app_jsx()
update_sidebar_jsx()
print("Success")
