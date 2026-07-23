import re

with open('f:/MedAI - IP/backend/tests/conftest.py', 'r') as f:
    content = f.read()

fixtures = """
@pytest.fixture(scope="function")
def test_user_2(db_session):
    user = db_session.query(app.models.User).filter(app.models.User.email == "test2_pytest@example.com").first()
    if not user:
        user = app.models.User(id=2, email="test2_pytest@example.com", name="Pytest User 2")
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
    return user

@pytest.fixture(scope="function")
def auth_headers(test_user):
    from app.services.auth_service import create_access_token
    token = create_access_token(data={"sub": str(test_user.id), "role": "patient"})
    return {"Authorization": f"Bearer {token}"}
"""

if "test_user_2" not in content:
    # Insert after test_user fixture
    content = re.sub(r'(return user\n)', r'\1' + fixtures, content, count=1)

with open('f:/MedAI - IP/backend/tests/conftest.py', 'w') as f:
    f.write(content)
