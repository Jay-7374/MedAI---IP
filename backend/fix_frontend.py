import re

with open('f:/MedAI - IP/frontend/src/components/chatbot/ChatWindow.jsx', 'r') as f:
    cw = f.read()

# Remove 'X-User-Id': '1'
cw = cw.replace(", 'X-User-Id': '1'", "")
cw = cw.replace("'X-User-Id': '1' ", "")
cw = cw.replace("'X-User-Id': '1'", "")

with open('f:/MedAI - IP/frontend/src/components/chatbot/ChatWindow.jsx', 'w') as f:
    f.write(cw)

with open('f:/MedAI - IP/frontend/src/components/chatbot/InputArea.jsx', 'r') as f:
    ia = f.read()

ia = ia.replace(", 'X-User-Id': '1'", "")
ia = ia.replace("'X-User-Id': '1' // Using standard fallback", "")
ia = ia.replace("'X-User-Id': '1'", "")

with open('f:/MedAI - IP/frontend/src/components/chatbot/InputArea.jsx', 'w') as f:
    f.write(ia)
