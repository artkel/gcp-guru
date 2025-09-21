# GCP Guru - Next.js Frontend

A modern, interactive flashcard learning application built with Next.js for GCP Professional Cloud Architect certification exam preparation.

## Features

### ✨ Modern UI/UX
- **Clean, minimalist design** with professional aesthetics
- **Dark/Light theme toggle** with system preference detection
- **Responsive design** that works on all devices
- **Smooth animations** and transitions for enhanced user experience
- **Glass morphism effects** and modern visual elements

### 🎯 Core Functionality
- **Training Sessions** with adaptive question selection
- **Domain-based filtering** for targeted practice
- **Real-time session tracking** with timer and statistics
- **Progress analytics** with detailed performance metrics
- **Question management** with search, filtering, and sorting
- **AI-powered explanations** and hints (via Gemini API)
- **Note-taking and starring** system for personalized study

### 🚀 Technical Features
- **TypeScript** for type safety
- **Zustand** for state management
- **SWR** for efficient data fetching and caching
- **Tailwind CSS** with custom design system
- **Radix UI** components for accessibility
- **Error boundaries** for graceful error handling
- **Performance optimizations** with Next.js features

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Backend API running on http://localhost:8000

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm start
```

## Testing the Application

### 1. Backend Setup Required
**IMPORTANT**: The frontend requires the backend API to be running on `http://localhost:8000`

Start the backend first:
```bash
cd ../backend
source venv/bin/activate  # Activate virtual environment
uvicorn main:app --reload
```

### 2. Frontend Testing Steps

#### **Start Screen Testing**
1. ✅ **Theme Toggle**: Click the theme toggle button (moon/sun icon) in the header
   - Should switch between light and dark themes
   - Theme preference should persist across page reloads

2. ✅ **Navigation**: Test all three main menu options
   - "Start Training Session" → Should navigate to domain selection
   - "My Progress" → Should show progress dashboard
   - "Browse Questions" → Should show question browser

#### **Domain Selection Testing**
1. ✅ **Tag Loading**: Tags should load from backend API
2. ✅ **Selection Logic**:
   - Select "All Questions" → Individual domains should be disabled
   - Uncheck "All Questions" → Individual domains should be selectable
   - Select specific domains → "All Questions" should uncheck automatically
3. ✅ **Start Training**: Button should be enabled only when selections are made

#### **Training Session Testing**
1. ✅ **Question Loading**: Questions should load based on selected domains
2. ✅ **Answer Selection**:
   - Single-answer questions: Only one selection allowed
   - Multiple-answer questions: Multiple selections allowed (up to correct answer count)
3. ✅ **Submit Answer**: Should provide immediate feedback with correct/incorrect indicators
4. ✅ **Session Stats**: Real-time updates of questions answered, accuracy, and timer
5. ✅ **Action Buttons**:
   - **Hint** (💡): Should show AI-generated hint in modal
   - **Star** (⭐): Should toggle question star status (filled/unfilled)
   - **Note** (📝): Should open note modal for adding personal notes
6. ✅ **Get Explanation**: After answering, should show AI-generated explanation
7. ✅ **Next Question**: Should load a new question
8. ✅ **Session End**:
   - Manual end via "End Session" button
   - Automatic end when no more questions available (shows session complete modal)

#### **Progress Dashboard Testing**
1. ✅ **Last Session Display**: Should show most recent session statistics
2. ✅ **Overall Progress**: Should display progress categories (Mistakes, Learning, Mastered, Perfected)
3. ✅ **Topic Progress Table**: Should show detailed breakdown by GCP domains
4. ✅ **Data Management**:
   - "Reset All Progress" → Should show confirmation modal
   - "Clear All Explanations" → Should clear cached AI explanations
   - "Clear All Hints" → Should clear cached AI hints

#### **Browse Questions Testing**
1. ✅ **Question List**: Should display all questions with metadata
2. ✅ **Search Functionality**: Search input should filter questions by text
3. ✅ **Filters**:
   - **Topic Filter**: Dropdown should filter by GCP domains
   - **Starred Only**: Checkbox should show only starred questions
   - **Sort Options**: Should sort by question number or score
4. ✅ **Question Details**: Click any question to view full details in modal
5. ✅ **Visual Indicators**:
   - ⭐ for starred questions
   - 📝 for questions with notes
   - Score display for progress tracking

### 3. Error Handling Testing

#### **Network Errors**
1. ✅ **API Unavailable**: Stop backend and test - should show appropriate error messages
2. ✅ **Session Complete**: When no more questions available, should show session complete modal
3. ✅ **Failed Requests**: Should gracefully handle failed API calls

#### **UI Error Boundaries**
1. ✅ **Component Errors**: Any unexpected errors should be caught by error boundary
2. ✅ **Development Mode**: Error details should be visible in development

### 4. Performance Testing

#### **Loading States**
1. ✅ **Global Loading**: Full-screen overlay for major operations
2. ✅ **Component Loading**: Spinners for individual components
3. ✅ **SWR Caching**: Subsequent API calls should be faster due to caching

#### **Responsive Design**
1. ✅ **Mobile Devices**: Test on mobile viewport (responsive breakpoints)
2. ✅ **Tablet Devices**: Test on tablet viewport
3. ✅ **Desktop**: Test on various desktop resolutions

### 5. Accessibility Testing

1. ✅ **Keyboard Navigation**: Tab through all interactive elements
2. ✅ **Screen Reader**: All buttons and inputs should have proper labels
3. ✅ **Color Contrast**: Both light and dark themes should meet accessibility standards
4. ✅ **Focus Indicators**: All focusable elements should have visible focus states

## Common Issues & Solutions

### 1. **Backend Connection Error**
```
Error: Network error
```
**Solution**: Ensure backend is running on http://localhost:8000
```bash
cd ../backend && uvicorn main:app --reload
```

### 2. **Theme Not Persisting**
**Solution**: Check browser's localStorage permissions and clear storage if needed

### 3. **Build Errors**
**Solution**: Run type checking first:
```bash
npm run type-check
```

### 4. **Slow Loading**
**Solution**: Check network tab for API response times. Backend might need optimization.

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Project Structure

```
src/
├── app/                 # Next.js app router
├── components/
│   ├── ui/              # Reusable UI components
│   ├── screens/         # Main screen components
│   ├── providers/       # Context providers
│   └── layout/          # Layout components
├── lib/
│   ├── api.ts           # API client
│   ├── store.ts         # Zustand store
│   └── utils.ts         # Utility functions
├── hooks/               # Custom React hooks
└── types/               # TypeScript type definitions
```

## Performance Optimizations

1. **Next.js optimizations**: Static generation, image optimization, bundle splitting
2. **SWR caching**: Automatic background revalidation and caching
3. **Component lazy loading**: Dynamic imports for large components
4. **Debounced search**: Prevents excessive API calls during search
5. **Error boundaries**: Prevents app crashes and provides fallbacks

---

**🎉 Congratulations!** You now have a fully functional, modern Next.js frontend for GCP Guru that provides an excellent user experience for cloud certification exam preparation.