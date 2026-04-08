# Mental Health App: Frontend-Backend Integration Walkthrough

The bridging architecture linking the React Native application and the FastAPI backend service has been heavily bolstered with robust persistence, secure auth-handling, and intuitive reactive views.

## What's Changed

### 1. PostgreSQL Backbone (`backend/models.py`, `backend/main.py`)
- We officially transitioned to PostgreSQL configuration parameters as requested.
- `responses` row added as a **native JSONB column** on the `Assessment` model. This securely captures the raw Likert 1-5 choices.
- `main.py` is configured with `GET /assessments/questions` (serving a categorized 10 question battery) and `POST /assessments` (calculating Anxiety, Depression, and Stress sums via single-source truth calculation). JWT authentication wraps the entire structure.

### 2. High-Risk Evaluation Node (`src/services/scoring.ts`)
- Computed variables (such as anxiety > 14 OR depression > 13) securely compute immediately upon frontend receipt, evaluating individually to trigger the `High-Risk` boolean safely instead of accumulating disparate stress scores together erroneously.

### 3. API Storage Integration (`src/api/client.ts`, `authSlice.ts`)
- **Axios Interceptor**: A new interceptor transparently reads the JSON Web Token actively held within the application's Redux state (`authSlice`), injecting the `Authorization` header uniformly.
- Real native storage is facilitated by `react-native-keychain` async thunks added to `authSlice.ts`.

### 4. Dynamic Views (`AssessmentScreen.tsx`, `ResultsScreen.tsx`)
- Questions no longer utilize frontend Mocks. `AssessmentScreen` initializes state asynchronously from the backend FastAPI service when mounted.
- After processing questions natively, it executes a POST to dispatch the payload as JSON.
- `ResultsScreen` constructs a beautiful, calming `#4db6ac` `BarChart` based upon the returned individual scores directly. Critically, if `HighRisk` returns true, it forces a prominent Call To Action urging the user toward their local crisis service.

---

> [!NOTE]
> To compile these changes, ensure all frontend and backend dependency prerequisites align.
> 
> **For the Backend**:
> `pip install fastapi uvicorn passlib[bcrypt] python-jose psycopg2-binary sqlalchemy`
> 
> **For the Frontend** (Inside MentalHealthApp / root):
> `npm install axios react-native-keychain react-native-chart-kit @react-native-async-storage/async-storage @react-navigation/native @react-navigation/stack react-native-svg`
