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
        self.model = genai.GenerativeModel('gemini-2.5-flash') # do not change this model - gemini-2.5-flash!

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

        # Build answer options with status but without letters
        answers_text = ""
        for key, answer in question.answers.items():
            status = "✓ CORRECT" if key in correct_answers else "✗ INCORRECT"
            answers_text += f"- {answer.answer_text} [{status}]\n"

        # Get actual text content of selected and correct answers
        selected_text = ""
        correct_text = ""

        for key, answer in question.answers.items():
            if key in selected_answers:
                selected_text = answer.answer_text if not selected_text else f"{selected_text}, {answer.answer_text}"
            if key in correct_answers:
                correct_text = answer.answer_text if not correct_text else f"{correct_text}, {answer.answer_text}"

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

            Please provide a CONCISE explanation that teaches the core concept, utilizing the context of the case study. Your explanation MUST be structured into three distinct paragraphs:

            1.  **First Paragraph:** Identify the correct answer using a brief, unique descriptive phrase (e.g., "The **App Engine/Cloud Endpoints** option") and state the core GCP reason it is the optimal solution, explicitly referencing relevant constraints or goals from the case study. Include relevant GCP service names and key concepts, using markdown for emphasis (**bold**, *italic*).

            2.  **Second Paragraph:** Briefly explain the flaw in *all incorrect options*, contrasting them with the correct solution's intent. Include relevant GCP service names and key concepts, using markdown for emphasis (**bold**, *italic*).

            3.  **Third Paragraph:** State the core learning concept of the question. This paragraph must be a maximum of 15 words.

            The entire explanation must be a maximum of 5 sentences total across all three paragraphs. Use fewer sentences if possible. In exceptional cases where clarity demands it, a maximum of 6 sentences is permissible. Be direct and to the point.
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

            Please provide a CONCISE explanation that teaches the core concept. Your explanation MUST be structured into three distinct paragraphs:

            1.  **First Paragraph:** Identify the correct answer using a brief, unique descriptive phrase (e.g., "The **Transfer Appliance** option") and state the core GCP reason it is the optimal solution. Include relevant GCP service names and key concepts, using markdown for emphasis (**bold**, *italic*).

            2.  **Second Paragraph:** Briefly explain the flaw in *all incorrect options*, contrasting them with the correct solution's intent. Include relevant GCP service names and key concepts, using markdown for emphasis (**bold**, *italic*).

            3.  **Third Paragraph:** State the core learning concept of the question. This paragraph must be a maximum of 15 words.

            The entire explanation must be a maximum of 5 sentences total across all three paragraphs. Use fewer sentences if possible. In exceptional cases where clarity demands it, a maximum of 6 sentences is permissible. Be direct and to the point.
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
            2. NOT directly state the answer or reference specific answer options
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
            2. NOT directly state the answer or reference specific answer options
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
