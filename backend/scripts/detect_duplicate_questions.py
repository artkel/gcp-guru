# backend/scripts/detect_duplicate_questions.py
"""
Script to detect duplicate questions using semantic similarity.
Uses TF-IDF vectorization and cosine similarity to find near-duplicate questions.

Usage:
python backend/scripts/detect_duplicate_questions.py path/to/questions.json [--threshold 0.85]

Example:
python backend/scripts/detect_duplicate_questions.py data/gcp-pca-questions.json --threshold 0.85
"""

import os
import sys
import json
import argparse
from typing import List, Dict, Tuple
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

def load_questions(file_path: str) -> List[Dict]:
    """Load questions from JSON file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            questions = json.load(f)

        if not isinstance(questions, list):
            print("Error: Questions data must be a list.")
            sys.exit(1)

        return questions
    except FileNotFoundError:
        print(f"Error: File not found: {file_path}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in file: {e}")
        sys.exit(1)

def normalize_text(text: str) -> str:
    """Normalize text for better comparison."""
    # Convert to lowercase and strip extra whitespace
    text = text.lower().strip()
    # Remove multiple spaces
    text = ' '.join(text.split())
    return text

def find_duplicates(questions: List[Dict], threshold: float = 0.85) -> List[Tuple[int, int, float]]:
    """
    Find duplicate questions using TF-IDF and cosine similarity.
    Only checks questions with active=true status.

    Args:
        questions: List of question dictionaries
        threshold: Similarity threshold (0-1). Higher = more strict.

    Returns:
        List of tuples: (question_number_1, question_number_2, similarity_score)
    """
    # Filter to only active questions
    active_questions = [q for q in questions if q.get('active', True)]

    print(f"Total questions in file: {len(questions)}")
    print(f"Active questions to check: {len(active_questions)}")
    print(f"Inactive questions (excluded): {len(questions) - len(active_questions)}\n")

    # Extract and normalize question texts
    question_texts = []
    question_numbers = []

    for q in active_questions:
        question_text = q.get('question_text', '')
        question_number = q.get('question_number')

        if not question_text or question_number is None:
            continue

        question_texts.append(normalize_text(question_text))
        question_numbers.append(question_number)

    print(f"Processing {len(question_texts)} active questions...")

    # Create TF-IDF vectors
    vectorizer = TfidfVectorizer(
        max_features=1000,
        ngram_range=(1, 2),  # Use unigrams and bigrams
        stop_words='english',
        min_df=1
    )

    tfidf_matrix = vectorizer.fit_transform(question_texts)

    # Calculate cosine similarity matrix
    similarity_matrix = cosine_similarity(tfidf_matrix)

    # Find pairs above threshold
    duplicates = []

    for i in range(len(question_numbers)):
        for j in range(i + 1, len(question_numbers)):
            similarity = similarity_matrix[i][j]

            if similarity >= threshold:
                duplicates.append((
                    question_numbers[i],
                    question_numbers[j],
                    float(similarity)
                ))

    # Sort by similarity score (highest first)
    duplicates.sort(key=lambda x: x[2], reverse=True)

    return duplicates

def print_duplicates(duplicates: List[Tuple[int, int, float]], questions: List[Dict]):
    """Print duplicate pairs in a readable format."""
    if not duplicates:
        print("\n✓ No duplicate questions found!")
        return

    print(f"\n⚠️  Found {len(duplicates)} potential duplicate pairs:\n")
    print("=" * 80)

    # Create a lookup dictionary for quick access
    question_lookup = {q['question_number']: q for q in questions if 'question_number' in q}

    for idx, (q1_num, q2_num, similarity) in enumerate(duplicates, 1):
        q1 = question_lookup.get(q1_num, {})
        q2 = question_lookup.get(q2_num, {})

        q1_text = q1.get('question_text', 'N/A')
        q2_text = q2.get('question_text', 'N/A')

        print(f"\n{idx}. Similarity: {similarity:.2%}")
        print(f"   Question #{q1_num}:")
        print(f"   {q1_text[:150]}{'...' if len(q1_text) > 150 else ''}")
        print(f"\n   Question #{q2_num}:")
        print(f"   {q2_text[:150]}{'...' if len(q2_text) > 150 else ''}")
        print("-" * 80)

    print(f"\n📊 Summary:")
    print(f"   Total duplicate pairs found: {len(duplicates)}")
    print(f"   Unique questions involved: {len(set([q for pair in duplicates for q in pair[:2]]))}")

    # Print just the question numbers for easy reference
    print(f"\n📋 Question number pairs:")
    for q1_num, q2_num, similarity in duplicates:
        print(f"   ({q1_num}, {q2_num}) - {similarity:.2%}")

def main():
    parser = argparse.ArgumentParser(
        description='Detect duplicate questions using semantic similarity'
    )
    parser.add_argument(
        'file_path',
        help='Path to JSON file containing questions'
    )
    parser.add_argument(
        '--threshold',
        type=float,
        default=0.85,
        help='Similarity threshold (0-1). Default: 0.85. Higher = more strict.'
    )

    args = parser.parse_args()

    # Validate threshold
    if not 0 <= args.threshold <= 1:
        print("Error: Threshold must be between 0 and 1")
        sys.exit(1)

    print(f"Loading questions from: {args.file_path}")
    print(f"Similarity threshold: {args.threshold:.2%}\n")

    # Load questions
    questions = load_questions(args.file_path)

    # Find duplicates
    duplicates = find_duplicates(questions, args.threshold)

    # Print results
    print_duplicates(duplicates, questions)

if __name__ == "__main__":
    main()
