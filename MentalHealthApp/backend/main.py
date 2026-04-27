from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from .models import Base, User, Assessment
from passlib.context import CryptContext
from pydantic import BaseModel
from typing import Dict, List, Any
from jwt import PyJWTError as JWTError
from datetime import datetime, timedelta, timezone
import os

# Database config
SQL_URL = "sqlite:///./mentalhealth.db"
engine = create_engine(SQL_URL, connect_args={"check_same_thread": False})
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
    anxiety_score: float
    depression_score: float
    stress_score: float

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
  { "id": "q10", "text": "How often have you had trouble falling asleep?", "category": "depression" },
  { "id": "q11", "text": "How often have you felt worried about the future?", "category": "anxiety" },
  { "id": "q12", "text": "How often have you felt worthless?", "category": "depression" },
  { "id": "q13", "text": "How often have you felt overwhelmed by your responsibilities?", "category": "stress" },
  { "id": "q14", "text": "How often have you experienced sudden panic?", "category": "anxiety" },
  { "id": "q15", "text": "How often have you felt like giving up?", "category": "depression" }
]

@app.get("/assessments/questions")
def get_questions():
    return MOCK_QUESTIONS

@app.post("/assessments")
def submit_assessment(data: AssessmentSubmitSchema, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    new_assessment = Assessment(
        user_id=current_user.id,
        anxiety_score=data.anxiety_score,
        depression_score=data.depression_score,
        stress_score=data.stress_score
    )
    
    db.add(new_assessment)
    db.commit()
    db.refresh(new_assessment)
    
    return {"message": "Assessment submitted successfully", "assessment_id": new_assessment.id}
    
    return {
        "id": new_assessment.id,
        "scores": {
            "anxiety": new_assessment.anxiety_score,
            "depression": new_assessment.depression_score,
            "stress": new_assessment.stress_score
        }
    }
