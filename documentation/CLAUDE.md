# GCP Guru - Flashcard Learning Application

## Project Overview
This document outlines the design and features of GCP Guru, a web-based flashcard learning application designed to help users prepare for the Google Cloud Professional Cloud Architect certification exam. The app provides an interactive, adaptive learning experience with AI-generated explanations and comprehensive progress tracking.

## Project Details
- **Project Name**: gcp-guru
- **Type**: Web Application
- **Target Users**: GCP certification candidates
- **Question Set**: ~300 questions

## Technical Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: **Google Firestore** for questions, progress, and all transactional data.
- **Static Storage**: **Google Cloud Storage** for case study markdown files.
- **LLM Integration**: Google **Gemini 2.5 Flash**.
- **Secret Management**: **Google Secret Manager** for API keys in production. A local `.env` file is used for development.

### Frontend
- **Framework**: Next.js (React)
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI (headless) and custom components.
- **State Management**: Zustand with localStorage persistence for seamless sessions.

### CI/CD
- **Deployment Pipeline**: **Google Cloud Build** for fully automated builds, testing, and deployment to Cloud Run.

## Core Features

### 1. Question Practice System
- Displays random questions with multiple choice answers.
- Supports both single and multiple correct answer questions.
- Provides immediate visual feedback (correct/incorrect) after answer submission.
- Caches AI-generated explanations and hints in Firestore after the first generation.

### 2. Case Study Integration
- Questions related to official GCP case studies are tagged accordingly.
- Users can click a badge on the question to view the full text of the case study in a modal or new window.
- The AI assistant receives the case study text along with the question to provide highly contextual explanations.

### 3. Adaptive Learning Algorithm
- **Scoring System**: 
  - Initial score: 0
  - Correct answer: +1 (max 4)
  - Incorrect answer: -1 (min -1)
  - Higher-scored questions appear less frequently.

### 4. Progress Tracking
- **Dashboard**: Detailed analytics on performance by category (Mistakes, Learning, Mastered, Perfected).
- **Session History**: An interactive chart visualizes performance over the last 30 days.
- **Tag-based progress**: Tracks performance across all major GCP domains.

### 5. Question & Session Management
- Star questions for later review.
- Add personal notes to questions.
- Filter training sessions by one or more GCP domains.
- Sessions can be ended at any time, with progress saved.

## Question Data Structure
```json
{
  "question_number": 1,
  "question_text": "Question content...",
  "answers": {
    "a": {"answer_text": "Option A", "status": "correct"},
    "b": {"answer_text": "Option B", "status": "incorrect"}
  },
  "tag": ["compute", "networking"],
  "case_study": "Mountkirk Games", // Optional: Name of the case study
  "explanation": "",
  "hint": "",
  "score": 0,
  "starred": false,
  "note": ""
}
```

## Exam Tags (GCP Domains)
- compute
- storage
- networking
- security
- monitoring
- migration
- case-study
- cost-optimization
- data-analytics
- devops

## API Endpoints
- `GET /api/questions/random` - Retrieve a random question, with optional `?tags=` filter.
- `POST /api/questions/{id}/answer` - Submit an answer and get feedback.
- `GET /api/questions/{id}/hint` - Get an AI-generated hint.
- `GET /api/questions/{id}/explanation` - Get an AI-generated explanation.
- `GET /api/case-study/{name}` - Get the content of a specific case study.
- `GET /api/progress` - Get user progress and analytics.
- `POST /api/questions/{id}/star` - Toggle star status.
- `POST /api/questions/{id}/note` - Add/update a note.
- `POST /api/progress/reset` - Reset user progress data.
- `POST /api/progress/session/start` - Starts a new session, saving the previous one.

## Key Technical Considerations
- **AI Integration**: The system prepends case study text to prompts for relevant questions to improve the quality of AI-generated explanations.
- **Performance**: Explanations and hints are cached in Firestore documents to reduce API calls and improve speed.
- **State Management**: Frontend state is persisted in `localStorage` to allow users to refresh the page without losing their session.
- **Deployment**: The application is automatically deployed to Google Cloud Run via a Cloud Build pipeline, triggered by a push to the main branch.
