import os
import google.generativeai as genai
from typing import Optional
from models.question import Question
from dotenv import load_dotenv

class AIService:
    def __init__(self):
        # Load environment variables from parent directory
        env_path = os.path.join(os.path.dirname(__file__), '..', '..', '.env')
        load_dotenv(env_path)

        # Configure Gemini API
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError("GOOGLE_API_KEY environment variable not set")

        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-2.5-flash-lite')

    def generate_explanation(self, question: Question, selected_answers: list, correct_answers: list, force_regenerate: bool = False) -> str:
        """Generate an explanation for why the answer is correct/incorrect"""

        # If explanation is already cached and not forcing regeneration, return it
        if question.explanation and not force_regenerate:
            return question.explanation

        answers_text = ""
        for key, answer in question.answers.items():
            status = "✓ CORRECT" if key in correct_answers else "✗ INCORRECT"
            answers_text += f"{key.upper()}) {answer.answer_text} [{status}]\n"

        selected_text = ", ".join([f"{ans.upper()}" for ans in selected_answers])
        correct_text = ", ".join([f"{ans.upper()}" for ans in correct_answers])

        # Add variation for regenerated explanations
        variation_prompt = ""
        if force_regenerate:
            variation_prompt = "Please provide a DIFFERENT explanation approach than before, focusing on alternative aspects of the topic. "

        prompt = f"""
You are an expert Google Cloud Platform (GCP) instructor helping students prepare for the GCP Professional Cloud Architect certification exam.

Question: {question.question_text}

Answer Options:
{answers_text}

Student selected: {selected_text}
Correct answer(s): {correct_text}

{variation_prompt}Please provide a CONCISE explanation that:
1. Explains why the correct answer is right in 1-2 sentences
2. Briefly mentions why other options are incorrect
3. Includes relevant GCP service names and key concepts
4. Uses markdown formatting for emphasis (**bold**, *italic*)
5. Maximum 3 sentences total

Focus on the core concept and avoid lengthy explanations. Be direct and to the point.
"""

        try:
            response = self.model.generate_content(prompt)
            explanation = response.text.strip()

            # Cache the explanation only if not forcing regeneration
            if not force_regenerate:
                question.explanation = explanation

            return explanation

        except Exception as e:
            print(f"Error generating explanation: {e}")
            return "Unable to generate explanation at this time. Please try again later."

    def generate_hint(self, question: Question) -> str:
        """Generate a helpful hint without giving away the answer"""

        # If hint is already cached, return it
        if question.hint:
            return question.hint

        prompt = f"""
You are a helpful GCP exam coach. Provide a subtle hint for this question without revealing the answer directly.

Question: {question.question_text}

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

            # Cache the hint
            question.hint = hint
            return hint

        except Exception as e:
            print(f"Error generating hint: {e}")
            return "Think about which GCP service would best address the specific requirements mentioned in the question."

# Global instance
ai_service = AIService()