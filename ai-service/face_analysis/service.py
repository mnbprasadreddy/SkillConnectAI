# ═══════════════════════════════════════════════════════════════
# SkillConnect AI — Face Analysis Service
# Uses MediaPipe Face Mesh for landmark detection
# ═══════════════════════════════════════════════════════════════

import cv2
import numpy as np
import mediapipe as mp
from utils.helpers import clamp

# Initialize MediaPipe Face Mesh
mp_face_mesh = mp.solutions.face_mesh


def analyze_face(image: np.ndarray) -> dict:
    """
    Analyze face from image frame.
    Returns face direction, eye contact, posture score, head tilt.
    """
    result = {
        "face_detected": False,
        "face_direction": None,
        "eye_contact": None,
        "eye_contact_score": None,
        "posture_score": None,
        "head_tilt": None,
        "movement_detected": None,
    }

    with mp_face_mesh.FaceMesh(
        static_image_mode=True,
        max_num_faces=1,
        refine_landmarks=True,
        min_detection_confidence=0.5,
    ) as face_mesh:

        # Convert BGR to RGB
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = face_mesh.process(rgb_image)

        if not results.multi_face_landmarks:
            return result

        result["face_detected"] = True
        landmarks = results.multi_face_landmarks[0]
        h, w, _ = image.shape

        # ── Face Direction ──────────────────────────────────────
        nose_tip = landmarks.landmark[1]
        left_ear = landmarks.landmark[234]
        right_ear = landmarks.landmark[454]

        nose_x = nose_tip.x
        ear_midpoint_x = (left_ear.x + right_ear.x) / 2
        horizontal_offset = nose_x - ear_midpoint_x

        if horizontal_offset > 0.03:
            result["face_direction"] = "right"
        elif horizontal_offset < -0.03:
            result["face_direction"] = "left"
        else:
            # Check vertical
            forehead = landmarks.landmark[10]
            chin = landmarks.landmark[152]
            vertical_ratio = (nose_tip.y - forehead.y) / (chin.y - forehead.y + 0.001)

            if vertical_ratio < 0.35:
                result["face_direction"] = "up"
            elif vertical_ratio > 0.65:
                result["face_direction"] = "down"
            else:
                result["face_direction"] = "center"

        # ── Eye Contact ─────────────────────────────────────────
        # Use iris landmarks (468-477 for refined landmarks)
        left_iris_center = landmarks.landmark[468]
        right_iris_center = landmarks.landmark[473]
        left_eye_inner = landmarks.landmark[133]
        left_eye_outer = landmarks.landmark[33]
        right_eye_inner = landmarks.landmark[362]
        right_eye_outer = landmarks.landmark[263]

        # Calculate gaze direction (simplified)
        left_eye_width = abs(left_eye_outer.x - left_eye_inner.x)
        left_iris_pos = (left_iris_center.x - left_eye_outer.x) / (left_eye_width + 0.001)

        right_eye_width = abs(right_eye_inner.x - right_eye_outer.x)
        right_iris_pos = (right_iris_center.x - right_eye_outer.x) / (right_eye_width + 0.001)

        avg_gaze = (left_iris_pos + right_iris_pos) / 2
        is_looking_center = 0.3 < avg_gaze < 0.7

        result["eye_contact"] = is_looking_center and result["face_direction"] == "center"
        # Score: 100 when perfectly centered, decreasing as gaze moves away
        gaze_deviation = abs(avg_gaze - 0.5) * 2
        result["eye_contact_score"] = clamp((1 - gaze_deviation) * 100)

        # ── Head Tilt (Posture Indicator) ───────────────────────
        left_ear_y = left_ear.y
        right_ear_y = right_ear.y
        tilt_angle = np.degrees(np.arctan2(right_ear_y - left_ear_y, right_ear.x - left_ear.x))
        result["head_tilt"] = round(tilt_angle, 2)

        # Posture score: penalize excessive tilt
        tilt_penalty = min(abs(tilt_angle), 30) / 30 * 40
        direction_penalty = 0 if result["face_direction"] == "center" else 20
        result["posture_score"] = clamp(100 - tilt_penalty - direction_penalty)

        result["movement_detected"] = False  # Single frame analysis

    return result
