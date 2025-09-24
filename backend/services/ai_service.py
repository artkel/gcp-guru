import os
import google.generativeai as genai
from typing import Optional
from models.question import Question
from dotenv import load_dotenv

class AIService:
    CASE_STUDY_MAPPING = {
        "TerramEarth": "terramearth.md",
        "Mountkirk Games": "mountkirk_games.md",
        "EHR Healthcare": "ehr_healthcare.md",
        "Helicopter Racing League": "hrl.md",
    }
    IRRELEVANT_CASE_STUDIES = ["Dress4win", "JencoMart"]

    def __init__(self):
        # Try multiple paths to load environment variables
        possible_env_paths = [
            os.path.join(os.path.dirname(__file__), '..', '..', '.env'),
            os.path.join(os.getcwd(), '.env'),
            os.path.join(os.getcwd(), '..', '.env'),
            os.path.join(os.path.dirname(__file__), '..', '.env'), # For backend/.env
        ]

        for env_path in possible_env_paths:
            if os.path.exists(env_path):
                load_dotenv(env_path)
                break
        
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError("GOOGLE_API_KEY environment variable not set")

        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-1.5-flash')

    def _load_case_study_content(self, case_study_name: str) -> str:
        """Load case study content from a markdown file."""
        filename = self.CASE_STUDY_MAPPING.get(case_study_name)
        if not filename:
            return ""

        # Build path relative to this file's location
        file_path = os.path.join(os.path.dirname(__file__), '..', '..', 'documentation', filename)
        
        if os.path.exists(file_path):
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    return f.read()
            except Exception as e:
                print(f"Error reading case study file {filename}: {e}")
        else:
            print(f"Case study file not found at {file_path}")
            
        return ""

    def generate_explanation(self, question: Question, selected_answers: list, correct_answers: list, force_regenerate: bool = False) -> str:
        """Generate an explanation for why the answer is correct/incorrect."""
        if question.explanation and not force_regenerate:
            return question.explanation

        answers_text = ""
        for key, answer in question.answers.items():
            status = "✓ CORRECT" if key in correct_answers else "✗ INCORRECT"
            answers_text += f"{key.upper()}) {answer.answer_text} [{status}]\n"

        selected_text = ", ".join(f"{ans.upper()}" for ans in selected_answers)
        correct_text = ", ".join(f"{ans.upper()}" for ans in correct_answers)

        case_study_name = getattr(question, 'case_study', None)
        
        # Determine which prompt to use
        if case_study_name and case_study_name in self.CASE_STUDY_MAPPING:
            case_study_content = self._load_case_study_content(case_study_name)
            case_study_file = self.CASE_STUDY_MAPPING.get(case_study_name, "")
            
            # Prepend case study material to the prompt
            base_prompt = f"""
            You are an expert Google Cloud Platform (GCP) instructor helping students prepare for the GCP Professional Cloud Architect certification exam. Please review the relevant case study material from `{case_study_file}` before answering.

            **Case Study:** {case_study_name}

            **Question:** {question.question_text}

            **Answer Options:**
            {answers_text}

            **Student selected:** {selected_text}
            **Correct answer(s):** {correct_text}

            Please provide a CONCISE explanation that teaches the core concept. Your explanation must follow this structure:
            1.  State the correct answer and the core reason it is right.
            2.  Briefly explain why the other options are incorrect.
            3.  Include relevant GCP service names and key concepts, using markdown for emphasis (**bold**, *italic*).

            The entire explanation must be a maximum of 5 sentences total. Be direct and to the point.
            """
            prompt = f"{case_study_content}\n\n---\n\n{base_prompt}"

        else:
            # Standard prompt for non-case-study questions
            prompt = f"""
            You are an expert Google Cloud Platform (GCP) instructor helping students prepare for the GCP Professional Cloud Architect certification exam.

            **Question:** {question.question_text}

            **Answer Options:**
            {answers_text}

            **Student selected:** {selected_text}
            **Correct answer(s):** {correct_text}

            Please provide a CONCISE explanation that teaches the core concept. Your explanation must follow this structure:
            1.  State the correct answer and the core reason it is right.
            2.  Briefly explain why the other options are incorrect.
            3.  Include relevant GCP service names and key concepts, using markdown for emphasis (**bold**, *italic*).

            The entire explanation must be a maximum of 5 sentences total. Be direct and to the point.
            """

        try:
            response = self.model.generate_content(prompt)
            explanation = response.text.strip()
            # Caching handled by the caller in question_service
            return explanation
        except Exception as e:
            print(f"Error generating explanation: {e}")
            return "Unable to generate explanation at this time. Please try again later."

    def generate_hint(self, question: Question) -> str:
        """Generate a helpful hint without giving away the answer."""
        if question.hint:
            return question.hint

        # Check if this is a case study question
        case_study_name = getattr(question, 'case_study', None)

        if case_study_name and case_study_name in self.CASE_STUDY_MAPPING:
            # Load case study content
            case_study_content = self._load_case_study_content(case_study_name)
            case_study_file = self.CASE_STUDY_MAPPING.get(case_study_name, "")

            prompt = f"""
You are a helpful GCP exam coach. Please review the relevant case study material from `{case_study_file}` before providing a hint.

**Case Study:** {case_study_name}

{case_study_content}

---

**Question:** {question.question_text}

Provide a subtle hint for this question without revealing the answer directly. Your hint should:
1. Point toward the correct GCP concept or service relevant to this case study
2. NOT directly state the answer
3. Help the student think through the problem in the context of the case study requirements
4. Be 1-2 sentences maximum
5. Focus on key keywords or concepts from the case study they should consider

Provide just the hint, nothing else.
"""
        else:
            # Standard hint prompt for non-case-study questions
            prompt = f"""
You are a helpful GCP exam coach. Provide a subtle hint for this question without revealing the answer directly.

**Question:** {question.question_text}

The hint should:
1. Point toward the correct GCP concept or service
2. NOT directly state the answer
3. Help the student think through the problem
4. Be 1-2 sentences maximum
5. Focus on key keywords or concepts they should consider

Provide just the hint, nothing else.
"""
        try:
            response = self.model.generate_content(prompt)
            hint = response.text.strip()
            # Caching handled by the caller in question_service
            return hint
        except Exception as e:
            print(f"Error generating hint: {e}")
            return "Think about which GCP service would best address the specific requirements mentioned in the question."

# Global instance - lazy loaded
ai_service_instance = None

def get_ai_service():
    global ai_service_instance
    if ai_service_instance is None:
        ai_service_instance = AIService()
    return ai_service_instance
