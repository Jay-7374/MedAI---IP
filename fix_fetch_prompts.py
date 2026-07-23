import re

def fix_fetch_prompts():
    with open('frontend/src/App.jsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # Gate fetchPrompts based on isAdmin
    content = re.sub(
        r"      fetchPrompts\(\);\n      fetchSmsMessages\(\);",
        r"      if (isAdmin) {\n        fetchPrompts();\n      }\n      fetchSmsMessages();",
        content
    )

    with open('frontend/src/App.jsx', 'w', encoding='utf-8') as f:
        f.write(content)

fix_fetch_prompts()
print("fetchPrompts gated")
