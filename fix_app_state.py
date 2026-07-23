import re

def fix_app_state():
    with open('frontend/src/App.jsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update view initialization
    view_init = """  const [view, setView] = useState(() => {
    if (window.location.pathname === '/chatbot-dev') return 'chatbot-dev';
    const savedUser = localStorage.getItem('user');
    if (savedUser && localStorage.getItem('access_token')) return 'app';
    return 'landing';
  });"""
    content = re.sub(r"  const \[view, setView\] = useState\('landing'\); // 'landing' or 'app'", view_init, content)

    # 2. Update activeTab initialization
    tab_init = """  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('activeTab') || 'dashboard';
  });

  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);"""
    content = re.sub(r"  const \[activeTab, setActiveTab\] = useState\('dashboard'\);", tab_init, content)

    # 3. Remove the now-redundant useEffect for /chatbot-dev that overwrites view
    # because we handle it in the initializer
    content = re.sub(
        r"  useEffect\(\(\) => \{\n    if \(window\.location\.pathname === '/chatbot-dev'\) \{\n      setView\('chatbot-dev'\);\n    \}\n  \}, \[\]\);\n",
        "",
        content
    )

    with open('frontend/src/App.jsx', 'w', encoding='utf-8') as f:
        f.write(content)

fix_app_state()
print("State initialized")
