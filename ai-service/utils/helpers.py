# ═══════════════════════════════════════════════════════════════
# SkillConnect AI — AI Service Helper Utilities
# ═══════════════════════════════════════════════════════════════

import base64
import io
import numpy as np
from PIL import Image


def decode_base64_image(image_base64: str) -> np.ndarray:
    """Decode a base64-encoded image string to a numpy array (OpenCV format)."""
    # Remove data URL prefix if present
    if "," in image_base64:
        image_base64 = image_base64.split(",")[1]

    image_bytes = base64.b64decode(image_base64)
    image = Image.open(io.BytesIO(image_bytes))
    image_array = np.array(image)

    # Convert RGB to BGR for OpenCV
    if len(image_array.shape) == 3 and image_array.shape[2] == 3:
        import cv2
        image_array = cv2.cvtColor(image_array, cv2.COLOR_RGB2BGR)

    return image_array


def decode_base64_audio(audio_base64: str, sample_rate: int = 16000) -> np.ndarray:
    """Decode a base64-encoded audio string to a numpy array."""
    if "," in audio_base64:
        audio_base64 = audio_base64.split(",")[1]

    audio_bytes = base64.b64decode(audio_base64)
    audio_array = np.frombuffer(audio_bytes, dtype=np.float32)
    return audio_array


def clamp(value: float, min_val: float = 0.0, max_val: float = 100.0) -> float:
    """Clamp a value between min and max."""
    return max(min_val, min(max_val, value))
