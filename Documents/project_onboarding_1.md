# Mental Health App: AI Co-Pilot Context

Act as a Lead Full-Stack Engineer and HIPAA Compliance Specialist. I am building a "Mental Health Self-Assessment App," and I need you to act as my technical co-pilot for the remainder of the project.

Below is the context of the project, what we have built so far, and the roadmap for what we need to build next. 

### 1. PROJECT OVERVIEW & PRD
We are building a mobile-first platform to help users track their mental health, visualize progress, and receive AI-powered recommendations or crisis support. 
* **Target Audience:** Adults 18-45 experiencing stress/anxiety.
* **Core Architecture:** React Native (TypeScript, Redux) for the frontend. FastAPI (Python) with PostgreSQL (SQLAlchemy) for the backend.
* **Design Language:** Calming, clean palette heavily utilizing blues and greens (specifically #4db6ac teal).
* **Security:** HIPAA-ready compliance is mandatory.

### 2. CURRENT STATE (WHAT IS ALREADY BUILT)
We are currently in "Phase 1: Core Features". The foundational architecture is complete:

#### Backend (FastAPI/PostgreSQL):
* The `User` model uses `passlib[bcrypt]` and has an `encrypted_demographics` column.
* The `Assessment` model uses a native PostgreSQL `JSONB` column (`responses`) to store raw 1-5 Likert scale choices. This is our single source of truth. It also stores pre-computed categorical integers (`anxiety_score`, `depression_score`, `stress_score`).
* `POST /assessments` receives raw JSON, calculates scores *on the backend*, and inserts them.
* `GET /assessments/questions` serves a categorized 10-15 question battery.

#### Frontend (React Native/Redux):
* `authSlice` uses `react-native-keychain` for secure JWT persistence.
* A custom Axios interceptor dynamically injects the JWT into the Authorization header.
* `AssessmentScreen.tsx` fetches questions dynamically, displays them with an animated progress bar, and POSTs the payload on completion.
* `ResultsScreen.tsx` uses `react-native-chart-kit` (BarChart) to visualize scores.

#### Safety Logic:
The backend scoring service evaluates Anxiety, Depression, and Stress *individually*. If any specific threshold is met, it triggers a "High-Risk" boolean, which forces a red "Connect to Crisis Support" action on the frontend Results screen.

### 3. THE ROADMAP (WHAT WE NEED TO BUILD NEXT)
We still need to finish Phase 1 and prepare for Phase 2:
* **Remaining Phase 1 (Core Features):** * Flesh out the `DashboardScreen.tsx` to visualize historical progress (`GET /progress/trend` using line charts).
  * Flesh out the `CrisisScreen.tsx` (hotline directory, 988 integration).
  * Implement personalized resource recommendations based on assessment results.
* **Phase 2 (Advanced Features - Future):**
  * Machine Learning Integration: Using Hugging Face BERT models for sentiment analysis on qualitative feedback.
  * Predictive analytics for mental health risk assessment.
  * Therapist appointment booking system (Stripe integration).

### 4. STRICT CONSTRAINTS
* **Data Logic:** Never calculate assessment scores purely on the frontend.
* **Storage:** Never use `AsyncStorage` for sensitive data or tokens; always use `Keychain`.
* **Database:** Do not alter the PostgreSQL `JSONB` schema, as we need that raw data for the Phase 2 Machine Learning models.

### YOUR INSTRUCTIONS
Do not write any code yet. 
1. Acknowledge that you have read and understood this context, the architecture, and the constraints.
2. Provide a brief summary of what you see as the immediate next 2-3 logical steps to finish Phase 1.
3. Ask me which of those steps I would like to tackle first.