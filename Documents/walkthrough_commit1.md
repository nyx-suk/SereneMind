# Comprehensive Project Walkthrough: Mental Health Self-Assessment App

This document serves as a comprehensive snapshot of the project's progress, architectural decisions, and current state. It is designed to provide immediate context for anyone picking up the project to continue development.

---

## 1. High-Level Architecture

The project follows a decoupled client-server architecture:
- **Frontend**: A React Native application written in TypeScript (`MentalHealthApp/`) utilizing Redux for state management.
- **Backend**: A FastAPI Python service (`backend/`) utilizing SQLAlchemy ORM connected to a PostgreSQL database.

The core objective is to provide a seamless, HIPAA-compliant platform for subjective mental health assessments with dynamic scoring and crisis intervention routing.

---

## 2. Backend Infrastructure (`backend/`)

The backend is built around FastAPI and focuses on secure, relational data tracking.

### Schema (`models.py`)
- **`User`**: Handles authentication and basic profiles. Uses `passlib[bcrypt]` for secure password hashing. Future-proofed with an `encrypted_demographics` string for secure demographic storage.
- **`Assessment`**: Stores mental health evaluations. 
  - Uses native PostgreSQL **`JSONB`** (`responses` column) to store the raw 1-5 Likert scale choices. This acts as the single source of truth for future machine learning analysis or re-evaluating psychological metrics.
  - Also stores pre-computed integers (`anxiety_score`, `depression_score`, `stress_score`) for rapid dashboard querying.
- **`Progress`**: Stores aggregated summary metrics (rolling averages) over specific periods to prevent heavy on-the-fly SQL SUM calls.

### API Routes (`main.py`)
- **Auth Layer**: `POST /auth/register` and `POST /auth/login`. Issues JSON Web Tokens (JWT) using `python-jose`.
- **Assessment Fetch**: `GET /assessments/questions` serves a static battery of 10-15 psychological assessment questions, tagged by category (Anxiety, Depression, Stress).
- **Assessment Submission**: `POST /assessments` receives the raw JSON answers. The backend handles the responsibility of calculating the categorical scores before inserting them into the database natively alongside the raw JSONB.

---

## 3. Frontend Architecture (`src/`)

### A. State Management & API
- **Axios Interceptor (`api/client.ts`)**: A custom Axios instance routes to the backend (`http://10.0.2.2:8000` for Android emulator). It intercepts requests and dynamically injects the `Authorization` JWT directly from Redux.
- **Redux Setup (`store/`)**: 
  - `authSlice.ts`: Tracks authentication state. Uses asynchronous thunks combined with `react-native-keychain` to securely persist the JWT (avoiding easily compromised `AsyncStorage`).
  - `assessmentSlice.ts`: Tracks the ephemeral questionnaire state and the user's latest computed scores.

### B. Navigation (`navigation/AppNavigator.tsx`)
React Navigation dictates the user flow, separating authenticated and unauthenticated stacks:
- **Auth Stack**: `Welcome`, `Login`, `Register` (currently UI stubs).
- **Protected Stack**: `Dashboard`, `Assessment`, `Results`, `Crisis Support`.

### C. Core Views
- **`AssessmentScreen.tsx`**: 
  - Retrieves dynamic questions from FastAPI via `useEffect`.
  - Presents a clean, calming UI utilizing `#4db6ac` (teal) color palettes.
  - Tracks progress via an animated bar and fades questions in and out sequentially.
  - Upon completion, `POST`s the data natively and navigates to Results.
- **`ResultsScreen.tsx`**: 
  - Visualizes the categorical scores using `react-native-chart-kit` (`BarChart`).
  - Maps descriptive advice messages depending on the severity of the score.

### D. Safety Logic (`services/scoring.ts`)
- **Individualized Crisis Triggers**: Instead of summing scores (which could hide a severe spike in one specific category), the `checkHighRisk` boolean evaluates `Anxiety`, `Depression`, and `Stress` individually relative to their specific critical thresholds.
- If threshold is met, it dynamically paints a prominent, red "Connect to Crisis Support" action in `ResultsScreen` pointing the user to the `CrisisScreen` (pre-scaffolded for hotline/chat functionality).

---

## 4. Next Steps for Continuation

To pick up this project and resume implementation, focus on the following:

1. **Environment Setup**:
   - Ensure a local PostgreSQL database is running (mapped in `main.py`).
   - Run backend: `pip install fastapi uvicorn passlib[bcrypt] python-jose psycopg2-binary sqlalchemy` -> `uvicorn backend.main:app --reload`.
   - Run frontend: Execute `npm install` inside the `MentalHealthApp` directory to pull necessary components like `react-native-keychain`, `@react-navigation/native`, and `react-native-chart-kit`.
2. **Flesh out Stubs**: The `LoginScreen`, `RegisterScreen`, `DashboardScreen`, and `CrisisScreen` inside the navigator are currently placeholder `View` text stubs. They require flesh out to tie into the Redux and API clients already provisioned.
3. **Cross-Platform IP Bridge**: The Axios `BASE_URL` currently defaults to `10.0.2.2` (Android emulator localhost). This must be made dynamic utilizing `.env` variables (e.g. `react-native-dotenv`) if migrating to physical iOS/Android devices.
