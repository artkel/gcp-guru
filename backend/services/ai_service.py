import os
import google.generativeai as genai
from typing import Optional
from models.question import Question
from dotenv import load_dotenv

def _get_api_key_from_secret_manager() -> Optional[str]:
    """Fetches the Gemini API key from Google Secret Manager."""
    try:
        from google.cloud import secretmanager
        client = secretmanager.SecretManagerServiceClient()
        project_id = os.environ.get("GCP_PROJECT") or "gcp-guru-473011"
        secret_id = "gemini-api-key"
        name = f"projects/{project_id}/secrets/{secret_id}/versions/latest"
        response = client.access_secret_version(request={"name": name})
        return response.payload.data.decode("UTF-8")
    except Exception as e:
        print(f"Could not fetch API key from Secret Manager: {e}")
        return None

class AIService:
    CASE_STUDY_MAPPING = {
        "TerramEarth": "terramearth.md",
        "Mountkirk Games": "mountkirk_games.md",
        "EHR Healthcare": "ehr_healthcare.md",
        "Helicopter Racing League": "hrl.md",
    }
    IRRELEVANT_CASE_STUDIES = ["Dress4win", "JencoMart"]

    def __init__(self):
        api_key = _get_api_key_from_secret_manager()

        if not api_key:
            print("Falling back to .env file for API key.")
            load_dotenv()
            api_key = os.getenv("GOOGLE_API_KEY")

        if not api_key:
            raise ValueError("GOOGLE_API_KEY not found in Secret Manager or .env file.")

        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-2.5-flash')

    def _load_case_study_content(self, case_study_name: str) -> str:
        """Load case study content from GCS (production) or local files (dev)."""
        filename = self.CASE_STUDY_MAPPING.get(case_study_name)
        if not filename:
            return ""

        # Import here to avoid circular imports
        from .gcs_service import load_from_gcs

        # Check if we're in production (GCS) or development (local files)
        if os.environ.get("GCS_BUCKET_NAME"):
            # Production: Load from GCS
            try:
                content = load_from_gcs(filename)
                if content:
                    return content
                else:
                    print(f"Case study file {filename} not found in GCS")
            except Exception as e:
                print(f"Error reading case study file {filename} from GCS: {e}")
        else:
            # Development: Load from local files
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
            answers_text += f"- {answer.answer_text} [{status}]\n"

        selected_text = ", ".join([question.answers[key].answer_text for key in selected_answers if key in question.answers])
        correct_text = ", ".join([question.answers[key].answer_text for key in correct_answers if key in question.answers])

        case_study_name = getattr(question, 'case_study', None)
        prompt = self._build_prompt(question, answers_text, selected_text, correct_text, case_study_name, is_hint=False)

        try:
            response = self.model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            print(f"Error generating explanation: {e}")
            return "Unable to generate explanation at this time. Please try again later."

    def generate_hint(self, question: Question) -> str:
        """Generate a helpful hint without giving away the answer."""
        if question.hint:
            return question.hint

        case_study_name = getattr(question, 'case_study', None)
        prompt = self._build_prompt(question, "", "", "", case_study_name, is_hint=True)

        try:
            response = self.model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            print(f"Error generating hint: {e}")
            return "Think about which GCP service would best address the specific requirements mentioned in the question."

    def _build_prompt(self, question: Question, answers_text: str, selected_text: str, correct_text: str, case_study_name: Optional[str], is_hint: bool) -> str:
        """Builds the prompt for the generative model."""
        case_study_content = ""
        if case_study_name and case_study_name in self.CASE_STUDY_MAPPING:
            case_study_content = self._load_case_study_content(case_study_name)

        if is_hint:
            return self._build_hint_prompt(question.question_text, case_study_name, case_study_content)
        else:
            return self._build_explanation_prompt(question.question_text, answers_text, selected_text, correct_text, case_study_name, case_study_content)

    def _build_explanation_prompt(self, question_text, answers_text, selected_text, correct_text, case_study_name, case_study_content):
        header = "You are an expert Google Cloud Platform (GCP) instructor helping students prepare for the GCP Professional Cloud Architect certification exam."
        structure_definition = """
        Please provide a CONCISE explanation that teaches the core concept. Your explanation MUST be structured into three distinct paragraphs:

        1.  **First Paragraph:** Identify the correct answer using a brief, unique descriptive phrase (e.g., "The **App Engine/Cloud Endpoints** option") and state the core GCP reason it is the optimal solution. Include relevant GCP service names and key concepts, using markdown for emphasis (**bold**, *italic*).

        2.  **Second Paragraph:** Briefly explain the flaw in *all incorrect options*, contrasting them with the correct solution's intent. Include relevant GCP service names and key concepts, using markdown for emphasis (**bold**, *italic*).

        3.  **Third Paragraph:** State the core learning concept of the question. This paragraph must be a maximum of 15 words.

        The entire explanation must be a maximum of 5 sentences total across all three paragraphs. Use fewer sentences if possible. In exceptional cases where clarity demands it, a maximum of 6 sentences is permissible. Be direct and to the point.
        """
        if case_study_content:
            header += f" Please review the relevant case study material before answering."
            return f"{header}\n\n**Case Study:** {case_study_name}\n\n{case_study_content}\n\n---\n\n**Question:** {question_text}\n\n**Answer Options:**\n{answers_text}\n**Student selected:** {selected_text}\n**Correct answer(s):** {correct_text}\n\n{structure_definition}"
        else:
            return f"{header}\n\n**Question:** {question_text}\n\n**Answer Options:**\n{answers_text}\n**Student selected:** {selected_text}\n**Correct answer(s):** {correct_text}\n\n{structure_definition}"

    def _build_hint_prompt(self, question_text, case_study_name, case_study_content):
        header = "You are a helpful GCP exam coach."
        structure_definition = """
        Provide a subtle hint for this question without revealing the answer directly. Your hint should:
        1. Point toward the correct GCP concept or service
        2. NOT directly state the answer or reference specific answer options
        3. Help the student think through the problem
        4. Be 1-2 sentences maximum
        5. Focus on key keywords or concepts they should consider

        Provide just the hint, nothing else.
        """
        if case_study_content:
            header += " Please review the relevant case study material before providing a hint."
            return f"{header}\n\n**Case Study:** {case_study_name}\n\n{case_study_content}\n\n---\n\n**Question:** {question_text}\n\n{structure_definition}"
        else:
            return f"{header}\n\n**Question:** {question_text}\n\n{structure_definition}"

# Global instance - lazy loaded
ai_service_instance = None

def get_ai_service():
    global ai_service_instance
    if ai_service_instance is None:
        ai_service_instance = AIService()
    return ai_service_instance
