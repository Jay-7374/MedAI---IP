import re
import os

def fix_sidebar():
    with open('frontend/src/components/Sidebar.jsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # Remove the textbot entry
    content = re.sub(
        r"\s*\{ id: 'textbot', label: 'Chat Assistant', icon: MessageSquare \},",
        "",
        content
    )
    
    with open('frontend/src/components/Sidebar.jsx', 'w', encoding='utf-8') as f:
        f.write(content)

def fix_app_jsx():
    with open('frontend/src/App.jsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # Add import
    if "import AIAssistantView from './components/AIAssistantView';" not in content:
        content = content.replace(
            "import VoiceSimulator from './components/landing/VoiceSimulator';",
            "import VoiceSimulator from './components/landing/VoiceSimulator';\nimport AIAssistantView from './components/AIAssistantView';"
        )

    # Replace the textbot / ChatbotLayout rendering
    textbot_str = r"""              \{activeTab === 'textbot' && \(
                <ChatbotLayout isIntegrated=\{true\} />
              \)\}"""
    content = re.sub(textbot_str, "", content)
    
    # Replace topbar titles
    title_str = r"""\{activeTab === 'dashboard' && "Patient Dashboard"\}
                  \{activeTab === 'textbot' && "AI Chat Assistant"\}"""
    content = content.replace(
        """{activeTab === 'dashboard' && "Patient Dashboard"}
                  {activeTab === 'textbot' && "AI Chat Assistant"}""",
        """{activeTab === 'dashboard' && "Patient Dashboard"}"""
    )

    # Change className="view-fade-in" key={activeTab} to add styles for voicebot
    content = content.replace(
        '<div className="view-fade-in" key={activeTab}>',
        '<div className="view-fade-in" key={activeTab} style={activeTab === \'voicebot\' ? { flex: 1, display: \'flex\', flexDirection: \'column\', minHeight: 0 } : undefined}>'
    )

    # Replace voicebot block with AIAssistantView
    # Because there are so many props, I'll match the whole block
    voicebot_old = """            {activeTab === 'voicebot' && (
              <VoiceSimulator 
                user={user}
                isAdmin={isAdmin}
                selectedBot={selectedBot}
                setSelectedBot={setSelectedBot}
                callStatus={callStatus}
                simulateDbTimeout={simulateDbTimeout}
                setSimulateDbTimeout={setSimulateDbTimeout}
                consecutiveErrors={consecutiveErrors}
                setConsecutiveErrors={setConsecutiveErrors}
                sipTransferActive={sipTransferActive}
                setSipTransferActive={setSipTransferActive}
                sipTransferActiveRef={sipTransferActiveRef}
                isSpeaking={isSpeaking}
                startCallSession={startCallSession}
                endCallSession={endCallSession}
                transcripts={transcripts}
                interimText={interimText}
                chatEndRef={chatEndRef}
                wsRef={wsRef}
                sessionId={sessionId}
                showToast={showToast}
              />
            )}"""
    
    voicebot_new = """            {activeTab === 'voicebot' && (
              <AIAssistantView 
                user={user}
                isAdmin={isAdmin}
                selectedBot={selectedBot}
                setSelectedBot={setSelectedBot}
                callStatus={callStatus}
                simulateDbTimeout={simulateDbTimeout}
                setSimulateDbTimeout={setSimulateDbTimeout}
                consecutiveErrors={consecutiveErrors}
                setConsecutiveErrors={setConsecutiveErrors}
                sipTransferActive={sipTransferActive}
                setSipTransferActive={setSipTransferActive}
                sipTransferActiveRef={sipTransferActiveRef}
                isSpeaking={isSpeaking}
                startCallSession={startCallSession}
                endCallSession={endCallSession}
                transcripts={transcripts}
                interimText={interimText}
                chatEndRef={chatEndRef}
                wsRef={wsRef}
                sessionId={sessionId}
                showToast={showToast}
              />
            )}"""
    
    content = content.replace(voicebot_old, voicebot_new)

    with open('frontend/src/App.jsx', 'w', encoding='utf-8') as f:
        f.write(content)

fix_sidebar()
fix_app_jsx()
print("Fixed App and Sidebar")
