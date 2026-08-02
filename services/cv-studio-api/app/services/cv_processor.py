"""
CV & ID Photo Processor — Dedicated Local AI Microservice Engine
Powered by Local ONNX Neural Network (u2net / rembg) + Precision Suit Compositor.
"""

import io
import os
import logging
from typing import Tuple, Optional, Dict, Any
from pathlib import Path
from PIL import Image, ImageOps, ImageEnhance, ImageFilter
import numpy as np

try:
    import cv2
    HAS_CV2 = True
except ImportError:
    HAS_CV2 = False

try:
    from rembg import remove, new_session
    try:
        REMBG_SESSION = new_session("u2netp")
    except Exception:
        REMBG_SESSION = None
    HAS_REMBG = True
except ImportError:
    HAS_REMBG = False
    REMBG_SESSION = None

logger = logging.getLogger(__name__)

# Asset Directories
SUITS_DIR = Path(__file__).resolve().parent.parent / "assets" / "suits"

# Standard Output Dimensions (300 DPI)
STANDARDS = {
    "4x6": (472, 709),      # 4x6 cm (Standard CV / Job application)
    "3x4": (354, 472),      # 3x4 cm (Student ID / License)
    "2x2": (600, 600),      # 2x2 inch (Passport / Visa)
}

# Mapping template IDs to transparent suit overlays
SUIT_FILES: Dict[str, Dict[str, Any]] = {
    "men-suit-blue": {
        "suit": "men_black_suit.png",
        "default_bg": "#0072C6",
        "suit_y_ratio": 0.44,
        "suit_scale": 1.05,
    },
    "men-suit-white": {
        "suit": "men_black_suit.png",
        "default_bg": "#FFFFFF",
        "suit_y_ratio": 0.44,
        "suit_scale": 1.05,
    },
    "men-suit-navy": {
        "suit": "men_black_suit.png",
        "default_bg": "#0072C6",
        "suit_y_ratio": 0.44,
        "suit_scale": 1.05,
    },
    "women-blazer-collar": {
        "suit": "women_black_blazer.png",
        "default_bg": "#0072C6",
        "suit_y_ratio": 0.46,
        "suit_scale": 1.02,
    },
    "women-suit-tie": {
        "suit": "women_black_blazer.png",
        "default_bg": "#0072C6",
        "suit_y_ratio": 0.46,
        "suit_scale": 1.02,
    },
    "doctor-s1": {
        "suit": "doctor_white_coat.png",
        "default_bg": "#0072C6",
        "suit_y_ratio": 0.43,
        "suit_scale": 1.04,
    },
    "doctor-s2": {
        "suit": "doctor_white_coat.png",
        "default_bg": "#0072C6",
        "suit_y_ratio": 0.43,
        "suit_scale": 1.04,
    },
    "doctor-scrubs": {
        "suit": "doctor_white_coat.png",
        "default_bg": "#0072C6",
        "suit_y_ratio": 0.43,
        "suit_scale": 1.04,
    },
    "teacher-uniform": {
        "suit": "men_black_suit.png",
        "default_bg": "#0072C6",
        "suit_y_ratio": 0.44,
        "suit_scale": 1.05,
    },
    "khmer-traditional-lace": {
        "suit": "women_black_blazer.png",
        "default_bg": "#0072C6",
        "suit_y_ratio": 0.46,
        "suit_scale": 1.02,
    },
    "khmer-silk-gold": {
        "suit": "women_black_blazer.png",
        "default_bg": "#0072C6",
        "suit_y_ratio": 0.46,
        "suit_scale": 1.02,
    },
    "profile-pro-male": {
        "suit": "men_black_suit.png",
        "default_bg": "#0072C6",
        "suit_y_ratio": 0.44,
        "suit_scale": 1.05,
    },
    "profile-pro-female": {
        "suit": "women_black_blazer.png",
        "default_bg": "#0072C6",
        "suit_y_ratio": 0.46,
        "suit_scale": 1.02,
    },
    "restore-id-vintage": {
        "suit": "men_black_suit.png",
        "default_bg": "#0072C6",
        "suit_y_ratio": 0.44,
        "suit_scale": 1.05,
    },
    "couple-traditional": {
        "suit": "women_black_blazer.png",
        "default_bg": "#0072C6",
        "suit_y_ratio": 0.46,
        "suit_scale": 1.02,
    },
}

TEMPLATE_FILES = {k: v["suit"] for k, v in SUIT_FILES.items()}


def hex_to_rgb(hex_str: str) -> Tuple[int, int, int]:
    """Convert hex color '#0072C6' to RGB tuple."""
    hex_str = hex_str.lstrip("#")
    if len(hex_str) == 3:
        hex_str = "".join([c * 2 for c in hex_str])
    if len(hex_str) != 6:
        return (0, 114, 198)  # Cambodian Blue
    return tuple(int(hex_str[i : i + 2], 16) for i in (0, 2, 4))  # type: ignore


def detect_face(cv_bgr: np.ndarray) -> Optional[Tuple[int, int, int, int]]:
    """Detect face bounding box (x, y, w, h) using OpenCV."""
    if not HAS_CV2:
        return None

    try:
        gray = cv2.cvtColor(cv_bgr, cv2.COLOR_BGR2GRAY)
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
        faces = face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.08,
            minNeighbors=4,
            minSize=(int(cv_bgr.shape[1] * 0.12), int(cv_bgr.shape[0] * 0.12)),
        )

        if len(faces) > 0:
            faces = sorted(faces, key=lambda f: f[2] * f[3], reverse=True)
            fx, fy, fw, fh = faces[0]
            return (int(fx), int(fy), int(fw), int(fh))
    except Exception as e:
        logger.warning(f"Face detection failed: {e}")

    return None


def extract_head_with_local_ai(input_pil: Image.Image) -> Image.Image:
    """Uses local ONNX neural network to extract head & hair cleanly with alpha channel."""
    if HAS_REMBG:
        try:
            if REMBG_SESSION:
                cutout = remove(input_pil, session=REMBG_SESSION)
            else:
                cutout = remove(input_pil)
            return cutout.convert("RGBA")
        except Exception as e:
            logger.warning(f"Local AI rembg failed, falling back: {e}")

    # Fallback to OpenCV Grabcut
    if HAS_CV2:
        try:
            img_rgb = input_pil.convert("RGB")
            w, h = img_rgb.size
            user_np = np.array(img_rgb)
            mask = np.zeros(user_np.shape[:2], np.uint8)
            bgdModel = np.zeros((1, 65), np.float64)
            fgdModel = np.zeros((1, 65), np.float64)
            rect = (int(w * 0.05), int(h * 0.05), int(w * 0.90), int(h * 0.90))
            cv2.grabCut(user_np, mask, rect, bgdModel, fgdModel, 3, cv2.GC_INIT_WITH_RECT)
            mask2 = np.where((mask == 2) | (mask == 0), 0, 1).astype('uint8')
            mask2 = cv2.GaussianBlur(mask2 * 255, (5, 5), 0)
            
            rgba = input_pil.convert("RGBA")
            rgba.putalpha(Image.fromarray(mask2))
            return rgba
        except Exception as e:
            logger.warning(f"GrabCut fallback failed: {e}")

    return input_pil.convert("RGBA")


def process_cv_photo(
    image_bytes: bytes,
    template_id: str = "men-suit-blue",
    bg_color_hex: Optional[str] = None,
    size_standard: str = "4x6",
    brightness: float = 1.0,
    contrast: float = 1.0,
) -> bytes:
    """
    100% Local AI Pipeline:
    1. Removes background from user selfie using local ONNX neural network.
    2. Detects face center and scales portrait into standard ID canvas.
    3. Fills solid studio background (#0072C6 / #FFFFFF).
    4. Overlays high-resolution formal suit template cleanly over neck.
    5. Exports 300 DPI high-resolution JPEG.
    """
    input_img = Image.open(io.BytesIO(image_bytes))
    input_img = ImageOps.exif_transpose(input_img)

    target_w, target_h = STANDARDS.get(size_standard, STANDARDS["4x6"])
    suit_config = SUIT_FILES.get(template_id, SUIT_FILES["men-suit-blue"])

    final_bg_hex = bg_color_hex or suit_config.get("default_bg", "#0072C6")
    bg_rgb = hex_to_rgb(final_bg_hex)

    # 1. Local AI Neural Cutout
    user_cutout = extract_head_with_local_ai(input_img)

    # 2. Detect face in cutout to properly align portrait height
    cutout_rgb = user_cutout.convert("RGB")
    cv_bgr = cv2.cvtColor(np.array(cutout_rgb), cv2.COLOR_RGB2BGR) if HAS_CV2 else None
    face_box = detect_face(cv_bgr) if cv_bgr is not None else None

    uw, uh = user_cutout.size

    if face_box:
        fx, fy, fw, fh = face_box
        face_cx = fx + fw // 2
        face_cy = fy + fh // 2

        crop_top = max(0, fy - int(fh * 0.65))
        crop_bottom = min(uh, fy + int(fh * 2.10))
        crop_h = crop_bottom - crop_top
        crop_w = int(crop_h * (target_w / target_h))

        crop_left = max(0, face_cx - crop_w // 2)
        crop_right = min(uw, crop_left + crop_w)
        if crop_right - crop_left < crop_w:
            crop_left = max(0, crop_right - crop_w)

        user_framed = user_cutout.crop((crop_left, crop_top, crop_right, crop_bottom))
    else:
        user_framed = user_cutout

    # Scale framed user to canvas dimensions
    user_scaled = ImageOps.fit(user_framed, (target_w, target_h), Image.Resampling.LANCZOS)

    # 3. Create Studio Background Canvas
    canvas = Image.new("RGBA", (target_w, target_h), (*bg_rgb, 255))
    canvas.paste(user_scaled, (0, 0), mask=user_scaled.split()[3])

    # 4. Overlay High-Resolution Suit Template
    suit_filename = suit_config.get("suit", "men_black_suit.png")
    suit_path = SUITS_DIR / suit_filename

    if suit_path.exists():
        suit_img = Image.open(suit_path).convert("RGBA")

        # Scale suit width to fit canvas
        scale = suit_config.get("suit_scale", 1.05)
        suit_w = int(target_w * scale)
        aspect = suit_img.width / suit_img.height
        suit_h = int(suit_w / aspect)
        suit_resized = suit_img.resize((suit_w, suit_h), Image.Resampling.LANCZOS)

        # Position suit collar over the user's neck
        suit_y = int(target_h * suit_config.get("suit_y_ratio", 0.44))
        suit_x = (target_w - suit_w) // 2

        # Paste suit overlay over user
        canvas.paste(suit_resized, (suit_x, suit_y), mask=suit_resized)

    # 5. Brightness & Contrast Polish
    final_pil = canvas.convert("RGB")
    if brightness != 1.0:
        final_pil = ImageEnhance.Brightness(final_pil).enhance(brightness)
    if contrast != 1.0:
        final_pil = ImageEnhance.Contrast(final_pil).enhance(contrast)

    # 6. Save 300 DPI Output
    out_io = io.BytesIO()
    final_pil.save(out_io, format="JPEG", quality=96, dpi=(300, 300))
    return out_io.getvalue()
