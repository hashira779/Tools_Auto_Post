"""
CV & ID Photo Processor — Python Microservice
Automatically extracts user's head/face and composites it seamlessly onto formal suits & uniforms.
"""

import io
import math
import logging
from typing import Tuple, Optional, Dict, Any
from PIL import Image, ImageDraw, ImageFilter, ImageOps, ImageEnhance
import numpy as np

try:
    import cv2
    HAS_CV2 = True
except ImportError:
    HAS_CV2 = False

logger = logging.getLogger(__name__)

# Standard Dimensions (300 DPI)
STANDARDS = {
    "4x6": (472, 709),      # 4x6 cm
    "3x4": (354, 472),      # 3x4 cm
    "2x2": (600, 600),      # 2x2 inch Passport / Visa
}

# Template Configurations
TEMPLATES: Dict[str, Dict[str, Any]] = {
    "men-suit-blue": {
        "title": "Standard Men Suit (Blue BG)",
        "gender": "male",
        "bg_color": "#0072C6",
        "neck_target": (0.50, 0.40),  # (x_ratio, y_ratio)
        "head_scale": 0.52,
        "suit_style": "black_suit_tie",
    },
    "men-suit-white": {
        "title": "Standard Men Suit (White BG)",
        "gender": "male",
        "bg_color": "#FFFFFF",
        "neck_target": (0.50, 0.40),
        "head_scale": 0.52,
        "suit_style": "black_suit_tie",
    },
    "women-blazer-collar": {
        "title": "Women Corporate Blazer & Collar",
        "gender": "female",
        "bg_color": "#0072C6",
        "neck_target": (0.50, 0.42),
        "head_scale": 0.50,
        "suit_style": "women_blazer",
    },
    "doctor-s1": {
        "title": "Doctor Medical Lab Coat",
        "gender": "unisex",
        "bg_color": "#0072C6",
        "neck_target": (0.50, 0.41),
        "head_scale": 0.51,
        "suit_style": "doctor_coat",
    },
    "teacher-uniform": {
        "title": "Teacher Academic Uniform",
        "gender": "unisex",
        "bg_color": "#FFFFFF",
        "neck_target": (0.50, 0.40),
        "head_scale": 0.52,
        "suit_style": "teacher_outfit",
    },
    "khmer-traditional-lace": {
        "title": "Cambodian Traditional Lace Blouse",
        "gender": "female",
        "bg_color": "#0072C6",
        "neck_target": (0.50, 0.42),
        "head_scale": 0.49,
        "suit_style": "khmer_lace",
    },
}


def hex_to_rgb(hex_str: str) -> Tuple[int, int, int]:
    """Convert hex color '#0072C6' to RGB tuple."""
    hex_str = hex_str.lstrip("#")
    if len(hex_str) == 3:
        hex_str = "".join([c * 2 for c in hex_str])
    if len(hex_str) != 6:
        return (0, 114, 198)  # Default Cambodian Blue
    return tuple(int(hex_str[i : i + 2], 16) for i in (0, 2, 4))  # type: ignore


def detect_face_box(img_pil: Image.Image) -> Tuple[int, int, int, int]:
    """
    Detect face bounding box (x, y, w, h) using OpenCV Haar Cascade.
    Falls back to intelligent upper-center heuristic if not found.
    """
    w, h = img_pil.size

    if HAS_CV2:
        try:
            cv_img = cv2.cvtColor(np.array(img_pil.convert("RGB")), cv2.COLOR_RGB2BGR)
            gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)
            
            cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
            face_cascade = cv2.CascadeClassifier(cascade_path)
            
            faces = face_cascade.detectMultiScale(
                gray,
                scaleFactor=1.1,
                minNeighbors=4,
                minSize=(int(w * 0.15), int(h * 0.15)),
            )

            if len(faces) > 0:
                # Pick largest face
                faces = sorted(faces, key=lambda f: f[2] * f[3], reverse=True)
                fx, fy, fw, fh = faces[0]
                return (int(fx), int(fy), int(fw), int(fh))
        except Exception as e:
            logger.warning(f"OpenCV face detection error: {e}")

    # Fallback: estimate center face in upper half of photo
    fw = int(w * 0.45)
    fh = int(h * 0.45)
    fx = int((w - fw) / 2)
    fy = int(h * 0.15)
    return (fx, fy, fw, fh)


def extract_head_with_feather(img_pil: Image.Image, face_box: Tuple[int, int, int, int]) -> Image.Image:
    """
    Extracts the head, hair, and neck cleanly with a feathered elliptical alpha mask.
    """
    fx, fy, fw, fh = face_box
    img_w, img_h = img_pil.size

    # Expand bounding box to encompass full hair on top and neck at bottom
    top_pad = int(fh * 0.55)
    bottom_pad = int(fh * 0.45)
    side_pad = int(fw * 0.35)

    x1 = max(0, fx - side_pad)
    y1 = max(0, fy - top_pad)
    x2 = min(img_w, fx + fw + side_pad)
    y2 = min(img_h, fy + fh + bottom_pad)

    cropped = img_pil.crop((x1, y1, x2, y2)).convert("RGBA")
    cw, ch = cropped.size

    # Create smooth feathered alpha mask
    mask = Image.new("L", (cw, ch), 0)
    draw = ImageDraw.Draw(mask)

    # Draw central head/neck ellipse
    draw.ellipse(
        [
            int(cw * 0.08),
            int(ch * 0.05),
            int(cw * 0.92),
            int(ch * 0.95),
        ],
        fill=255,
    )

    # Feather edges
    blur_radius = max(3, int(min(cw, ch) * 0.04))
    mask = mask.filter(ImageFilter.GaussianBlur(radius=blur_radius))

    # Apply mask
    cropped.putalpha(mask)
    return cropped


def render_pro_suit(draw: ImageDraw.ImageDraw, w: int, h: int, suit_style: str):
    """
    Draw high-resolution formal suit / blazer / uniform vector layer.
    """
    center_x = w // 2
    collar_y = int(h * 0.58)

    if suit_style == "doctor_coat":
        # White Doctor Lab Coat
        coat_color = (248, 250, 252)
        shadow_color = (203, 213, 225)
        steth_color = (30, 41, 59)

        # Base Shirt
        draw.polygon(
            [(center_x, collar_y), (center_x - int(w * 0.22), h), (center_x + int(w * 0.22), h)],
            fill=(226, 232, 240),
        )
        # Blue Tie
        draw.polygon(
            [(center_x - int(w * 0.04), collar_y + int(h * 0.05)),
             (center_x + int(w * 0.04), collar_y + int(h * 0.05)),
             (center_x + int(w * 0.05), h),
             (center_x - int(w * 0.05), h)],
            fill=(2, 132, 199),
        )
        # Left Coat Flap
        draw.polygon(
            [(0, collar_y + int(h * 0.08)), (center_x - int(w * 0.08), collar_y), (center_x - int(w * 0.02), h), (0, h)],
            fill=coat_color,
        )
        # Right Coat Flap
        draw.polygon(
            [(w, collar_y + int(h * 0.08)), (center_x + int(w * 0.08), collar_y), (center_x + int(w * 0.02), h), (w, h)],
            fill=coat_color,
        )
        # Stethoscope line
        draw.arc([center_x - int(w * 0.2), collar_y, center_x + int(w * 0.2), collar_y + int(h * 0.25)], 0, 180, fill=steth_color, width=4)

    elif suit_style == "women_blazer":
        # Elegant Black Blazer & White Blouse
        draw.polygon(
            [(center_x - int(w * 0.16), collar_y), (center_x + int(w * 0.16), collar_y), (center_x, h)],
            fill=(255, 255, 255),
        )
        # Black Blazer Left
        draw.polygon(
            [(0, collar_y + int(h * 0.05)), (center_x - int(w * 0.08), collar_y), (center_x - int(w * 0.02), h), (0, h)],
            fill=(15, 23, 42),
        )
        # Black Blazer Right
        draw.polygon(
            [(w, collar_y + int(h * 0.05)), (center_x + int(w * 0.08), collar_y), (center_x + int(w * 0.02), h), (w, h)],
            fill=(15, 23, 42),
        )
    elif suit_style == "khmer_lace":
        # Cambodian Traditional White Lace
        lace_base = (248, 250, 252)
        draw.polygon(
            [(0, collar_y + int(h * 0.06)), (center_x, collar_y - int(h * 0.02)), (w, collar_y + int(h * 0.06)), (w, h), (0, h)],
            fill=lace_base,
        )
        # Lace border accents
        draw.line([(0, collar_y + int(h * 0.06)), (center_x, collar_y - int(h * 0.02)), (w, collar_y + int(h * 0.06))], fill=(203, 213, 225), width=3)
    else:
        # Standard Men Business Suit (Navy/Black + Red/Blue Tie)
        suit_color = (15, 23, 42)
        shirt_color = (255, 255, 255)
        tie_color = (185, 28, 28)

        # White Dress Shirt V-Neck
        draw.polygon(
            [(center_x, collar_y), (center_x - int(w * 0.18), h), (center_x + int(w * 0.18), h)],
            fill=shirt_color,
        )
        # Formal Tie
        draw.polygon(
            [
                (center_x - int(w * 0.04), collar_y + int(h * 0.03)),
                (center_x + int(w * 0.04), collar_y + int(h * 0.03)),
                (center_x + int(w * 0.055), h),
                (center_x - int(w * 0.055), h),
            ],
            fill=tie_color,
        )
        # Suit Left Lapel
        draw.polygon(
            [(0, collar_y + int(h * 0.06)), (center_x - int(w * 0.09), collar_y), (center_x - int(w * 0.02), h), (0, h)],
            fill=suit_color,
        )
        # Suit Right Lapel
        draw.polygon(
            [(w, collar_y + int(h * 0.06)), (center_x + int(w * 0.09), collar_y), (center_x + int(w * 0.02), h), (w, h)],
            fill=suit_color,
        )


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
    1. Reads user image.
    2. Detects face coordinates & extracts head/neck with feathering.
    3. Fills standard background color (Cambodian Blue / White).
    4. Positions head onto suit template.
    5. Renders crisp vector suit layer.
    6. Outputs 300 DPI high-res image.
    """
    # 1. Open User Image
    input_img = Image.open(io.BytesIO(image_bytes))
    input_img = ImageOps.exif_transpose(input_img)

    # 2. Lookup standard and template
    target_w, target_h = STANDARDS.get(size_standard, STANDARDS["4x6"])
    template = TEMPLATES.get(template_id, TEMPLATES["men-suit-blue"])

    final_bg_hex = bg_color_hex or template.get("bg_color", "#0072C6")
    bg_rgb = hex_to_rgb(final_bg_hex)

    # 3. Detect Face & Extract Head
    face_box = detect_face_box(input_img)
    head_img = extract_head_with_feather(input_img, face_box)

    # 4. Create Final Canvas with Official Background
    canvas = Image.new("RGBA", (target_w, target_h), (*bg_rgb, 255))

    # 5. Scale & Paste Head
    head_w_target = int(target_w * template.get("head_scale", 0.52))
    aspect = head_img.width / head_img.height
    head_h_target = int(head_w_target / aspect)

    head_resized = head_img.resize((head_w_target, head_h_target), Image.Resampling.LANCZOS)

    # Apply brightness/contrast enhancement if requested
    if brightness != 1.0:
        enhancer = ImageEnhance.Brightness(head_resized)
        head_resized = enhancer.enhance(brightness)
    if contrast != 1.0:
        enhancer = ImageEnhance.Contrast(head_resized)
        head_resized = enhancer.enhance(contrast)

    target_neck_x, target_neck_y = template.get("neck_target", (0.50, 0.40))
    paste_x = int(target_w * target_neck_x - head_w_target // 2)
    paste_y = int(target_h * target_neck_y - head_h_target // 2)

    canvas.paste(head_resized, (paste_x, paste_y), head_resized)

    # 6. Render Professional Suit Layer Over Neck
    draw = ImageDraw.Draw(canvas)
    render_pro_suit(draw, target_w, target_h, template.get("suit_style", "black_suit_tie"))

    # 7. Convert to RGB and save with 300 DPI metadata
    final_rgb = canvas.convert("RGB")
    out_io = io.BytesIO()
    final_rgb.save(out_io, format="JPEG", quality=95, dpi=(300, 300))
    return out_io.getvalue()
