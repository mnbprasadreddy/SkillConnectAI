# ═══════════════════════════════════════════════════════════════
# SkillConnect AI — Recommendation Engine Service
# ═══════════════════════════════════════════════════════════════

from typing import List


def generate_recommendations(
    user_id: int,
    submissions_count: int,
    interviews_count: int,
    accuracy: float,
    weak_topics: List[str],
    skill_level: str,
) -> List[dict]:
    """
    Generate AI-powered recommendations based on user performance.
    """
    recommendations = []

    # ── Skill Level Based ───────────────────────────────────────
    if skill_level == "beginner":
        recommendations.append({
            "type": "general",
            "priority": "high",
            "message": "Start with fundamental data structures: Arrays and Strings.",
            "action": "Focus on Easy problems first to build confidence.",
        })

    # ── Accuracy Based ──────────────────────────────────────────
    if accuracy < 30 and submissions_count > 5:
        recommendations.append({
            "type": "problem",
            "priority": "high",
            "message": "Your accuracy is below 30%. Review your approach before coding.",
            "action": "Practice dry-running solutions on paper before implementation.",
        })
    elif accuracy > 80:
        recommendations.append({
            "type": "problem",
            "priority": "medium",
            "message": "Great accuracy! Challenge yourself with harder problems.",
            "action": "Try Medium and Hard difficulty problems.",
        })

    # ── Weak Topics ─────────────────────────────────────────────
    if weak_topics:
        recommendations.append({
            "type": "topic",
            "priority": "high",
            "message": f"Focus on these weak areas: {', '.join(weak_topics[:5])}",
            "action": "Solve at least 5 problems in each weak topic.",
            "topics": weak_topics[:5],
        })

    # ── Interview Recommendations ───────────────────────────────
    if interviews_count == 0:
        recommendations.append({
            "type": "interview",
            "priority": "medium",
            "message": "You haven't taken any mock interviews yet.",
            "action": "Start with a behavioral interview to get comfortable.",
        })
    elif interviews_count < 5:
        recommendations.append({
            "type": "interview",
            "priority": "medium",
            "message": "Practice more mock interviews to improve your skills.",
            "action": "Try a technical interview next.",
        })

    # ── Consistency ─────────────────────────────────────────────
    if submissions_count < 10:
        recommendations.append({
            "type": "general",
            "priority": "high",
            "message": "Consistency is key. Solve problems daily.",
            "action": "Set a goal to solve at least 1 problem per day.",
        })

    return recommendations
