# ═══════════════════════════════════════════════════════════════
# SkillConnect AI — Report Generator Service
# Uses Gemini API for AI-powered report generation
# ═══════════════════════════════════════════════════════════════

import json
from typing import Optional
from utils.config import GEMINI_API_KEY


def generate_report(
    interview_type: str,
    difficulty: str,
    score: Optional[float],
    confidence_score: Optional[float],
    communication_score: Optional[float],
    technical_score: Optional[float],
    transcript: Optional[str],
    analytics: Optional[dict],
) -> dict:
    """Generate an AI-powered interview report using Gemini API."""

    # Try Gemini API
    if GEMINI_API_KEY:
        try:
            return _generate_with_gemini(
                interview_type, difficulty, score,
                confidence_score, communication_score, technical_score,
                transcript, analytics,
            )
        except Exception:
            pass

    # Fallback to rule-based report
    return _generate_basic_report(
        interview_type, difficulty, score,
        confidence_score, communication_score, technical_score,
        analytics,
    )


def _generate_with_gemini(
    interview_type, difficulty, score,
    confidence_score, communication_score, technical_score,
    transcript, analytics,
) -> dict:
    """Use Gemini API for report generation."""
    import google.generativeai as genai

    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-1.5-flash")

    prompt = f"""You are an expert interview coach. Generate a detailed interview performance report.

Interview Details:
- Type: {interview_type}
- Difficulty: {difficulty}
- Overall Score: {score or 'N/A'}/100
- Confidence Score: {confidence_score or 'N/A'}/100
- Communication Score: {communication_score or 'N/A'}/100
- Technical Score: {technical_score or 'N/A'}/100

Analytics Data: {json.dumps(analytics) if analytics else 'N/A'}

Transcript excerpt: {(transcript[:1000] if transcript else 'N/A')}

Generate a JSON response with exactly these fields:
- "strengths": A paragraph highlighting the candidate's strengths
- "weaknesses": A paragraph identifying areas for improvement
- "recommendations": Specific actionable advice for improvement
- "summary": A 2-3 sentence overall summary

Return ONLY valid JSON."""

    response = model.generate_content(prompt)
    text = response.text.strip()

    # Clean markdown code blocks if present
    if text.startswith("```"):
        text = text.split("\n", 1)[1]
        text = text.rsplit("```", 1)[0]

    return json.loads(text)


def _generate_basic_report(
    interview_type, difficulty, score,
    confidence_score, communication_score, technical_score,
    analytics,
) -> dict:
    """Fallback rule-based report generation."""
    strengths = []
    weaknesses = []

    if score and score >= 70:
        strengths.append("Achieved a strong overall performance score")
    elif score and score < 50:
        weaknesses.append("Overall score needs improvement")

    if confidence_score and confidence_score >= 70:
        strengths.append("Demonstrated good confidence throughout the interview")
    elif confidence_score and confidence_score < 50:
        weaknesses.append("Work on building confidence — practice mock interviews regularly")

    if communication_score and communication_score >= 70:
        strengths.append("Clear and effective communication")
    elif communication_score and communication_score < 50:
        weaknesses.append("Communication skills need work — practice articulating thoughts clearly")

    if technical_score and technical_score >= 70:
        strengths.append("Solid technical knowledge demonstrated")
    elif technical_score and technical_score < 50:
        weaknesses.append("Strengthen technical fundamentals through consistent practice")

    if analytics:
        if analytics.get("eye_contact_score", 0) >= 70:
            strengths.append("Good eye contact maintained")
        if analytics.get("nervousness_score", 0) > 60:
            weaknesses.append("Signs of nervousness detected — try deep breathing exercises")

    return {
        "strengths": ". ".join(strengths) + "." if strengths else "Interview completed.",
        "weaknesses": ". ".join(weaknesses) + "." if weaknesses else "No major weaknesses.",
        "recommendations": "Continue practicing regularly. Focus on weak areas and aim for consistency.",
        "summary": f"Completed a {difficulty} {interview_type} interview with a score of {score or 'N/A'}/100.",
    }
