# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GCP Guru is a flashcard learning application for Google Cloud Platform Professional Cloud Architect certification preparation. It's a full-stack TypeScript/Python application with:

- **Frontend**: Next.js 14 (TypeScript, React 18) on Cloud Run
- **Backend**: FastAPI (Python) on Cloud Run
- **Database**: Google Firestore for questions and user progress
- **Storage**: Google Cloud Storage for case study markdown files
- **AI**: Google Gemini 2.5 Flash for explanations and hints
- **State**: Zustand with localStorage persistence
- **UI**: Radix UI + Tailwind CSS
- **CI/CD**: Automated via Cloud Build on push to main

## Development Commands

### Local Development

```bash
# Start both backend and frontend (from project root)
npm run dev

# Backend only (runs on port 8000)
cd backend
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Frontend only (runs on port 3000)
cd frontend
npm run dev
```

### Testing & Building

```bash
# Frontend build (from project root)
npm run build

# Type checking and linting
npm test
cd frontend && npm run type-check
cd frontend && npm run lint

# Backend syntax check
cd backend && python3 -m py_compile services/*.py routers/*.py
```

### Database Operations

```bash
# Add new questions to Firestore (preserves user data)
gcloud auth application-default login
python backend/scripts/add_new_questions.py data/new_questions.json

# Update existing questions (preserves scores, stars, notes, AI content)
python backend/scripts/add_new_questions.py data/new_questions.json --overwrite

# Deactivate questions in Firestore
python backend/scripts/deactivate_questions.py <question_number> [question_number...]
```

### Deployment

Push to main branch triggers automated Cloud Build pipeline. No manual deployment needed.

## Architecture

### Backend Service Layer Pattern

The backend follows a strict service-oriented architecture with singleton instances:

**Services** (`backend/services/`):
- `question_service.py`: Question CRUD, random selection, answer checking
- `progress_service.py`: User progress tracking, session management, mastery level filtering
- `ai_service.py`: Gemini AI integration for explanations/hints with case study context
- `firestore_service.py`: Firestore database operations
- `gcs_service.py`: Cloud Storage for case study files
- `auth_service.py`: Firebase authentication token verification
- `answer_shuffler.py`: Answer randomization system

**Routers** (`backend/routers/`):
- `questions.py`: Question endpoints (/api/questions/*)
- `progress.py`: Progress endpoints (/api/progress/*)

**Key Pattern**: Global singleton instances (e.g., `question_service = QuestionService()`) are imported by routers. Services import each other as needed, creating a dependency graph.

### Frontend Architecture

**Screen-based Navigation** (`frontend/src/components/screens/`):
- `StartScreen.tsx`: Entry point
- `DomainSelectionScreen.tsx`: Topic selection and mastery level filtering
- `TrainingScreen.tsx`: Question display and answering
- `ProgressScreen.tsx`: Analytics dashboard with charts
- `BrowseScreen.tsx`: Question library browser

**State Management** (`frontend/src/lib/store.ts`):
- Zustand store with localStorage persistence
- Screens navigate via `setCurrentScreen('screenName')`
- Session state persists across page refreshes
- Training state includes `selectedDomains`, `selectedMasteryLevels`, `useShuffledQuestions`

**API Layer** (`frontend/src/lib/api.ts`):
- Centralized API client with Firebase auth token injection
- Endpoints mirror backend router structure
- SWR hooks in `frontend/src/hooks/useApi.ts` for data fetching

### Mastery Level System

Questions are scored based on answer history:
- **-1 (Mistakes)**: Recently answered incorrectly
- **0-1 (Learning)**: In progress
- **2-3 (Mastered)**: Well understood
- **4+ (Perfected)**: Fully mastered (excluded from training by default)

Mastery level filtering allows users to focus training on specific score ranges. The filter UI is a dropdown in `DomainSelectionScreen` with color-coded buttons (red=mistakes, gray=learning, blue=mastered, green=perfected).

### Answer Shuffling System

**Purpose**: Prevent answer memorization by randomizing answer order.

**Implementation**:
- `answer_shuffler.py` creates shuffled copies with new letter mappings
- Original mapping stored in `ShuffledQuestion.original_mapping`
- Frontend submits shuffled answers + mapping to `/questions/{id}/answer-shuffled`
- Backend reverses mapping before checking correctness
- AI explanations avoid letter references, using descriptive text instead

### Session Management

**Progress Tracking** (`progress_service.py`):
- `current_session_questions`: Track shown questions to prevent repeats
- `start_new_session()`: Resets session state, saves previous session to history
- `get_available_questions_for_tags()`: Filters by tags, mastery levels, and session history
- Session stats persist in Firestore with Europe/Berlin timezone

**Question Selection Algorithm**:
1. Filter by active status, selected tags, and mastery levels
2. Exclude questions shown in current session
3. Apply probability weights based on score (lower scores = higher probability)
4. Random selection with weighted distribution

### AI Integration

**Gemini API** (`ai_service.py`):
- Uses Gemini 2.5 Flash model
- Explanations cached in Firestore (`question.explanation`)
- Hints cached in Firestore (`question.hint`)
- Case study context automatically injected for relevant questions
- Smart prompting to avoid answer letter references

**Case Studies**:
- Stored in GCS bucket as markdown files
- Mapped via `CASE_STUDY_MAPPING` dict in `ai_service.py`
- Loaded and provided as context when generating AI content
- Accessible via `/case-study/{name}` endpoint

## Important Implementation Details

### Frontend/Backend Communication

- Frontend runs on port 3000, backend on 8000 in local dev
- Frontend uses `NEXT_PUBLIC_API_URL` env var for backend URL
- In production: frontend proxies through `/api` route
- All API requests include Firebase auth token in Authorization header

### Firestore Data Model

**Questions Collection** (`questions`):
- Document ID = question number (string)
- Fields: question_text, answers, tag[], explanation, hint, score, starred, note, active, case_study
- Answers structure: `{ "a": { "answer_text": "...", "status": "correct" }, "b": {...} }`

**Progress Collection** (`progress`):
- Single document per user (using Firebase UID as document ID)
- Fields: total_questions, session_history[], last_session, training_time_minutes

### Firebase Authentication

- Frontend uses Firebase Auth (configuration in `frontend/src/lib/firebase.ts`)
- Backend verifies Firebase ID tokens via `auth_service.py`
- All API endpoints require valid Firebase token (via `verify_token` dependency)

### State Persistence

**What persists** (Zustand → localStorage):
- currentScreen
- sessionStats (for recovery after refresh)
- selectedDomains
- useShuffledQuestions
- selectedMasteryLevels
- currentQuestion
- selectedAnswers

**Session timer**: Restored on page refresh if still in training mode

## Common Pitfalls

1. **Infinite loops in useEffect**: Always check dependency arrays when state setters are involved. Use empty array `[]` for mount-only effects with `eslint-disable-next-line react-hooks/exhaustive-deps`.

2. **Service circular imports**: Backend services can import each other but be careful of circular dependencies. Use late imports inside functions if needed.

3. **Mastery level filtering**: The `get_available_questions_for_tags()` method filters by BOTH tags and mastery levels. Default is all 4 levels selected.

4. **Answer mapping**: When working with shuffled questions, always use `submitShuffledAnswer()` with the original mapping. Never check answers directly against shuffled letters.

5. **Session state**: Questions are tracked per session in `progress_service.current_session_questions`. Clear this set when starting a new session.

6. **Firestore operations**: All question updates should go through `question_service.save_question()` which handles both Firestore and local file sync.

## Code Style Conventions

- Backend: Python with type hints, FastAPI dependency injection patterns
- Frontend: TypeScript strict mode, functional components with hooks
- Use `cn()` helper (from `lib/utils.ts`) for conditional Tailwind classes
- Color coding: Red (mistakes), Gray (learning), Blue (mastered), Green (perfected)
- API responses use snake_case, frontend uses camelCase (conversion in API layer)

## Testing in Local Development

1. Ensure `.env` file exists in `backend/` with `GOOGLE_API_KEY`
2. Run `npm run dev` from project root
3. Frontend auto-proxies API requests to backend
4. Firebase auth works with test accounts
5. Firestore uses project configured in backend service account
