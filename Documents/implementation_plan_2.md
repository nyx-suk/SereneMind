# Implementation Plan: Frontend-Backend Integration

This document outlines the approach for building the bridge between the React Native frontend and FastAPI backend for the Mental Health Self-Assessment App, as well as implementing the dynamic assessment, scoring, and visualizations.

## User Review Required

> [!IMPORTANT]
> Please review the architecture and constraints below to ensure they align with your expectations.
> 1. Currently, `backend/models.py` doesn't have a JSONB column for raw assessment answers; it only stores the calculated scores (`anxiety_score`, `depression_score`, `stress_score`). I will construct the scoring service on the frontend (`src/services/scoring.ts`) to compute the categories from the answers and then POST the calculated scores to the existing `Assessment` model schema.
> 2. I will use Redux's `store.getState().auth.token` for synchronous Axios interception, while continuing to securely persist the token with `react-native-keychain` during login/app initialization.

## Proposed Changes

---

### Backend Integration Layer & Logic

I'll set up `backend/main.py` using FastAPI with SQLite (as a placeholder for PostgreSQL, ready to be swapped) and `SQLAlchemy`.

#### [NEW] [backend/main.py](file:///d:/mental_health/app_01/MentalHealthApp/backend/main.py)
- Integrate standard FastAPI configuration.
- Implement User Authentication endpoints (`POST /auth/register`, `POST /auth/login`) using `passlib[bcrypt]` to enforce password hashing before DB writes.
- Implement `GET /assessments/questions` that returns a static battery of 15 questions categorized into Anxiety, Depression, and Stress.
- Implement `POST /assessments` utilizing the `User` and `Assessment` model relations, mapping to the defined PRD schema.

#### [MODIFY] [backend/models.py](file:///d:/mental_health/app_01/MentalHealthApp/backend/models.py)
- Minor adjustments if necessary for `passlib` integration. Currently, the schema matches the PRD constraints (uses `hashed_password`).

---

### API Infrastructure

#### [NEW] [src/api/client.ts](file:///d:/mental_health/app_01/MentalHealthApp/src/api/client.ts)
- Construct a base Axios instance for all backend communication.
- Implement `axios.interceptors.request.use` to extract the JWT from Redux `authSlice` and mount the `Authorization: Bearer <token>` header dynamically.

#### [MODIFY] [src/store/authSlice.ts](file:///d:/mental_health/app_01/MentalHealthApp/src/store/authSlice.ts)
- Add utility/thunk logic if needed to read from/write to `react-native-keychain`.

---

### Assessment & Visualization Layer

#### [NEW] [src/services/scoring.ts](file:///d:/mental_health/app_01/MentalHealthApp/src/services/scoring.ts)
- Create a pure, testable function that iterates through the raw question scores (mapped back to their categories: Anxiety, Depression, Stress), computes the sums/averages, and detects a 'High-Risk' threshold.

#### [MODIFY] [src/screens/AssessmentScreen.tsx](file:///d:/mental_health/app_01/MentalHealthApp/src/screens/AssessmentScreen.tsx)
- Remove `MOCK_QUESTIONS`. Add `useEffect` to fetch dynamic questions from `GET /assessments/questions`.
- Update completion flow: invoke `src/services/scoring.ts`, `POST /assessments` through `client.ts`, update Redux state, and navigate to `ResultsScreen`.

#### [NEW] [src/screens/ResultsScreen.tsx](file:///d:/mental_health/app_01/MentalHealthApp/src/screens/ResultsScreen.tsx)
- Use `react-native-chart-kit` (`BarChart` or `RadarChart`) to showcase the user's Anxiety, Depression, and Stress levels.
- Integrate the calming `#e0f2f1`, `#4db6ac`, `#00897b` blue/green color scheme.
- Render personalized recommendations per score category.
- Display a prominent, red "Connect to Crisis Support" action element dynamically if triggered by the "High-Risk" threshold boolean.

#### [MODIFY] [src/navigation/AppNavigator.tsx](file:///d:/mental_health/app_01/MentalHealthApp/src/navigation/AppNavigator.tsx)
- Stub the new `ResultsScreen` and include it in the navigation stack.

---

## Open Questions

> [!WARNING]
> Regarding database credentials, should I pre-configure the FastAPI SQL URL for PostgreSQL directly (e.g. `postgresql://user:pass@localhost:5432/mentalhealth`), or stick with a local `.sqlite` development bridge to start?

## Verification Plan

### Automated Tests
- No formal testing suite like Jest/PyTest requested, but I will perform CLI executions to ensure successful script/lint compilations after generating UI & endpoints.
- I will execute the backend via `uvicorn backend.main:app` and verify the `/docs` schema loads seamlessly.

### Manual Verification
- Will verify Axios headers log correctly with intercepted JWTs.
- Will manually trigger the React Native app lifecycle flows by navigating through the Assessment UI.
