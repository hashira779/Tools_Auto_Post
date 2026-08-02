"""
CV & ID Photo Processor — Dedicated Local AI Microservice Engine
Powered by Local ONNX Neural Network (u2net / rembg) + Dynamic Collar-to-Chin Alignment.
"""

import io
import os
import logging
from typing import Tuple, Optional, Dict, Any
from pathlib import Path
from PIL import Image, ImageOps, ImageEnhance, ImageFilter
import numpy as np

# We lazy import cv2 and rembg inside the functions that use them 
# to prevent blocking the FastAPI startup on slow servers.

logger = logging.getLogger(__name__)

# Lazy-loaded session
_REMBG_SESSION = None

# Asset Directories
SUITS_DIR = Path(__file__).resolve().parent.parent / "assets" / "suits"

# Standard Output Dimensions (300 DPI)
STANDARDS = {
    "4x6": (472, 709),
    "3x4": (354, 472),
    "2x2": (600, 600),
}

# Mapping template IDs to transparent suit overlays
SUIT_FILES: Dict[str, Dict[str, Any]] = {
    "men-suit-blue": {"suit": "men_black_suit.png", "default_bg": "#0072C6", "suit_scale": 1.15},
    "men-suit-white": {"suit": "men_black_suit.png", "default_bg": "#FFFFFF", "suit_scale": 1.15},
    "men-suit-navy": {"suit": "men_black_suit.png", "default_bg": "#0072C6", "suit_scale": 1.15},
    "women-blazer-collar": {"suit": "women_black_blazer.png", "default_bg": "#0072C6", "suit_scale": 1.12},
    "women-suit-tie": {"suit": "women_black_blazer.png", "default_bg": "#0072C6", "suit_scale": 1.12},
    "doctor-s1": {"suit": "doctor_white_coat.png", "default_bg": "#0072C6", "suit_scale": 1.15},
    "doctor-s2": {"suit": "doctor_white_coat.png", "default_bg": "#0072C6", "suit_scale": 1.15},
    "doctor-scrubs": {"suit": "doctor_white_coat.png", "default_bg": "#0072C6", "suit_scale": 1.15},
    "teacher-uniform": {"suit": "men_black_suit.png", "default_bg": "#0072C6", "suit_scale": 1.15},
    "khmer-traditional-lace": {"suit": "women_black_blazer.png", "default_bg": "#0072C6", "suit_scale": 1.12},
    "khmer-silk-gold": {"suit": "women_black_blazer.png", "default_bg": "#0072C6", "suit_scale": 1.12},
    "profile-pro-male": {"suit": "men_black_suit.png", "default_bg": "#0072C6", "suit_scale": 1.15},
    "profile-pro-female": {"suit": "women_black_blazer.png", "default_bg": "#0072C6", "suit_scale": 1.12},
    "restore-id-vintage": {"suit": "men_black_suit.png", "default_bg": "#0072C6", "suit_scale": 1.15},
    "couple-traditional": {"suit": "women_black_blazer.png", "default_bg": "#0072C6", "suit_scale": 1.12},
}

TEMPLATE_FILES = {k: v["suit"] for k, v in SUIT_FILES.items()}


def hex_to_rgb(hex_str: str) -> Tuple[int, int, int]:
    hex_str = hex_str.lstrip("#")
    if len(hex_str) == 3:
        hex_str = "".join([c * 2 for c in hex_str])
    if len(hex_str) != 6:
        return (0, 114, 198)
    return tuple(int(hex_str[i : i + 2], 16) for i in (0, 2, 4))  # type: ignore


def detect_face(cv_bgr: np.ndarray) -> Optional[Tuple[int, int, int, int]]:
    try:
        import cv2
    except ImportError:
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
    global _REMBG_SESSION
    
    # Attempt local AI first
    try:
        from rembg import remove, new_session
        
        if _REMBG_SESSION is None:
            logger.info("Initializing rembg u2netp local AI model...")
            _REMBG_SESSION = new_session("u2netp")
            
        cutout = remove(input_pil, session=_REMBG_SESSION, post_process_mask=True)
        cutout_rgba = cutout.convert("RGBA")
        
        # Feather the edges of the AI mask
        r, g, b, alpha = cutout_rgba.split()
        alpha = alpha.filter(ImageFilter.GaussianBlur(1.0))
        cutout_rgba.putalpha(alpha)
        
        return cutout_rgba
    except Exception as e:
        logger.warning(f"Local AI rembg failed, falling back to GrabCut: {e}")

    # Fallback with GrabCut
    try:
        import cv2
        img_rgb = input_pil.convert("RGB")
        w, h = img_rgb.size
        user_np = np.array(img_rgb)
        mask = np.zeros(user_np.shape[:2], np.uint8)
        bgdModel = np.zeros((1, 65), np.float64)
        fgdModel = np.zeros((1, 65), np.float64)
        
        rect = (int(w * 0.15), int(h * 0.05), int(w * 0.70), int(h * 0.85))
        cv2.grabCut(user_np, mask, rect, bgdModel, fgdModel, 5, cv2.GC_INIT_WITH_RECT)
        
        mask2 = np.where((mask == 2) | (mask == 0), 0, 255).astype('uint8')
        
        rgba = input_pil.convert("RGBA")
        alpha = Image.fromarray(mask2)
        alpha = alpha.filter(ImageFilter.GaussianBlur(3.0))
        rgba.putalpha(alpha)
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
    from PIL import ImageDraw, ImageChops

    input_img = Image.open(io.BytesIO(image_bytes))
    input_img = ImageOps.exif_transpose(input_img)

    target_w, target_h = STANDARDS.get(size_standard, STANDARDS["4x6"])
    suit_config = SUIT_FILES.get(template_id, SUIT_FILES["men-suit-blue"])

    final_bg_hex = bg_color_hex or suit_config.get("default_bg", "#0072C6")
    bg_rgb = hex_to_rgb(final_bg_hex)

    user_cutout = extract_head_with_local_ai(input_img)

    cutout_rgb = user_cutout.convert("RGB")
    
    cv_bgr = None
    try:
        import cv2
        cv_bgr = cv2.cvtColor(np.array(cutout_rgb), cv2.COLOR_RGB2BGR)
    except ImportError:
        pass
        
    face_box = detect_face(cv_bgr) if cv_bgr is not None else None

    uw, uh = user_cutout.size

    if face_box:
        fx, fy, fw, fh = face_box
        face_cx = fx + fw // 2

        crop_top = max(0, fy - int(fh * 0.55))
        crop_bottom = min(uh, fy + int(fh * 2.0))
        crop_h = crop_bottom - crop_top
        crop_w = int(crop_h * (target_w / target_h))

        crop_left = max(0, face_cx - crop_w // 2)
        crop_right = min(uw, crop_left + crop_w)
        if crop_right - crop_left < crop_w:
            crop_left = max(0, crop_right - crop_w)

        user_framed = user_cutout.crop((crop_left, crop_top, crop_right, crop_bottom))
    else:
        user_framed = user_cutout

    user_scaled = ImageOps.fit(user_framed, (target_w, target_h), Image.Resampling.LANCZOS)

    suit_filename = suit_config.get("suit", "men_black_suit.png")
    suit_path = SUITS_DIR / suit_filename
    
    suit_y = int(target_h * 0.48)
    
    # Erase the user's original shoulders and chest so they don't stick out past the suit
    erase_mask = Image.new("L", (target_w, target_h), 255)
    draw_erase = ImageDraw.Draw(erase_mask)
    
    neck_center = target_w // 2
    neck_width = int(target_w * 0.45) # wide enough for neck, narrow enough to hide shoulders
    neck_left = neck_center - neck_width // 2
    neck_right = neck_center + neck_width // 2
    
    # Erase left shoulder
    draw_erase.rectangle([0, suit_y - 20, neck_left, target_h], fill=0)
    # Erase right shoulder
    draw_erase.rectangle([neck_right, suit_y - 20, target_w, target_h], fill=0)
    # Erase lower torso (below the suit V-neck)
    draw_erase.rectangle([0, suit_y + int(target_h * 0.20), target_w, target_h], fill=0)
    
    # Blur the mask to create a soft transition
    erase_mask = erase_mask.filter(ImageFilter.GaussianBlur(12))
    
    # Apply erasing mask to user cutout
    final_user_alpha = ImageChops.darker(user_scaled.split()[3], erase_mask)
    user_scaled.putalpha(final_user_alpha)

    canvas = Image.new("RGBA", (target_w, target_h), (*bg_rgb, 255))
    canvas.paste(user_scaled, (0, 0), mask=user_scaled.split()[3])

    if suit_path.exists():
        suit_img = Image.open(suit_path).convert("RGBA")

        scale = suit_config.get("suit_scale", 1.15)
        suit_w = int(target_w * scale)
        aspect = suit_img.width / suit_img.height
        suit_h = int(suit_w / aspect)
        suit_resized = suit_img.resize((suit_w, suit_h), Image.Resampling.LANCZOS)

        suit_x = (target_w - suit_w) // 2
        canvas.paste(suit_resized, (suit_x, suit_y), mask=suit_resized)

    final_pil = canvas.convert("RGB")
    if brightness != 1.0:
        final_pil = ImageEnhance.Brightness(final_pil).enhance(brightness)
    if contrast != 1.0:
        final_pil = ImageEnhance.Contrast(final_pil).enhance(contrast)

    out_io = io.BytesIO()
    final_pil.save(out_io, format="JPEG", quality=96, dpi=(300, 300))
    return out_io.getvalue()
