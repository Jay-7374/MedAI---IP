import re

with open('f:/MedAI - IP/backend/app/routers/chatbot.py', 'r') as f:
    content = f.read()

# Remove get_user_from_header
content = re.sub(r'def get_user_from_header.*?return user\n\n\n', '', content, flags=re.DOTALL)

# Add get_current_user import
if 'get_current_user' not in content:
    content = content.replace('from app.database import get_db', 'from app.database import get_db\nfrom app.dependencies import get_current_user')

# Replace the specific x_user_id parameters
content = re.sub(r'x_user_id:\s*str\s*=\s*Header\(None,\s*alias="X-User-Id"\)', 'current_user: User = Depends(get_current_user)', content)

# Remove the get_user_from_header lines inside functions
content = re.sub(r'\s+user\s*=\s*get_user_from_header\(db,\s*x_user_id\)', '', content)

# Replace user.id with current_user.id
content = content.replace('user.id', 'current_user.id')

with open('f:/MedAI - IP/backend/app/routers/chatbot.py', 'w') as f:
    f.write(content)
