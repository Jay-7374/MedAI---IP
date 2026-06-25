import os
import requests
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

print("--- Programmatic Verification of Roles & API ---")

# Base URL of the API
BASE_URL = "http://127.0.0.1:8000"

# 1. Verify Patient Login
print("\n1. Testing Patient Login...")
payload = {"username": "patient@medai.com", "password": "123456"}
res = requests.post(f"{BASE_URL}/api/auth/login", json=payload)
print(f"Status: {res.status_code}, Response: {res.json()}")
assert res.status_code == 200, "Patient login failed"
assert res.json()["role"] == "patient", f"Unexpected role for patient: {res.json()['role']}"
print("Patient Login Verified!")

# 2. Verify Admin Login
print("\n2. Testing Admin Login...")
payload = {"username": "admin@medai.com", "password": "admin123"}
res = requests.post(f"{BASE_URL}/api/auth/login", json=payload)
print(f"Status: {res.status_code}, Response: {res.json()}")
assert res.status_code == 200, "Admin login failed"
assert res.json()["role"] == "admin", f"Unexpected role for admin: {res.json()['role']}"
print("Admin Login Verified!")

# 3. Verify Doctor Registration and Role Assignment
print("\n3. Testing Doctor Registration...")
doctor_email = "house_test@medai.com"
register_payload = {
    "name": "Dr Gregory House Test",
    "email": doctor_email,
    "password": "doctorpassword",
    "role": "Doctor"
}
# Delete existing test user if exists to prevent duplication error
db_url = os.getenv("DATABASE_URL")
if db_url:
    if db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+psycopg://", 1)
    engine = create_engine(db_url)
    with engine.connect() as conn:
        conn.execute(text("DELETE FROM users WHERE email = :email"), {"email": doctor_email})
        conn.commit()

res = requests.post(f"{BASE_URL}/api/auth/register", json=register_payload)
print(f"Registration Status: {res.status_code}, Response: {res.json()}")
assert res.status_code == 200, "Doctor registration failed"
assert res.json()["role"] == "doctor", f"Unexpected role assigned to Doctor: {res.json()['role']}"

# 4. Verify Doctor Login
print("\n4. Testing Doctor Login...")
login_payload = {"username": doctor_email, "password": "doctorpassword"}
res = requests.post(f"{BASE_URL}/api/auth/login", json=login_payload)
print(f"Login Status: {res.status_code}, Response: {res.json()}")
assert res.status_code == 200, "Doctor login failed"
assert res.json()["role"] == "doctor", f"Unexpected role for Doctor: {res.json()['role']}"
print("Doctor Registration & Login Verified!")

# 5. Verify Prompt Management Access
print("\n5. Testing Role-Based Route Protection (Prompt Configurator)...")
# Patient should be rejected with 403
headers = {"X-User-Role": "patient"}
res = requests.get(f"{BASE_URL}/api/prompts", headers=headers)
print(f"Patient access /api/prompts: Status {res.status_code}, Response {res.json()}")
assert res.status_code == 403, "Patient was not denied prompts access"

# Doctor should be rejected with 403
headers = {"X-User-Role": "doctor"}
res = requests.get(f"{BASE_URL}/api/prompts", headers=headers)
print(f"Doctor access /api/prompts: Status {res.status_code}")
assert res.status_code == 403, "Doctor was not denied prompts access"

# Admin should be allowed with 200
headers = {"X-User-Role": "admin"}
res = requests.get(f"{BASE_URL}/api/prompts", headers=headers)
print(f"Admin access /api/prompts: Status {res.status_code}")
assert res.status_code == 200, "Admin was denied prompts access"

print("\nALL BACKEND ROLE SECURITY & ROUTING CHECKS COMPLETED SUCCESSFULLY!")
