# GCP Guru - Flashcard Learning Application

## Project Overview
GCP Guru is a web-based flashcard learning application designed to help prepare for the Google Cloud Professional Cloud Architect certification exam. The app provides an interactive, adaptive learning experience with AI-generated explanations and comprehensive progress tracking.

## Project Details
- **Project Name**: gcp-guru
- **Type**: Web Application (MVP)
- **Target Users**: GCP certification candidates
- **Question Set**: 310 total questions (MVP starts with 5 test questions)
- **Development Environment**: Windows 11, Python 3.12.9, Cursor IDE

## Technical Stack

### Backend
- **Framework**: FastAPI (Python)
- **Data Storage**: JSON files (questions-test.json in /data directory)
- **LLM Integration**: Google Gemini 2.5 Flash Lite
- **Environment**: .env file with GOOGLE_API_KEY
- **Documentation Access**: Local GCP documentation directory for context

### Frontend
- **Type**: Modern web application
- **Requirements**: Cross-platform compatibility (Windows/Mac)
- **Design**: Simple, modern interface with dark/light mode toggle
- **Animations**: Smooth feedback for correct/wrong answers

## Core Features

### 1. Question Practice System
- Display random questions with multiple choice answers
- Support single and multiple correct answer questions
- Immediate feedback (correct/incorrect) after answer submission
- AI-generated explanations for each answer (cached after first generation)
- Optional hints available on request

### 2. Adaptive Learning Algorithm
- **Scoring System**: 
  - Initial score: 0
  - Correct answer: +1 (max 4)
  - Incorrect answer: -1 (min -1)
  - Higher scores = less frequent appearance
  - Lower scores = more frequent appearance

### 3. Progress Tracking
- Session analytics: questions exercised, performance metrics
- Overall progress: fully ready questions, weak questions, unanswered questions
- Tag-based progress tracking across exam domains
- Streak system (Duolingo-style) for motivation

### 4. Question Management
- Star questions for later review
- Add personal notes to questions
- Visual indicators for starred/noted questions
- Search functionality through question text
- Tag-based filtering for targeted practice

### 5. Session Management
- **Start Screen Options**:
  1. Start training session → select field(s) or all questions
  2. My progress → analytics dashboard
  3. Questions → browse/manage all questions
- Flexible session ending with performance summary
- Progress persistence across sessions

## Question Data Structure
```json
{
  "question_number": 1,
  "question_text": "Question content...",
  "answers": {
    "a": {"answer_text": "Option A", "status": "correct/incorrect"},
    "b": {"answer_text": "Option B", "status": "correct/incorrect"},
    "c": {"answer_text": "Option C", "status": "correct/incorrect"},
    "d": {"answer_text": "Option D", "status": "correct/incorrect"}
  },
  "tag": ["compute", "networking"],
  "explanation": "",
  "hint": "",
  "score": 0,
  "starred": false,
  "note": "",
  "placeholder_1": "",
  "placeholder_2": "",
  "placeholder_3": ""
}
```

## Exam Tags (GCP Domains)
- **compute**: Compute Engine, autoscaling, instance groups, GKE
- **storage**: Cloud Storage, databases, data management
- **networking**: VPC, load balancing, connectivity, firewall
- **security**: IAM, encryption, compliance, access control
- **monitoring**: Cloud Logging, Cloud Monitoring, alerting, troubleshooting
- **migration**: Moving workloads to cloud, hybrid architectures
- **case-study**: Questions referencing official case studies
- **cost-optimization**: Billing, cost management, resource efficiency
- **data-analytics**: BigQuery, data processing, analytics tools
- **devops**: CI/CD, deployment, development practices

## User Experience Requirements

### Interface Design
- Clean, modern, minimalist design
- Responsive layout for different screen sizes
- Dark/light mode toggle
- Intuitive navigation and clear visual hierarchy

### Interactions
- Keyboard shortcuts for power users
- Smooth animations for answer feedback
- Loading states for AI-generated content
- Confirmation dialogs for destructive actions (reset progress)

### Accessibility
- Clear visual feedback for correct/incorrect answers
- Readable typography and appropriate contrast
- Logical tab order for keyboard navigation

## Development Phases

### Phase 1: MVP Core (Current Focus)
- Basic question display and answering
- Simple scoring system
- AI explanation generation (Gemini integration)
- Basic progress tracking
- 5 test questions (questions-test.json)

### Phase 2: Enhanced Features
- Complete question set (310 questions)
- Advanced analytics dashboard
- Tag-based filtering and targeted practice
- Search functionality
- Keyboard shortcuts

### Phase 3: Polish & Optimization
- Enhanced animations and transitions
- Performance optimizations
- Advanced progress visualization
- Export/import functionality

## File Structure
```
gcp-guru/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── models/              # Data models
│   ├── routers/             # API routes
│   ├── services/            # Business logic
│   └── utils/               # Helper functions
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
├── data/
│   └── questions-test.json  # MVP question set
├── docs/                    # GCP documentation for AI context
├── .env                     # Environment variables
├── requirements.txt         # Python dependencies
└── README.md
```

## API Endpoints (Planned)
- `GET /api/questions` - Retrieve questions (with filtering)
- `POST /api/questions/{id}/answer` - Submit answer and get feedback
- `GET /api/questions/{id}/hint` - Get AI-generated hint
- `GET /api/questions/{id}/explanation` - Get AI-generated explanation
- `GET /api/progress` - Get user progress and analytics
- `POST /api/questions/{id}/star` - Toggle star status
- `POST /api/questions/{id}/note` - Add/update note
- `POST /api/progress/reset` - Reset all progress

## Environment Setup
- Python 3.12.9
- FastAPI for backend API
- Modern frontend framework (React/Vue)
- Google Gemini API integration
- Local development server setup
- Environment variable management (.env)

## Key Technical Considerations
- **AI Integration**: Cache explanations and hints after first generation
- **Performance**: Efficient question loading and filtering
- **State Management**: Maintain session state and progress persistence
- **Error Handling**: Graceful handling of API failures and network issues
- **Security**: Protect API keys and validate user inputs

## Success Metrics
- Smooth question answering flow
- Accurate progress tracking
- Responsive AI explanation generation
- Intuitive user interface
- Cross-platform compatibility
- Fast loading times and smooth animations

## Getting Started
1. Set up Python environment with FastAPI
2. Configure Gemini API access with environment variables
3. Create basic web interface for question display
4. Implement core answering and scoring logic
5. Add AI explanation generation
6. Integrate progress tracking and analytics

This application aims to provide an effective, engaging study tool that adapts to the user's learning progress and provides intelligent assistance through AI-generated content.