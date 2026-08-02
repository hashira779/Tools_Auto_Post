"""
CV & ID Photo Processor — Python Microservice
Ultra-Precise AI Face-Swap, Eye-Level Affine Alignment & Seamless Poisson Blending onto Studio Uniforms.
"""

import io
import os
import math
import logging
from typing import Tuple, Optional, Dict, List, Any
from pathlib import Path
from PIL import Image, ImageOps, ImageEnhance, ImageFilter
import numpy as np

try:
    import cv2
    HAS_CV2 = True
except ImportError:
    HAS_CV2 = False

logger = logging.getLogger(__name__)

# Template Asset Directory
ASSETS_DIR = Path(__file__).resolve().parent.parent / "assets" / "templates"

# Standard Output Dimensions (300 DPI)
STANDARDS = {
    "4x6": (472, 709),      # 4x6 cm (Standard CV / Job application)
    "3x4": (354, 472),      # 3x4 cm (Student ID / License)
    "2x2": (600, 600),      # 2x2 inch (Passport / Visa)
}

# Template file mapping
TEMPLATE_FILES: Dict[str, str] = {
    "men-suit-blue": "men_suit_blue.png",
    "men-suit-white": "men_suit_blue.png",
    "men-suit-navy": "men_suit_navy_red.png",
    "women-blazer-collar": "women_blazer.png",
    "women-suit-tie": "women_blazer.png",
    "doctor-s1": "doctor_coat.png",
    "doctor-s2": "doctor_female.png",
    "doctor-scrubs": "doctor_scrubs.png",
    "teacher-uniform": "teacher_uniform.png",
    "khmer-traditional-lace": "khmer_lace.png",
    "khmer-silk-gold": "khmer_silk_gold.png",
    "profile-pro-male": "men_suit_navy_red.png",
    "profile-pro-female": "women_blazer.png",
    "restore-id-vintage": "men_suit_blue.png",
    "couple-traditional": "khmer_silk_gold.png",
}


def hex_to_rgb(hex_str: str) -> Tuple[int, int, int]:
    """Convert hex color '#0072C6' to RGB tuple."""
    hex_str = hex_str.lstrip("#")
    if len(hex_str) == 3:
        hex_str = "".join([c * 2 for c in hex_str])
    if len(hex_str) != 6:
        return (0, 114, 198)  # Cambodian Blue
    return tuple(int(hex_str[i : i + 2], 16) for i in (0, 2, 4))  # type: ignore


def detect_face_and_eyes(cv_bgr: np.ndarray) -> Tuple[Optional[Tuple[int, int, int, int]], List[Tuple[int, int]]]:
    """
    Detects face bounding box and eye centers for rotational alignment.
    """
    if not HAS_CV2:
        return None, []

    try:
        gray = cv2.cvtColor(cv_bgr, cv2.COLOR_BGR2GRAY)
        
        # Face detector
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
        faces = face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.08,
            minNeighbors=4,
            minSize=(int(cv_bgr.shape[1] * 0.12), int(cv_bgr.shape[0] * 0.12)),
        )

        if len(faces) == 0:
            return None, []

        # Get largest face
        faces = sorted(faces, key=lambda f: f[2] * f[3], reverse=True)
        fx, fy, fw, fh = faces[0]

        # Detect eyes within face region
        eye_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_eye.xml")
        face_gray = gray[fy : fy + int(fh * 0.65), fx : fx + fw]
        eyes = eye_cascade.detectMultiScale(face_gray, scaleFactor=1.1, minNeighbors=3, minSize=(int(fw * 0.12), int(fh * 0.12)))

        eye_centers = []
        if len(eyes) >= 2:
            # Sort left to right
            eyes = sorted(eyes, key=lambda e: e[0])
            for ex, ey, ew, eh in eyes[:2]:
                eye_centers.append((fx + ex + ew // 2, fy + ey + eh // 2))

        return (int(fx), int(fy), int(fw), int(fh)), eye_centers
    except Exception as e:
        logger.warning(f"Face & eye detection error: {e}")
        return None, []


def align_face_rotation(cv_bgr: np.ndarray, eye_centers: List[Tuple[int, int]]) -> np.ndarray:
    """
    Rotates image so eyes are horizontally level (0 degrees tilt).
    """
    if len(eye_centers) < 2:
        return cv_bgr

    left_eye, right_eye = eye_centers[0], eye_centers[1]
    dx = right_eye[0] - left_eye[0]
    dy = right_eye[1] - left_eye[1]
    angle = math.degrees(math.atan2(dy, dx))

    # If angle is minor (< 35 deg), level it
    if abs(angle) < 35:
        center = ((left_eye[0] + right_eye[0]) // 2, (left_eye[1] + right_eye[1]) // 2)
        m = cv2.getRotationMatrix2D(center, angle, 1.0)
        h, w = cv_bgr.shape[:2]
        return cv2.warpAffine(cv_bgr, m, (w, h), flags=cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REPLICATE)

    return cv_bgr


def match_skin_tone_lab(src_bgr: np.ndarray, target_bgr: np.ndarray) -> np.ndarray:
    """
    Seamless LAB color transfer to match studio lighting temperature & luminance.
    """
    if not HAS_CV2:
        return src_bgr

    try:
        src_lab = cv2.cvtColor(src_bgr, cv2.COLOR_BGR2LAB).astype(np.float32)
        tgt_lab = cv2.cvtColor(target_bgr, cv2.COLOR_BGR2LAB).astype(np.float32)

        src_mean, src_std = src_lab.mean(axis=(0, 1)), src_lab.std(axis=(0, 1))
        tgt_mean, tgt_std = tgt_lab.mean(axis=(0, 1)), tgt_lab.std(axis=(0, 1))

        src_std[src_std < 1e-4] = 1.0

        # Gentle blending factor (75% match to preserve real skin nuances)
        alpha = 0.75
        adjusted_std = (1 - alpha) * src_std + alpha * tgt_std
        adjusted_mean = (1 - alpha) * src_mean + alpha * tgt_mean

        result_lab = (src_lab - src_mean) * (adjusted_std / src_std) + adjusted_mean
        result_lab = np.clip(result_lab, 0, 255).astype(np.uint8)

        return cv2.cvtColor(result_lab, cv2.COLOR_LAB2BGR)
    except Exception as e:
        logger.warning(f"Skin tone match fallback: {e}")
        return src_bgr


def seamless_face_swap_perfect(
    user_img_pil: Image.Image,
    template_path: Path,
    brightness: float = 1.0,
    contrast: float = 1.0,
) -> Image.Image:
    """
    Ultra-precise AI face swap onto real template photo.
    """
    if not template_path.exists():
        logger.error(f"Template not found at {template_path}")
        return user_img_pil

    template_pil = Image.open(template_path).convert("RGB")
    tpl_w, tpl_h = template_pil.size

    tpl_bgr = cv2.cvtColor(np.array(template_pil), cv2.COLOR_RGB2BGR)
    user_bgr = cv2.cvtColor(np.array(user_img_pil.convert("RGB")), cv2.COLOR_RGB2BGR)

    # 1. Detect Source User Face & Eyes
    user_face_box, user_eyes = detect_face_and_eyes(user_bgr)
    if user_eyes and len(user_eyes) == 2:
        user_bgr = align_face_rotation(user_bgr, user_eyes)
        user_face_box, _ = detect_face_and_eyes(user_bgr)

    # Fallback face boxes
    if not user_face_box:
        uw, uh = user_img_pil.size
        user_face_box = (int(uw * 0.22), int(uh * 0.15), int(uw * 0.56), int(uh * 0.56))

    tpl_face_box, _ = detect_face_and_eyes(tpl_bgr)
    if not tpl_face_box:
        tpl_face_box = (int(tpl_w * 0.28), int(tpl_h * 0.15), int(tpl_w * 0.44), int(tpl_h * 0.44))

    ux, uy, uw, uh = user_face_box
    tx, ty, tw, th = tpl_face_box

    # 2. Extract Precision User Face (Forehead, Eyes, Nose, Mouth, Jaw)
    pad_y_top = int(uh * 0.10)
    pad_y_bot = int(uh * 0.18)
    pad_x = int(uw * 0.10)

    y1 = max(0, uy - pad_y_top)
    y2 = min(user_bgr.shape[0], uy + uh + pad_y_bot)
    x1 = max(0, ux - pad_x)
    x2 = min(user_bgr.shape[1], ux + uw + pad_x)

    user_face_roi = user_bgr[y1:y2, x1:x2]
    if user_face_roi.size == 0:
        return template_pil

    # Resize user face to target face size
    target_face_w = int(tw * 1.04)
    target_face_h = int(th * 1.10)
    user_face_aligned = cv2.resize(user_face_roi, (target_face_w, target_face_h), interpolation=cv2.INTER_LANCZOS4)

    # 3. Match Skin Tone & Studio Lighting
    tpl_y1 = max(0, ty)
    tpl_y2 = min(tpl_h, ty + th)
    tpl_x1 = max(0, tx)
    tpl_x2 = min(tpl_w, tx + tw)
    tpl_face_roi = tpl_bgr[tpl_y1:tpl_y2, tpl_x1:tpl_x2]

    if tpl_face_roi.size > 0:
        user_face_aligned = match_skin_tone_lab(user_face_aligned, tpl_face_roi)

    # 4. Construct Precision Facial Convex Hull Mask
    fh_h, fh_w = user_face_aligned.shape[:2]
    mask = np.zeros((fh_h, fh_w), dtype=np.uint8)

    # 10-point anatomical facial contour
    points = np.array([
        [int(fh_w * 0.50), int(fh_h * 0.04)],   # Top Forehead center
        [int(fh_w * 0.78), int(fh_h * 0.18)],   # Right temple
        [int(fh_w * 0.88), int(fh_h * 0.45)],   # Right cheekbone
        [int(fh_w * 0.82), int(fh_h * 0.75)],   # Right jawline
        [int(fh_w * 0.62), int(fh_h * 0.94)],   # Right chin
        [int(fh_w * 0.50), int(fh_h * 0.98)],   # Chin tip
        [int(fh_w * 0.38), int(fh_h * 0.94)],   # Left chin
        [int(fh_w * 0.18), int(fh_h * 0.75)],   # Left jawline
        [int(fh_w * 0.12), int(fh_h * 0.45)],   # Left cheekbone
        [int(fh_w * 0.22), int(fh_h * 0.18)],   # Left temple
    ], dtype=np.int32)

    cv2.fillConvexPoly(mask, points, 255)

    # High quality Gaussian feathering for flawless boundary blending
    blur_kernel = max(11, int(fh_w * 0.08) | 1)
    mask = cv2.GaussianBlur(mask, (blur_kernel, blur_kernel), 0)

    # 5. Seamless Poisson Cloning (Seamless boundary blending)
    clone_center = (tx + tw // 2, ty + int(th * 0.52))

    try:
        blended_bgr = cv2.seamlessClone(
            user_face_aligned,
            tpl_bgr,
            mask,
            clone_center,
            cv2.NORMAL_CLONE,
        )
    except Exception as e:
        logger.warning(f"Poisson seamless clone fallback: {e}")
        blended_bgr = tpl_bgr

    # Convert to PIL
    result_rgb = cv2.cvtColor(blended_bgr, cv2.COLOR_BGR2RGB)
    result_pil = Image.fromarray(result_rgb)

    # Apply brightness/contrast enhancement
    if brightness != 1.0:
        result_pil = ImageEnhance.Brightness(result_pil).enhance(brightness)
    if contrast != 1.0:
        result_pil = ImageEnhance.Contrast(result_pil).enhance(contrast)

    return result_pil


def process_cv_photo(
    image_bytes: bytes,
    template_id: str = "men-suit-blue",
    bg_color_hex: Optional[str] = None,
    size_standard: str = "4x6",
    brightness: float = 1.0,
    contrast: float = 1.0,
) -> bytes:
    """
    Main entry point for CV & ID Photo generation.
    """
    input_img = Image.open(io.BytesIO(image_bytes))
    input_img = ImageOps.exif_transpose(input_img)

    # Find template file
    template_filename = TEMPLATE_FILES.get(template_id, "men_suit_blue.png")
    template_path = ASSETS_DIR / template_filename

    # Execute precision seamless face swap
    swapped_pil = seamless_face_swap_perfect(
        user_img_pil=input_img,
        template_path=template_path,
        brightness=brightness,
        contrast=contrast,
    )

    # Resize to exact official dimension (e.g. 472 x 709 for 4x6 cm @ 300 DPI)
    target_w, target_h = STANDARDS.get(size_standard, STANDARDS["4x6"])
    final_output = ImageOps.fit(swapped_pil, (target_w, target_h), Image.Resampling.LANCZOS)

    # Save to high-quality JPEG @ 300 DPI
    out_io = io.BytesIO()
    final_output.convert("RGB").save(out_io, format="JPEG", quality=96, dpi=(300, 300))
    return out_io.getvalue()
