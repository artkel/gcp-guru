from datetime import datetime, date, timedelta
from typing import List, Dict
import json
import os
from models.progress import SessionStats, TagProgress, OverallProgress, UserProgress, DailySessionHistory
from services.question_service import question_service
from services.gcs_service import download_json_from_gcs, upload_json_to_gcs, blob_exists

class ProgressService:
    def __init__(self):
        self.current_session = SessionStats(session_start=datetime.now())
        self.session_history: List[SessionStats] = []
        self.daily_history: List[DailySessionHistory] = []
        self.history_blob_name = 'session_history.json'
        # Track questions shown in current session to prevent repetition
        self.current_session_questions: set[int] = set()
        # Track current session tags for last session display
        self.current_session_tags: set[str] = set()
        self.load_session_history()

    def load_session_history(self):
        """Load session history from GCS bucket with local fallback"""
        # Try loading from GCS first
        try:
            if blob_exists(self.history_blob_name):
                data = download_json_from_gcs(self.history_blob_name)
                if data:
                    self._parse_session_history_data(data, "GCS")
                    return
                else:
                    print("No session history data found in GCS")
            else:
                print(f"Session history file not found in GCS: {self.history_blob_name}")
        except Exception as e:
            print(f"Error loading session history from GCS: {e}")

        # Fallback to local file
        self._load_session_history_from_local_file()

    def _load_session_history_from_local_file(self):
        """Load session history from local JSON file as fallback"""
        local_path = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'session_history.json')
        try:
            if os.path.exists(local_path):
                with open(local_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                self._parse_session_history_data(data, "local file")
            else:
                print(f"Local session history file not found: {local_path}")
                self.daily_history = []
        except Exception as e:
            print(f"Error loading session history from local file: {e}")
            self.daily_history = []

    def _parse_session_history_data(self, data, source):
        """Parse session history data from JSON"""
        try:
            # Convert date strings back to date objects and add missing fields for backward compatibility
            for item in data:
                if isinstance(item['date'], str):
                    item['date'] = date.fromisoformat(item['date'])
                # Add missing fields with defaults for backward compatibility
                if 'duration_minutes' not in item:
                    item['duration_minutes'] = 0.0
                if 'tags' not in item:
                    item['tags'] = []
            self.daily_history = [DailySessionHistory(**item) for item in data]
            print(f"Loaded {len(self.daily_history)} session history entries from {source}")
        except Exception as e:
            print(f"Error parsing session history data from {source}: {e}")
            self.daily_history = []

    def save_session_history(self):
        """Save session history to GCS bucket with local fallback."""
        try:
            data = [item.dict() for item in self.daily_history]
            for item in data:
                item['date'] = item['date'].isoformat()

            # Try to upload to GCS
            gcs_success = upload_json_to_gcs(data, self.history_blob_name)

            if gcs_success:
                print(f"Successfully saved {len(self.daily_history)} session history entries to GCS")
            else:
                # Fallback to saving locally
                print("GCS upload failed, falling back to local save.")
                local_path = os.path.join(os.path.dirname(__file__), '..', '..', 'data', self.history_blob_name)
                with open(local_path, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2)
                print(f"Successfully saved session history to local file: {local_path}")

        except Exception as e:
            print(f"Error saving session history: {e}")

    def start_new_session(self):
        """Start a new learning session"""
        print(f"DEBUG: Starting new session. Current session questions before reset: {self.current_session_questions}")
        if self.current_session.total_questions > 0:
            # Save current session to daily history
            self.save_current_session_to_daily()

            # Save current session to history
            self.current_session.session_end = datetime.now()
            self.session_history.append(self.current_session)

        # Start new session
        self.current_session = SessionStats(session_start=datetime.now())
        # Reset session question tracking
        self.current_session_questions = set()
        # Reset session tags tracking
        self.current_session_tags = set()
        print(f"DEBUG: New session started. Session questions after reset: {self.current_session_questions}")

    def save_current_session_to_daily(self):
        """Save current session data to daily history"""
        if self.current_session.total_questions == 0:
            return

        today = date.today()

        # Find existing entry for today
        existing_entry = None
        for entry in self.daily_history:
            if entry.date == today:
                existing_entry = entry
                break

        # Calculate session duration
        session_duration = (datetime.now() - self.current_session.session_start).total_seconds() / 60

        if existing_entry:
            # Add to existing entry (accumulate daily total)
            existing_entry.total_questions += self.current_session.total_questions
            existing_entry.correct_answers += self.current_session.correct_answers
            existing_entry.incorrect_answers += self.current_session.incorrect_answers
            existing_entry.duration_minutes += session_duration
            # Merge tags from this session
            existing_entry.tags = list(set(existing_entry.tags + list(self.current_session_tags)))
            if existing_entry.total_questions > 0:
                existing_entry.accuracy = (existing_entry.correct_answers / existing_entry.total_questions) * 100
        else:
            # Create new entry
            new_entry = DailySessionHistory(
                date=today,
                total_questions=self.current_session.total_questions,
                correct_answers=self.current_session.correct_answers,
                incorrect_answers=self.current_session.incorrect_answers,
                accuracy=self.current_session.accuracy,
                duration_minutes=session_duration,
                tags=list(self.current_session_tags)
            )
            self.daily_history.append(new_entry)

        # Keep only last 30 days
        cutoff_date = today - timedelta(days=30)
        self.daily_history = [entry for entry in self.daily_history if entry.date >= cutoff_date]

        # Sort by date
        self.daily_history.sort(key=lambda x: x.date)

        # Save to file
        self.save_session_history()

    def record_answer(self, is_correct: bool):
        """Record an answer in the current session"""
        self.current_session.total_questions += 1

        if is_correct:
            self.current_session.correct_answers += 1
        else:
            self.current_session.incorrect_answers += 1

        # Update accuracy
        if self.current_session.total_questions > 0:
            self.current_session.accuracy = (
                self.current_session.correct_answers / self.current_session.total_questions
            ) * 100

        # Don't update daily history on every answer - only when session ends

    def record_skip(self, question_id: int):
        """Record that a question was skipped - mark as seen but don't affect stats"""
        self.add_question_to_session(question_id)
        # Don't increment any stats - skipped questions don't count toward totals

    def add_question_to_session(self, question_id: int):
        """Track that a question has been shown in current session"""
        self.current_session_questions.add(question_id)
        # Also track tags from this question
        question = question_service.get_question_by_id(question_id)
        if question:
            self.current_session_tags.update(question.tag)

    def is_question_shown_in_session(self, question_id: int) -> bool:
        """Check if question has already been shown in current session"""
        return question_id in self.current_session_questions

    def get_available_questions_for_tags(self, tags: List[str] = None) -> List:
        """Get all unseen and active questions for the current session, filtered by tags."""
        from services.question_service import question_service
        all_questions = question_service.get_all_questions()

        if tags:
            filtered_questions = [q for q in all_questions if any(tag in q.tag for tag in tags)]
        else:
            filtered_questions = all_questions

        # The weighting logic in get_random_question will naturally prioritize lower-scored questions.
        # This just needs to return all possible candidates for the session.
        available_questions = [
            q for q in filtered_questions
            if not self.is_question_shown_in_session(q.question_number) and q.active
        ]
        return available_questions

    def are_all_questions_mastered_for_tags(self, tags: List[str] = None) -> bool:
        """Check if all active questions for given tags are mastered (score >= 4)"""
        from services.question_service import question_service

        # Get all questions matching tags
        all_questions = question_service.get_all_questions()

        # Filter by tags if provided
        if tags:
            filtered_questions = [q for q in all_questions if any(tag in q.tag for tag in tags)]
        else:
            filtered_questions = all_questions

        # Only consider active questions
        active_questions = [q for q in filtered_questions if q.active]

        # If no active questions match the tags, consider it as "not mastered"
        if not active_questions:
            return False

        # Check if ALL active questions for these tags have score >= 4
        return all(q.score >= 4 for q in active_questions)

    def get_tag_progress(self) -> List[TagProgress]:
        """Calculate progress for each tag/domain with new categories (only active questions)"""
        tag_stats = {}
        questions = question_service.get_all_questions()

        # Only consider active questions
        active_questions = [q for q in questions if q.active]

        # Initialize tag stats
        for question in active_questions:
            for tag in question.tag:
                if tag not in tag_stats:
                    tag_stats[tag] = {
                        'total': 0,
                        'mistakes': 0,      # score -1
                        'learning': 0,      # score 0-1
                        'mastered': 0,      # score 2-3
                        'perfected': 0      # score 4+
                    }

        # Count questions per tag by category
        for question in active_questions:
            for tag in question.tag:
                tag_stats[tag]['total'] += 1

                score = question.score
                if score == -1:
                    tag_stats[tag]['mistakes'] += 1
                elif 0 <= score <= 1:
                    tag_stats[tag]['learning'] += 1
                elif 2 <= score <= 3:
                    tag_stats[tag]['mastered'] += 1
                elif score >= 4:
                    tag_stats[tag]['perfected'] += 1

        # Convert to TagProgress objects
        progress_list = []
        for tag, stats in tag_stats.items():
            total = stats['total']
            mastered_total = stats['mastered'] + stats['perfected']
            mastery_percentage = (mastered_total / total * 100) if total > 0 else 0

            progress_list.append(TagProgress(
                tag=tag,
                total_questions=stats['total'],
                mistakes_count=stats['mistakes'],
                learning_count=stats['learning'],
                mastered_count=stats['mastered'],
                perfected_count=stats['perfected'],
                mastery_percentage=mastery_percentage
            ))

        return sorted(progress_list, key=lambda x: x.tag)

    def get_overall_progress(self) -> OverallProgress:
        """Calculate overall learning progress with new categories (only active questions)"""
        questions = question_service.get_all_questions()

        # Only consider active questions
        active_questions = [q for q in questions if q.active]
        total_questions = len(active_questions)

        # Count questions by new categories
        mistakes_count = len([q for q in active_questions if q.score == -1])
        learning_count = len([q for q in active_questions if 0 <= q.score <= 1])
        mastered_count = len([q for q in active_questions if 2 <= q.score <= 3])
        perfected_count = len([q for q in active_questions if q.score >= 4])

        starred = len([q for q in active_questions if q.starred])
        with_notes = len([q for q in active_questions if q.note.strip()])

        # Calculate total training time from session history
        total_training_time = sum(session.duration_minutes for session in self.daily_history)

        tag_progress = self.get_tag_progress()

        return OverallProgress(
            total_questions=total_questions,
            mistakes_count=mistakes_count,
            learning_count=learning_count,
            mastered_count=mastered_count,
            perfected_count=perfected_count,
            starred_questions=starred,
            questions_with_notes=with_notes,
            total_training_time_minutes=total_training_time,
            tag_progress=tag_progress
        )

    def get_user_progress(self) -> UserProgress:
        """Get complete user progress data"""
        overall = self.get_overall_progress()

        # Calculate streak (simplified - could be enhanced with actual date tracking)
        streak_days = 1 if self.current_session.total_questions > 0 else 0

        # Get last session data
        last_session = self.daily_history[-1] if self.daily_history else None

        return UserProgress(
            current_session=self.current_session,
            last_session=last_session,
            overall=overall,
            streak_days=streak_days,
            session_history=self.daily_history
        )

    def reset_all_progress(self):
        """Reset all progress data (only active questions)"""
        # Reset all active question scores, stars, and notes
        questions = question_service.get_all_questions()
        for question in questions:
            if question.active:  # Only reset active questions
                question.score = 0
                question.starred = False
                question.note = ""
                question.explanation = ""
                question.hint = ""

        question_service.save_questions()

        # Reset session data
        self.current_session = SessionStats(session_start=datetime.now())
        self.session_history = []
        self.daily_history = []
        self.save_session_history()

    def reset_selective_progress(self, options: dict):
        """Reset selected progress data based on options (only active questions)"""
        questions = question_service.get_all_questions()
        questions_modified = False

        for question in questions:
            if question.active:  # Only reset active questions
                # Reset scores to 0 if requested
                if options.get('scores', False):
                    question.score = 0
                    questions_modified = True

                # Remove stars if requested
                if options.get('stars', False):
                    question.starred = False
                    questions_modified = True

                # Remove notes if requested
                if options.get('notes', False):
                    question.note = ""
                    questions_modified = True

        # Save questions if any were modified
        if questions_modified:
            question_service.save_questions()

        # Reset session history if requested
        if options.get('sessionHistory', False):
            self.daily_history = []
            self.save_session_history()

        # Reset training time (part of session history) if requested
        if options.get('trainingTime', False):
            # This is handled by resetting session history since training time is calculated from it
            # If sessionHistory is not being reset but trainingTime is, we need to reset durations
            if not options.get('sessionHistory', False):
                for session in self.daily_history:
                    session.duration_minutes = 0.0
                self.save_session_history()

        # Always reset current session when any reset is performed
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
            "session_duration_minutes": round(
                (datetime.now() - self.current_session.session_start).total_seconds() / 60, 1
            )
        }

# Global instance
progress_service = ProgressService()