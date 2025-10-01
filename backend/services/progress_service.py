import json
import os
from datetime import datetime, date, timedelta
from typing import List, Dict
from models.progress import SessionStats, TagProgress, OverallProgress, UserProgress, DailySessionHistory, IndividualSession
from services.question_service import question_service
from services.firestore_service import get_document, set_document

class ProgressService:
    def __init__(self):
        self.current_session = SessionStats(session_start=datetime.now())
        self.daily_history: List[DailySessionHistory] = []
        self.individual_sessions: List[IndividualSession] = []
        
        self.daily_history_collection = "progress"
        self.daily_history_doc_id = "daily_history"
        self.individual_sessions_collection = "progress"
        self.individual_sessions_doc_id = "individual_sessions"

        # Local file paths for development
        self.daily_history_file = "data/daily_session_history.json"
        self.individual_sessions_file = "data/individual_sessions.json"

        # Track questions shown in current session to prevent repetition
        self.current_session_questions: set[int] = set()
        # Track current session tags for last session display
        self.current_session_tags: set[str] = set()
        
        self.load_session_history()
        self.load_individual_sessions()

    def load_session_history(self):
        """Load daily session history from Firestore or local file."""
        try:
            data_doc = get_document(self.daily_history_collection, self.daily_history_doc_id)
            if data_doc and 'history' in data_doc:
                self._parse_session_history_data(data_doc['history'], "Firestore")
                return
            else:
                print("No session history document found in Firestore. Initializing empty history.")
                self.daily_history = []
                # Create the document in Firestore with empty history
                self._initialize_session_history_document()
                return
        except Exception as e:
            print(f"Error loading session history from Firestore: {e}")

        # Try loading from local file
        try:
            if os.path.exists(self.daily_history_file):
                with open(self.daily_history_file, 'r') as f:
                    data = json.load(f)
                self._parse_session_history_data(data, "local file")
            else:
                print(f"No local session history file found at {self.daily_history_file}")
                self.daily_history = []
        except Exception as e:
            print(f"Error loading session history from local file: {e}")
            self.daily_history = []

    def _initialize_session_history_document(self):
        """Initialize an empty session history document in Firestore."""
        try:
            set_document(self.daily_history_collection, self.daily_history_doc_id, {'history': []})
            print("Initialized empty session history document in Firestore")
        except Exception as e:
            print(f"Error initializing session history document: {e}")

    def _parse_session_history_data(self, data: List[Dict], source: str):
        """Parse session history data from a list of dicts."""
        try:
            parsed_items = []
            for item in data:
                if isinstance(item.get('date'), str):
                    item['date'] = date.fromisoformat(item['date'])
                # Add missing fields with defaults for backward compatibility
                item.setdefault('duration_minutes', 0.0)
                item.setdefault('tags', [])
                parsed_items.append(DailySessionHistory(**item))
            self.daily_history = parsed_items
            print(f"Loaded {len(self.daily_history)} daily history entries from {source}")
        except Exception as e:
            print(f"Error parsing session history data from {source}: {e}")
            self.daily_history = []

    def save_session_history(self):
        """Save the entire daily session history to Firestore or local file."""
        data = [item.dict() for item in self.daily_history]
        for item in data:
            item['date'] = item['date'].isoformat()

        try:
            set_document(self.daily_history_collection, self.daily_history_doc_id, {'history': data})
            print(f"Successfully saved {len(self.daily_history)} daily history entries to Firestore")
            return
        except Exception as e:
            print(f"Error saving session history to Firestore: {e}")

        # Try saving to local file as fallback
        try:
            os.makedirs(os.path.dirname(self.daily_history_file), exist_ok=True)
            with open(self.daily_history_file, 'w') as f:
                json.dump(data, f, indent=2)
            print(f"Successfully saved {len(self.daily_history)} daily history entries to local file")
        except Exception as e:
            print(f"Error saving session history to local file: {e}")

    def load_individual_sessions(self):
        """Load individual session history from Firestore or local file."""
        try:
            data_doc = get_document(self.individual_sessions_collection, self.individual_sessions_doc_id)
            if data_doc and 'sessions' in data_doc:
                self._parse_individual_sessions_data(data_doc['sessions'], "Firestore")
                return
            else:
                print("No individual sessions document found in Firestore. Initializing empty sessions.")
                self.individual_sessions = []
                # Create the document in Firestore with empty sessions
                self._initialize_individual_sessions_document()
                return
        except Exception as e:
            print(f"Error loading individual sessions from Firestore: {e}")

        # Try loading from local file
        try:
            if os.path.exists(self.individual_sessions_file):
                with open(self.individual_sessions_file, 'r') as f:
                    data = json.load(f)
                self._parse_individual_sessions_data(data, "local file")
            else:
                print(f"No local individual sessions file found at {self.individual_sessions_file}")
                self.individual_sessions = []
        except Exception as e:
            print(f"Error loading individual sessions from local file: {e}")
            self.individual_sessions = []

    def _initialize_individual_sessions_document(self):
        """Initialize an empty individual sessions document in Firestore."""
        try:
            set_document(self.individual_sessions_collection, self.individual_sessions_doc_id, {'sessions': []})
            print("Initialized empty individual sessions document in Firestore")
        except Exception as e:
            print(f"Error initializing individual sessions document: {e}")

    def _parse_individual_sessions_data(self, data: List[Dict], source: str):
        """Parse individual sessions data from a list of dicts."""
        try:
            parsed_items = []
            for item in data:
                if isinstance(item.get('session_start'), str):
                    item['session_start'] = datetime.fromisoformat(item['session_start'])
                if isinstance(item.get('session_end'), str):
                    item['session_end'] = datetime.fromisoformat(item['session_end'])
                item.setdefault('tags', [])
                parsed_items.append(IndividualSession(**item))
            self.individual_sessions = parsed_items
            print(f"Loaded {len(self.individual_sessions)} individual sessions from {source}")
        except Exception as e:
            print(f"Error parsing individual sessions data from {source}: {e}")
            self.individual_sessions = []

    def save_individual_sessions(self):
        """Save the entire list of individual sessions to Firestore or local file."""
        data = [item.dict() for item in self.individual_sessions]
        for item in data:
            item['session_start'] = item['session_start'].isoformat()
            item['session_end'] = item['session_end'].isoformat()

        try:
            set_document(self.individual_sessions_collection, self.individual_sessions_doc_id, {'sessions': data})
            print(f"Successfully saved {len(self.individual_sessions)} individual sessions to Firestore")
            return
        except Exception as e:
            print(f"Error saving individual sessions to Firestore: {e}")

        # Try saving to local file as fallback
        try:
            os.makedirs(os.path.dirname(self.individual_sessions_file), exist_ok=True)
            with open(self.individual_sessions_file, 'w') as f:
                json.dump(data, f, indent=2)
            print(f"Successfully saved {len(self.individual_sessions)} individual sessions to local file")
        except Exception as e:
            print(f"Error saving individual sessions to local file: {e}")

    def start_new_session(self, active_duration_minutes=None):
        """Start a new learning session

        Args:
            active_duration_minutes: Optional active time in minutes (excluding paused time).
                                    If None, calculates from session_start to now.
        """
        if self.current_session.total_questions > 0:
            # Calculate session duration once (for both daily history and individual session)
            session_end = datetime.now()
            if active_duration_minutes is not None:
                session_duration = active_duration_minutes
            else:
                session_duration = (session_end - self.current_session.session_start).total_seconds() / 60

            # Save to daily history with the correct duration
            self.save_current_session_to_daily(session_duration)

            # Create individual session record with the same duration
            individual_session = IndividualSession(
                session_start=self.current_session.session_start,
                session_end=session_end,
                total_questions=self.current_session.total_questions,
                correct_answers=self.current_session.correct_answers,
                incorrect_answers=self.current_session.incorrect_answers,
                accuracy=self.current_session.accuracy,
                duration_minutes=session_duration,  # Use the same calculated duration
                tags=list(self.current_session_tags)
            )
            self.individual_sessions.append(individual_session)

            if len(self.individual_sessions) > 50:
                self.individual_sessions = self.individual_sessions[-50:]

            self.save_individual_sessions()

        self.current_session = SessionStats(session_start=datetime.now())
        self.current_session_questions = set()
        self.current_session_tags = set()

    def save_current_session_to_daily(self, session_duration_minutes):
        """Save current session data to daily history

        Args:
            session_duration_minutes: Active session duration in minutes (excluding paused time)
        """
        if self.current_session.total_questions == 0:
            return

        today = date.today()
        existing_entry = next((entry for entry in self.daily_history if entry.date == today), None)

        if existing_entry:
            existing_entry.total_questions += self.current_session.total_questions
            existing_entry.correct_answers += self.current_session.correct_answers
            existing_entry.incorrect_answers += self.current_session.incorrect_answers
            existing_entry.duration_minutes += session_duration_minutes
            existing_entry.tags = list(set(existing_entry.tags + list(self.current_session_tags)))
            if existing_entry.total_questions > 0:
                existing_entry.accuracy = (existing_entry.correct_answers / existing_entry.total_questions) * 100
        else:
            new_entry = DailySessionHistory(
                date=today,
                total_questions=self.current_session.total_questions,
                correct_answers=self.current_session.correct_answers,
                incorrect_answers=self.current_session.incorrect_answers,
                accuracy=self.current_session.accuracy,
                duration_minutes=session_duration_minutes,
                tags=list(self.current_session_tags)
            )
            self.daily_history.append(new_entry)

        cutoff_date = today - timedelta(days=30)
        self.daily_history = [entry for entry in self.daily_history if entry.date >= cutoff_date]
        self.daily_history.sort(key=lambda x: x.date)
        self.save_session_history()

    def record_answer(self, is_correct: bool):
        """Record an answer in the current session"""
        self.current_session.total_questions += 1
        if is_correct:
            self.current_session.correct_answers += 1
        else:
            self.current_session.incorrect_answers += 1
        if self.current_session.total_questions > 0:
            self.current_session.accuracy = (self.current_session.correct_answers / self.current_session.total_questions) * 100

    def record_skip(self, question_id: int):
        """Record that a question was skipped"""
        self.add_question_to_session(question_id)

    def add_question_to_session(self, question_id: int):
        """Track that a question has been shown in current session"""
        self.current_session_questions.add(question_id)
        question = question_service.get_question_by_id(question_id)
        if question:
            self.current_session_tags.update(question.tag)

    def is_question_shown_in_session(self, question_id: int) -> bool:
        """Check if question has already been shown in current session"""
        return question_id in self.current_session_questions

    def get_available_questions_for_tags(self, tags: List[str] = None) -> List:
        """Get all unseen and active questions for the current session, filtered by tags."""
        all_questions = question_service.get_all_questions()
        if tags:
            filtered_questions = []
            starred_included = 'starred' in tags
            regular_tags = [tag for tag in tags if tag != 'starred']

            # Get questions matching regular tags
            if regular_tags:
                tag_filtered_questions = [q for q in all_questions if any(tag in q.tag for tag in regular_tags)]
                filtered_questions.extend(tag_filtered_questions)

            # Get starred questions
            if starred_included:
                starred_questions = [q for q in all_questions if q.starred]
                filtered_questions.extend(starred_questions)

            # Remove duplicates while preserving order
            seen = set()
            unique_filtered_questions = []
            for question in filtered_questions:
                if question.question_number not in seen:
                    seen.add(question.question_number)
                    unique_filtered_questions.append(question)
            filtered_questions = unique_filtered_questions
        else:
            filtered_questions = all_questions
        return [q for q in filtered_questions if not self.is_question_shown_in_session(q.question_number) and q.active]

    def are_all_questions_mastered_for_tags(self, tags: List[str] = None) -> bool:
        """Check if all active questions for given tags are mastered (score >= 4)"""
        all_questions = question_service.get_all_questions()
        if tags:
            filtered_questions = [q for q in all_questions if any(tag in q.tag for tag in tags)]
        else:
            filtered_questions = all_questions
        active_questions = [q for q in filtered_questions if q.active]
        if not active_questions:
            return False
        return all(q.score >= 4 for q in active_questions)

    def get_tag_progress(self) -> List[TagProgress]:
        """Calculate progress for each tag/domain (only active questions)"""
        tag_stats: Dict[str, Dict] = {}
        active_questions = [q for q in question_service.get_all_questions() if q.active]

        for question in active_questions:
            for tag in question.tag:
                if tag not in tag_stats:
                    tag_stats[tag] = {'total': 0, 'mistakes': 0, 'learning': 0, 'mastered': 0, 'perfected': 0}
        
        for question in active_questions:
            for tag in question.tag:
                tag_stats[tag]['total'] += 1
                score = question.score
                if score == -1: tag_stats[tag]['mistakes'] += 1
                elif 0 <= score <= 1: tag_stats[tag]['learning'] += 1
                elif 2 <= score <= 3: tag_stats[tag]['mastered'] += 1
                elif score >= 4: tag_stats[tag]['perfected'] += 1

        progress_list = []
        for tag, stats in tag_stats.items():
            total = stats['total']
            mastered_total = stats['mastered'] + stats['perfected']
            mastery_percentage = (mastered_total / total * 100) if total > 0 else 0
            progress_list.append(TagProgress(tag=tag, total_questions=total, mistakes_count=stats['mistakes'], learning_count=stats['learning'], mastered_count=stats['mastered'], perfected_count=stats['perfected'], mastery_percentage=mastery_percentage))
        
        return sorted(progress_list, key=lambda x: x.tag)

    def get_overall_progress(self) -> OverallProgress:
        """Calculate overall learning progress (only active questions)"""
        active_questions = [q for q in question_service.get_all_questions() if q.active]
        total_questions = len(active_questions)

        mistakes_count = len([q for q in active_questions if q.score == -1])
        learning_count = len([q for q in active_questions if 0 <= q.score <= 1])
        mastered_count = len([q for q in active_questions if 2 <= q.score <= 3])
        perfected_count = len([q for q in active_questions if q.score >= 4])

        total_training_time = sum(session.duration_minutes for session in self.daily_history)

        return OverallProgress(
            total_questions=total_questions,
            mistakes_count=mistakes_count,
            learning_count=learning_count,
            mastered_count=mastered_count,
            perfected_count=perfected_count,
            starred_questions=len([q for q in active_questions if q.starred]),
            questions_with_notes=len([q for q in active_questions if q.note.strip()]),
            total_training_time_minutes=total_training_time,
            tag_progress=self.get_tag_progress()
        )

    def get_user_progress(self) -> UserProgress:
        """Get complete user progress data"""
        last_session = self.individual_sessions[-1] if self.individual_sessions else None
        return UserProgress(
            current_session=self.current_session,
            last_session=last_session,
            overall=self.get_overall_progress(),
            streak_days=1 if self.current_session.total_questions > 0 else 0,
            session_history=self.daily_history
        )

    def reset_all_progress(self):
        """Reset all progress data (only active questions)"""
        for question in question_service.get_all_questions():
            if question.active:
                question.score = 0
                question.starred = False
                question.note = ""
                question.explanation = ""
                question.hint = ""
                question_service.save_question(question)

        self.daily_history = []
        self.individual_sessions = []
        self.save_session_history()
        self.save_individual_sessions()
        self.current_session = SessionStats(session_start=datetime.now())

    def reset_selective_progress(self, options: dict):
        """Reset selected progress data based on options (only active questions)"""
        for question in question_service.get_all_questions():
            if question.active:
                if options.get('scores', False): question.score = 0
                if options.get('stars', False): question.starred = False
                if options.get('notes', False): question.note = ""
                # Save question if it was modified
                if any([options.get('scores'), options.get('stars'), options.get('notes')]):
                    question_service.save_question(question)

        if options.get('sessionHistory', False):
            self.daily_history = []
            self.individual_sessions = []
            self.save_session_history()
            self.save_individual_sessions()
        elif options.get('trainingTime', False):
            for session in self.daily_history:
                session.duration_minutes = 0.0
            self.save_session_history()

        if any(options.values()):
            self.current_session = SessionStats(session_start=datetime.now())
            self.current_session_questions = set()
            self.current_session_tags = set()

    def get_session_summary(self) -> Dict:
        """Get a summary of the current session"""
        return {
            "questions_answered": self.current_session.total_questions,
            "correct_answers": self.current_session.correct_answers,
            "incorrect_answers": self.current_session.incorrect_answers,
            "accuracy_percentage": round(self.current_session.accuracy, 1),
            "session_duration_minutes": round((datetime.now() - self.current_session.session_start).total_seconds() / 60, 1)
        }

# Global instance
progress_service = ProgressService()