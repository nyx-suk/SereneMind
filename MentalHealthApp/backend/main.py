from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from .models import Base, User, Assessment
from passlib.context import CryptContext
from pydantic import BaseModel
from typing import Dict, List, Any
from jose import jwt, JWTError
from datetime import datetime, timedelta, timezone
import os

# Database config
POSTGRES_USER = os.environ.get("POSTGRES_USER", "postgres")
POSTGRES_PASSWORD = os.environ.get("POSTGRES_PASSWORD", "postgres")
POSTGRES_HOST = os.environ.get("POSTGRES_HOST", "localhost")
POSTGRES_DB = os.environ.get("POSTGRES_DB", "mentalhealth")

SQL_URL = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:5432/{POSTGRES_DB}"
engine = create_engine(SQL_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

app = FastAPI(title="Mental Health App API")
security = HTTPBearer()

# Security Configs
SECRET_KEY = "super_secret_for_now"
ALGORITHM = "HS256"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = db.query(User).filter(User.id == int(user_id)).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

@app.on_event("startup")
def startup_db_client():
    Base.metadata.create_all(bind=engine)

# Pydantic Schemas
class AuthSchema(BaseModel):
    email: str
    password: str

class TokenSchema(BaseModel):
    token: str
    userId: int

class AssessmentSubmitSchema(BaseModel):
    responses: Dict[str, int]

# Auth Endpoints
@app.post("/auth/register", response_model=TokenSchema)
def register(user_data: AuthSchema, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pwd = pwd_context.hash(user_data.password)
    new_user = User(email=user_data.email, hashed_password=hashed_pwd)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    token = jwt.encode({"sub": str(new_user.id), "exp": datetime.now(timezone.utc) + timedelta(days=7)}, SECRET_KEY, algorithm=ALGORITHM)
    return {"token": token, "userId": new_user.id}

@app.post("/auth/login", response_model=TokenSchema)
def login(user_data: AuthSchema, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_data.email).first()
    if not user or not pwd_context.verify(user_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    token = jwt.encode({"sub": str(user.id), "exp": datetime.now(timezone.utc) + timedelta(days=7)}, SECRET_KEY, algorithm=ALGORITHM)
    return {"token": token, "userId": user.id}

# Assessment Questions Payload
MOCK_QUESTIONS = [
  { "id": "q1", "text": "How often have you felt nervous, anxious, or on edge?", "category": "anxiety" },
  { "id": "q2", "text": "How often have you felt down, depressed, or hopeless?", "category": "depression" },
  { "id": "q3", "text": "How often have you found yourself getting agitated?", "category": "stress" },
  { "id": "q4", "text": "How often have you had trouble relaxing?", "category": "anxiety" },
  { "id": "q5", "text": "How often have you felt little interest or pleasure in doing things?", "category": "depression" },
  { "id": "q6", "text": "How often have you felt you were unable to tolerate interruptions?", "category": "stress" },
  { "id": "q7", "text": "How often have you felt afraid as if something awful might happen?", "category": "anxiety" },
  { "id": "q8", "text": "How often have you felt bad about yourself?", "category": "depression" },
  { "id": "q9", "text": "How often have you felt that you were using a lot of nervous energy?", "category": "stress" },
  { "id": "q10", "text": "How often have you had trouble falling asleep?", "category": "depression" }
]

@app.get("/assessments/questions")
def get_questions():
    return MOCK_QUESTIONS

@app.post("/assessments")
def submit_assessment(data: AssessmentSubmitSchema, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    responses = data.responses
    
    # Calculate scores on backend
    anxiety = 0.0
    depression = 0.0
    stress = 0.0
    
    anxiety_count = 0
    depression_count = 0
    stress_count = 0
    
    for q in MOCK_QUESTIONS:
        if q["id"] in responses:
            score = float(responses[q["id"]])
            if q["category"] == "anxiety":
                anxiety += score
                anxiety_count += 1
            elif q["category"] == "depression":
                depression += score
                depression_count += 1
            elif q["category"] == "stress":
                stress += score
                stress_count += 1
                
    # Averages or sums could be used; sticking to sums per common scales (e.g. DASS-21)
    # We will use sum for now.
    
    new_assessment = Assessment(
        user_id=current_user.id,
        responses=responses,
        anxiety_score=anxiety,
        depression_score=depression,
        stress_score=stress
    )
    
    db.add(new_assessment)
    db.commit()
    db.refresh(new_assessment)
    
    return {
        "id": new_assessment.id,
        "scores": {
            "anxiety": new_assessment.anxiety_score,
            "depression": new_assessment.depression_score,
            "stress": new_assessment.stress_score
        }
    }
