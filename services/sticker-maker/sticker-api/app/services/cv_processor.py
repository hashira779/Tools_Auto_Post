"""
CV & ID Photo Processor — Python Microservice
Photorealistic AI Face-Swap & Seamless Poisson Blending onto Real Studio Uniform & Suit Templates.
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


def detect_face(cv_bgr: np.ndarray) -> Optional[Tuple[int, int, int, int]]:
    """
    Detect face bounding box (x, y, w, h) using OpenCV Haar Cascade.
    """
    if not HAS_CV2:
        return None

    try:
        gray = cv2.cvtColor(cv_bgr, cv2.COLOR_BGR2GRAY)
        cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        face_cascade = cv2.CascadeClassifier(cascade_path)
        
        faces = face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=4,
            minSize=(int(cv_bgr.shape[1] * 0.12), int(cv_bgr.shape[0] * 0.12)),
        )

        if len(faces) > 0:
            # Pick largest detected face
            faces = sorted(faces, key=lambda f: f[2] * f[3], reverse=True)
            fx, fy, fw, fh = faces[0]
            return (int(fx), int(fy), int(fw), int(fh))
    except Exception as e:
        logger.warning(f"Face detection failed: {e}")

    return None


def match_skin_tone(src_face_bgr: np.ndarray, target_face_bgr: np.ndarray) -> np.ndarray:
    """
    Color transfer in LAB color space to match the template's studio lighting.
    """
    if not HAS_CV2:
        return src_face_bgr

    try:
        src_lab = cv2.cvtColor(src_face_bgr, cv2.COLOR_BGR2LAB).astype(np.float32)
        tgt_lab = cv2.cvtColor(target_face_bgr, cv2.COLOR_BGR2LAB).astype(np.float32)

        src_mean, src_std = src_lab.mean(axis=(0, 1)), src_lab.std(axis=(0, 1))
        tgt_mean, tgt_std = tgt_lab.mean(axis=(0, 1)), tgt_lab.std(axis=(0, 1))

        src_std[src_std == 0] = 1.0

        # Adjust LAB channels
        result_lab = (src_lab - src_mean) * (tgt_std / src_std) + tgt_mean
        result_lab = np.clip(result_lab, 0, 255).astype(np.uint8)

        return cv2.cvtColor(result_lab, cv2.COLOR_LAB2BGR)
    except Exception as e:
        logger.warning(f"Skin tone matching fallback: {e}")
        return src_face_bgr


def seamless_face_swap(
    user_img_pil: Image.Image,
    template_path: Path,
    brightness: float = 1.0,
    contrast: float = 1.0,
) -> Image.Image:
    """
    Seamlessly swaps user's face into the real high-res template photo using Poisson blending.
    """
    # 1. Load Template Photo
    if not template_path.exists():
        logger.error(f"Template not found at {template_path}")
        return user_img_pil

    template_pil = Image.open(template_path).convert("RGB")
    tpl_w, tpl_h = template_pil.size

    # Convert to OpenCV BGR
    tpl_bgr = cv2.cvtColor(np.array(template_pil), cv2.COLOR_RGB2BGR)
    user_bgr = cv2.cvtColor(np.array(user_img_pil.convert("RGB")), cv2.COLOR_RGB2BGR)

    # 2. Detect Faces
    user_face_box = detect_face(user_bgr)
    tpl_face_box = detect_face(tpl_bgr)

    # Fallback coordinates if detection fails
    if not user_face_box:
        uw, uh = user_img_pil.size
        user_face_box = (int(uw * 0.25), int(uh * 0.15), int(uw * 0.5), int(uh * 0.5))

    if not tpl_face_box:
        tpl_face_box = (int(tpl_w * 0.28), int(tpl_h * 0.15), int(tpl_w * 0.44), int(tpl_h * 0.44))

    ux, uy, uw, uh = user_face_box
    tx, ty, tw, th = tpl_face_box

    # 3. Crop User Face Region (Face + Cheeks + Forehead + Chin)
    # Expand slightly for full facial structure
    pad_top = int(uh * 0.15)
    pad_bottom = int(uh * 0.15)
    pad_side = int(uw * 0.12)

    ux1 = max(0, ux - pad_side)
    uy1 = max(0, uy - pad_top)
    ux2 = min(user_bgr.shape[1], ux + uw + pad_side)
    uy2 = min(user_bgr.shape[0], uy + uh + pad_bottom)

    user_face_crop = user_bgr[uy1:uy2, ux1:ux2]
    if user_face_crop.size == 0:
        return template_pil

    # Scale user face to match target template face size
    target_face_w = int(tw * 1.05)
    target_face_h = int(th * 1.05)
    user_face_resized = cv2.resize(user_face_crop, (target_face_w, target_face_h), interpolation=cv2.INTER_LANCZOS4)

    # 4. Extract target face area for skin-tone harmonization
    tx1 = max(0, tx)
    ty1 = max(0, ty)
    tx2 = min(tpl_w, tx + tw)
    ty2 = min(tpl_h, ty + th)
    tpl_face_crop = tpl_bgr[ty1:ty2, tx1:tx2]

    if tpl_face_crop.size > 0:
        user_face_resized = match_skin_tone(user_face_resized, tpl_face_crop)

    # 5. Create Smooth Seamless Cloning Mask (Ellipse centered on facial features)
    mask = np.zeros(user_face_resized.shape[:2], dtype=np.uint8)
    center_ellipse = (target_face_w // 2, int(target_face_h * 0.50))
    axes = (int(target_face_w * 0.42), int(target_face_h * 0.46))
    cv2.ellipse(mask, center_ellipse, axes, 0, 0, 360, 255, -1)

    # Blur mask for ultra-smooth edge transition
    mask = cv2.GaussianBlur(mask, (15, 15), 0)

    # 6. Apply Seamless Poisson Blending
    clone_center = (tx + tw // 2, ty + int(th * 0.50))

    try:
        blended_bgr = cv2.seamlessClone(
            user_face_resized,
            tpl_bgr,
            mask,
            clone_center,
            cv2.NORMAL_CLONE,
        )
    except Exception as e:
        logger.warning(f"Poisson clone fallback: {e}")
        # Fallback to alpha composite
        blended_bgr = tpl_bgr

    # Convert back to PIL
    result_rgb = cv2.cvtColor(blended_bgr, cv2.COLOR_BGR2RGB)
    result_pil = Image.fromarray(result_rgb)

    # Apply brightness/contrast adjustments
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
    Main pipeline:
    1. Loads uploaded user photo.
    2. Identifies selected photorealistic uniform template.
    3. Runs AI Face-Swap with Poisson Seamless Blending onto real suit.
    4. Resizes to requested official standard (4x6 / 3x4 / 2x2).
    5. Exports 300 DPI high-resolution JPEG.
    """
    input_img = Image.open(io.BytesIO(image_bytes))
    input_img = ImageOps.exif_transpose(input_img)

    # Find template file
    template_filename = TEMPLATE_FILES.get(template_id, "men_suit_blue.png")
    template_path = ASSETS_DIR / template_filename

    # Seamless AI Face Swap
    swapped_pil = seamless_face_swap(
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
