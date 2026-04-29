import pytest
import httpx
import jwt
from sqlalchemy.orm import sessionmaker
from backend.models import Base, User, Assessment
from backend.main import engine
import os

# Test data
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "testpass123"

@pytest.fixture(scope="session")
def db_session():
    """Fixture to provide a database session for cleanup."""
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = SessionLocal()
    yield session
    session.close()

@pytest.fixture(scope="session", autouse=True)
def cleanup_test_user(db_session):
    """Cleanup fixture to delete the test user after all tests."""
    yield
    # Delete test user
    user = db_session.query(User).filter(User.email == TEST_EMAIL).first()
    if user:
        db_session.delete(user)
        db_session.commit()

@pytest.mark.asyncio
async def test_register():
    async with httpx.AsyncClient(base_url="http://localhost:8000") as client:
        response = await client.post("/auth/register", json={"email": TEST_EMAIL, "password": TEST_PASSWORD})
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "userId" in data
        # Verify JWT
        token = data["token"]
        payload = jwt.decode(token, "your_super_secure_32_byte_secret_key_here_change_in_production_12345678901234567890123456789012", algorithms=["HS256"])
        assert payload["sub"] == str(data["userId"])

@pytest.mark.asyncio
async def test_login():
    async with httpx.AsyncClient(base_url="http://localhost:8000") as client:
        response = await client.post("/auth/login", json={"email": TEST_EMAIL, "password": TEST_PASSWORD})
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "userId" in data
        # Verify JWT
        token = data["token"]
        payload = jwt.decode(token, "your_super_secure_32_byte_secret_key_here_change_in_production_12345678901234567890123456789012", algorithms=["HS256"])
        assert payload["sub"] == str(data["userId"])

@pytest.mark.asyncio
async def test_get_questions():
    async with httpx.AsyncClient(base_url="http://localhost:8000") as client:
        # First login to get token
        login_response = await client.post("/auth/login", json={"email": TEST_EMAIL, "password": TEST_PASSWORD})
        token = login_response.json()["token"]

        response = await client.get("/assessments/questions", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        questions = response.json()
        assert len(questions) == 16

        depression_count = sum(1 for q in questions if q["category"] == "depression")
        anxiety_count = sum(1 for q in questions if q["category"] == "anxiety")
        assert depression_count == 9
        assert anxiety_count == 7

        for q in questions:
            assert "options" in q
            assert len(q["options"]) == 4
            for option in q["options"]:
                assert "label" in option
                assert "value" in option

@pytest.mark.asyncio
async def test_submit_assessment():
    async with httpx.AsyncClient(base_url="http://localhost:8000") as client:
        # First login to get token
        login_response = await client.post("/auth/login", json={"email": TEST_EMAIL, "password": TEST_PASSWORD})
        token = login_response.json()["token"]

        response = await client.post("/assessments", json={"anxiety_score": 18, "depression_score": 22}, headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "assessment_id" in data

# Note: Scoring logic test is skipped as it requires importing TypeScript from src/services/scoring.ts
# This would need Jest for JavaScript/TypeScript testing instead of pytest.
# @pytest.mark.parametrize("answers,expected", [
#     ([{"questionId": "phq1", "value": 3}, ...], {"depression": 3, "anxiety": 0}),
#     ...
# ])
# def test_compute_scores(answers, expected):
#     from src.services.scoring import computeScores
#     questions = [...]  # Mock questions
#     result = computeScores(answers, questions)
#     assert result == expected

# @pytest.mark.parametrize("score,category,expected", [
#     (5, "depression", "Mild"),
#     ...
# ])
# def test_get_severity_label(score, category, expected):
#     from src.services.scoring import getSeverityLabel
#     result = getSeverityLabel(score, category)
#     assert result == expected