# Mental Health Self-Assessment App

A mobile-first platform designed to help users track their mental health, visualize progress, and receive AI-powered recommendations or crisis support.

## Project Overview

- **Target Audience:** Adults 18-45 experiencing stress/anxiety.
- **Core Architecture:** 
  - **Frontend:** React Native (TypeScript, Redux).
  - **Backend:** FastAPI (Python) with PostgreSQL (SQLAlchemy).
- **Design Language:** Calming, clean palette heavily utilizing blues and greens (specifically `#4db6ac` teal).
- **Security:** Built from the ground up with HIPAA-ready compliance in mind.

## High-Level Architecture

The project follows a decoupled client-server architecture.

### Backend Infrastructure (`backend/`)
Built with FastAPI and focuses on secure, relational data tracking.
- **Schema (`models.py`)**:
  - `User`: Uses `passlib[bcrypt]` for secure password hashing and has an `encrypted_demographics` column for future demographic storage.
  - `Assessment`: Stores evaluations using native PostgreSQL **`JSONB`** (`responses` column) as the single source of truth for future machine learning analysis. Also stores pre-computed integer scores for `Anxiety`, `Depression`, and `Stress` categories to enable rapid filtering and risk stratification.
  - `Progress`: Stores aggregated metrics from assessments to track user trends over time.
- **API Routes (`main.py`)**:
  - Auth Layer: `POST /auth/register` and `/auth/login` issuing JWTs with secure refresh token handling.
  - Assessment Fetch: `GET /assessments/questions` serving a static battery of 10-15 psychological assessment questions in JSON format.
  - Assessment Submission: `POST /assessments` receives raw JSON answers, calculates categorical scores on the backend, and inserts them natively into the database.
  - Progress Retrieval: `GET /progress/trend` returns historical trend data for dashboard visualization.

### Frontend Architecture (`src/`)
- **State & API**: 
  - A custom Axios interceptor (`api/client.ts`) dynamically injects the `Authorization` JWT directly from Redux.
  - Redux (`store/`) utilizes `react-native-keychain` in `authSlice.ts` to securely persist the JWT. `assessmentSlice.ts` handles the ephemeral questionnaire state and form validation.
- **Navigation (`AppNavigator.tsx`)**: Separated into an Auth Stack (`Welcome`, `Login`, `Register`) and a Protected Stack (`Dashboard`, `Assessment`, `Results`, `Crisis Support`).
- **Core Views**:
  - `AssessmentScreen.tsx`: Retrieves dynamic questions via `useEffect`. Features a teal UI with animated progress bars and asynchronous `POST` dispatches to submit responses.
  - `ResultsScreen.tsx`: Visualizes categorical scores using `react-native-chart-kit` (`BarChart`) with color-coded risk levels.
  - `DashboardScreen.tsx`: Displays user's historical progress and trending mental health metrics.
  - `CrisisScreen.tsx`: Provides immediate access to crisis resources, hotline directory, and 988 integration.
- **Safety Logic**: The `checkHighRisk` function in `services/scoring.ts` evaluates `Anxiety`, `Depression`, and `Stress` individually to safely route users to Crisis Support if any single threshold exceeds critical levels, ensuring proper escalation for at-risk users.

## API Documentation

### Authentication Endpoints
- `POST /auth/register` - Create a new user account
  - Request: `{ username, email, password }`
  - Response: `{ user_id, token }`
- `POST /auth/login` - Authenticate and receive JWT
  - Request: `{ email, password }`
  - Response: `{ access_token, token_type }`

### Assessment Endpoints
- `GET /assessments/questions` - Retrieve assessment questions
  - Response: `{ questions: [{ id, text, category, options }] }`
- `POST /assessments` - Submit assessment responses
  - Request: `{ responses: [{ question_id, answer }] }`
  - Response: `{ assessment_id, scores: { anxiety, depression, stress }, risk_level }`

### Progress Endpoints
- `GET /progress/trend` - Retrieve historical progress data
  - Response: `{ data: [{ date, anxiety_score, depression_score, stress_score }] }`

## The Roadmap

We are currently finishing Phase 1 (Core Features) and preparing for Phase 2.

### Remaining Phase 1 (Core Features):
- Flesh out the `DashboardScreen.tsx` to visualize historical progress (`GET /progress/trend` using line charts).
- Complete the `CrisisScreen.tsx` with hotline directory, 988 integration, and local crisis resource mapping.
- Implement personalized resource recommendations based on assessment results and risk profiles.
- Add comprehensive error handling and user feedback mechanisms across all screens.

### Phase 2 (Advanced Features - Future):
- Machine Learning Integration: Using Hugging Face BERT models for sentiment analysis on qualitative feedback.
- Predictive analytics for mental health risk assessment and trend forecasting.
- Therapist appointment booking system with Stripe integration for premium services.
- Push notifications for check-ins and progress milestones.
- Integration with wearable health devices for holistic wellness tracking.

## Strict Guardrails & Guidelines

- **Data Logic:** Never calculate assessment scores purely on the frontend. All scoring must happen on the backend to ensure consistency and security.
- **Storage:** Never use `AsyncStorage` for sensitive data or tokens; always use `Keychain` for HIPAA compliance and secure credential management.
- **Database:** Do not alter the PostgreSQL `JSONB` schema, as we need that raw data intact for Phase 2 Machine Learning models and historical analysis.
- **API Communication:** Always validate and sanitize user input on both client and server sides.
- **Error Handling:** Never expose sensitive system errors to the frontend; return generic error messages to users.

## Local Environment Setup

To pick up this project and resume implementation:

### Prerequisites
- Node.js 16+ and npm
- Python 3.9+
- PostgreSQL 12+ running locally

### Installation Steps

1. **Database Setup**: Ensure a local PostgreSQL database is running. Update your database credentials in `backend/main.py`:
   ```bash
   createdb serene_mind
   ```

2. **Run Backend**:
   ```bash
   cd backend
   pip install fastapi uvicorn passlib[bcrypt] python-jose psycopg2-binary sqlalchemy
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

3. **Run Frontend**:
   Navigate into the `MentalHealthApp` directory and install dependencies:
   ```bash
   cd MentalHealthApp
   npm install
   npm start
   ```

4. **Cross-Platform IP Bridge**: The Axios `BASE_URL` currently defaults to `10.0.2.2` (Android emulator localhost). Update this dynamically utilizing `.env` variables if migrating to physical iOS devices or other emulators. Create a `.env` file in the frontend root:
   ```
   REACT_NATIVE_API_URL=http://10.0.2.2:8000
   ```

## Project Structure

```
SereneMind/
├── backend/
│   ├── main.py           # FastAPI app entry point
│   ├── models.py         # SQLAlchemy database models
│   ├── schemas.py        # Pydantic request/response schemas
│   └── routes/           # API endpoint modules
├── MentalHealthApp/
│   ├── src/
│   │   ├── screens/      # React Native screen components
│   │   ├── store/        # Redux store and slices
│   │   ├── api/          # Axios client and interceptors
│   │   ├── services/     # Business logic (scoring, validation)
│   │   └── navigation/   # Navigation configuration
│   └── package.json
└── README.md
```

## Contributing

When contributing to this project:
1. Follow the guardrails and guidelines strictly
2. Ensure all sensitive operations happen on the backend
3. Test authentication flows thoroughly
4. Maintain HIPAA compliance in all data handling

## License

This project is licensed under the MIT License - see LICENSE file for details.

## Support & Contact

For questions or issues related to this project, please open an issue in the repository or contact the maintainers directly.