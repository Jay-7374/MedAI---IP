import re
import os

def edit_sidebar():
    with open('frontend/src/components/Sidebar.jsx', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Add MessageSquare to imports
    if 'MessageSquare' not in content:
        content = re.sub(
            r"import \{([^}]+)\} from 'lucide-react';",
            r"import {\1, MessageSquare\n} from 'lucide-react';",
            content
        )
    
    # Add textbot to navItems after dashboard
    if "id: 'textbot'" not in content:
        content = re.sub(
            r"(\{ id: 'dashboard', label: 'Dashboard', icon: ActivitySquare \},)",
            r"\1\n    { id: 'textbot', label: 'Chat Assistant', icon: MessageSquare },",
            content
        )

    with open('frontend/src/components/Sidebar.jsx', 'w', encoding='utf-8') as f:
        f.write(content)


def edit_app_jsx():
    with open('frontend/src/App.jsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # Add ChatbotLayout to dashboard rendering section
    # Search for {activeTab === 'dashboard' && <PatientDashboard ... />}
    if "activeTab === 'textbot' && (" not in content:
        # We need to insert it inside the main-content <main> tag.
        # Find where PatientDashboard is rendered.
        replacement = r"""{activeTab === 'dashboard' && (
                <PatientDashboard vitals={vitals} user={user} appointments={appointments} medicines={medicines} navigateTo={navigateTo} />
              )}
              
              {activeTab === 'textbot' && (
                <ChatbotLayout isIntegrated={true} />
              )}"""
        
        content = re.sub(
            r"\{activeTab === 'dashboard' && \(\s*<PatientDashboard vitals=\{vitals\} user=\{user\} appointments=\{appointments\} medicines=\{medicines\} navigateTo=\{navigateTo\} />\s*\)\}",
            replacement,
            content
        )

        # We also need to add the title in the top bar
        title_replacement = r"""{activeTab === 'dashboard' && "Patient Dashboard"}
                  {activeTab === 'textbot' && "AI Chat Assistant"}"""
        
        content = re.sub(
            r"\{activeTab === 'dashboard' && \"Patient Dashboard\"\}",
            title_replacement,
            content
        )

    with open('frontend/src/App.jsx', 'w', encoding='utf-8') as f:
        f.write(content)


def edit_chatbot_layout():
    with open('frontend/src/components/chatbot/ChatbotLayout.jsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # Update export default function ChatbotLayout() to export default function ChatbotLayout({ isIntegrated = false })
    if "isIntegrated" not in content:
        content = re.sub(
            r"export default function ChatbotLayout\(\) \{",
            r"export default function ChatbotLayout({ isIntegrated = false }) {",
            content
        )

    # Change style of the top-level div
    # <div style={{ display: 'flex', height: '100vh', width: '100vw', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontFamily: 'var(--font-family, system-ui)', position: 'relative' }}>
    style_search = r"<div style=\{\{ display: 'flex', height: '100vh', width: '100vw', backgroundColor: 'var\(--bg-main\)', color: 'var\(--text-main\)', fontFamily: 'var\(--font-family, system-ui\)', position: 'relative' \}\}>"
    style_replacement = r"""<div style={{ 
      display: 'flex', 
      height: isIntegrated ? '100%' : '100vh', 
      width: isIntegrated ? '100%' : '100vw',
      flex: isIntegrated ? 1 : 'unset',
      overflow: 'hidden',
      backgroundColor: 'var(--bg-main)', 
      color: 'var(--text-main)', 
      fontFamily: 'var(--font-family, system-ui)', 
      position: 'relative' 
    }}>"""
    
    content = re.sub(style_search, style_replacement, content)

    with open('frontend/src/components/chatbot/ChatbotLayout.jsx', 'w', encoding='utf-8') as f:
        f.write(content)

edit_sidebar()
edit_app_jsx()
edit_chatbot_layout()
print("Integration scripts run successfully.")
