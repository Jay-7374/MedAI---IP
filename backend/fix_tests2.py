import os
import re

tests_dir = 'f:/MedAI - IP/backend/tests'

for filename in os.listdir(tests_dir):
    if filename.endswith('.py') and filename != 'test_security.py' and filename != 'conftest.py':
        filepath = os.path.join(tests_dir, filename)
        with open(filepath, 'r') as f:
            content = f.read()
        
        original_content = content
        
        # Add auth_headers to test function signatures if it uses X-User-Id
        if '"X-User-Id"' in content or "'X-User-Id'" in content:
            def replace_signature(m):
                signature = m.group(2)
                if 'auth_headers' not in signature:
                    if signature.strip() == '':
                        return f"def {m.group(1)}(auth_headers):"
                    else:
                        return f"def {m.group(1)}({signature}, auth_headers):"
                return m.group(0)

            content = re.sub(r'def\s+(test_\w+)\((.*?)\):', replace_signature, content)
            
            # replace headers={"X-User-Id": str(test_user.id)} with headers=auth_headers
            content = re.sub(r'headers\s*=\s*\{[\'"]X-User-Id[\'"]\s*:\s*str\(test_user\.id\)\}', 'headers=auth_headers', content)
            # just in case:
            content = re.sub(r'headers\s*=\s*\{[\'"]X-User-Id[\'"]\s*:\s*[\'"]\d+[\'"]\}', 'headers=auth_headers', content)
            
        if content != original_content:
            with open(filepath, 'w') as f:
                f.write(content)
