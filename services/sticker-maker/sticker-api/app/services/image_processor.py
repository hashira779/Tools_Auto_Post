"""
Image processing service for sticker creation.
Pure Pillow-based — no AI, no external models. Fast (<20ms) and lightweight.
"""

from __future__ import annotations

import io
from enum import Enum

from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

_bg_session = None
_rembg_failed = False

def get_bg_session():
    global _bg_session, _rembg_failed
    if _rembg_failed:
        return None
    if _bg_session is None:
        try:
            from rembg import new_session
            _bg_session = new_session("silueta")
        except Exception:
            _rembg_failed = True
            return None
    return _bg_session

# Telegram sticker constraints
STICKER_SIZE = 512
MAX_STICKER_KB = 512
WEBP_QUALITY_START = 90
WEBP_QUALITY_MIN = 30


class StickerStyle(str, Enum):
    """Available sticker processing styles."""
    ORIGINAL = "original"
    OUTLINE = "outline"
    CIRCLE = "circle"
    ROUNDED = "rounded"
    CARTOON = "cartoon"

    @classmethod
    def from_str(cls, s: str) -> "StickerStyle":
        try:
            return cls(s.lower().strip())
        except ValueError:
            return cls.ORIGINAL


def process_image(image_bytes: bytes, style: str = "original", remove_bg: bool = False) -> bytes:
    """
    Process an uploaded image into a Telegram-ready 512×512 WebP sticker.

    Args:
        image_bytes: Raw image bytes from upload.
        style: Processing style name.
        remove_bg: If True, uses AI to remove the background first.

    Returns:
        WebP bytes ready for Telegram, guaranteed under 512 KB.
    """
    img = Image.open(io.BytesIO(image_bytes)).convert("RGBA")

    # Fast pre-scale to fit within 512x512 to ensure instantaneous filter execution and fast AI
    w, h = img.size
    if max(w, h) > STICKER_SIZE:
        scale = STICKER_SIZE / max(w, h)
        img = img.resize((max(1, int(w * scale)), max(1, int(h * scale))), Image.LANCZOS)

    # Automatically detect and crop to the subject's face/shoulders if a face is present
    img = _smart_crop_face(img)

    if remove_bg:
        session = get_bg_session()
        if session:
            try:
                from rembg import remove
                img = remove(img, session=session)
            except Exception as e:
                # Fallback if background removal fails
                pass

    sticker_style = StickerStyle.from_str(style)

    if sticker_style == StickerStyle.OUTLINE:
        img = _add_white_outline(img)
    elif sticker_style == StickerStyle.CIRCLE:
        img = _circle_crop(img)
    elif sticker_style == StickerStyle.ROUNDED:
        img = _rounded_crop(img)
    elif sticker_style == StickerStyle.CARTOON:
        img = _cartoon_effect(img)

    img = _resize_to_sticker(img)
    return _to_webp(img)


def create_text_sticker(
    text: str,
    bg_color: str = "#5856d6",
    text_color: str = "#ffffff",
) -> bytes:
    """
    Generate a text-based sticker with gradient background.
    """
    size = STICKER_SIZE
    bg_rgba = _hex_to_rgba(bg_color)
    txt_rgba = _hex_to_rgba(text_color)

    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    _draw_gradient_rect(draw, img, (20, 20, size - 20, size - 20), bg_rgba, radius=40)

    font = _load_best_font(text, target_width=size - 100)
    wrapped = _wrap_text(text, font, max_width=size - 100)

    bbox = draw.textbbox((0, 0), wrapped, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    tx = (size - tw) // 2
    ty = (size - th) // 2

    # Shadow & main text
    draw.text((tx + 2, ty + 2), wrapped, fill=(0, 0, 0, 80), font=font, align="center")
    draw.text((tx, ty), wrapped, fill=txt_rgba, font=font, align="center")

    return _to_webp(img)


def get_available_styles() -> list[dict]:
    """Return all available style options with metadata."""
    return [
        {"id": "original", "name": "Original", "icon": "📷", "description": "Keep original image, resize to 512×512"},
        {"id": "outline", "name": "White Outline", "icon": "✏️", "description": "Add a white sticker border outline"},
        {"id": "circle", "name": "Circle Crop", "icon": "⭕", "description": "Circular crop with white border"},
        {"id": "rounded", "name": "Rounded", "icon": "🔲", "description": "Rounded corners with smooth edges"},
        {"id": "cartoon", "name": "Cartoon", "icon": "🎨", "description": "Posterize with bold edge lines"},
    ]


# ── Style Effects ────────────────────────────────────────────────

def _add_white_outline(img: Image.Image, outline_px: int = 8) -> Image.Image:
    """Add a white sticker outline around the subject or photo."""
    alpha = img.split()[3]
    extrema = alpha.getextrema()
    has_transparency = extrema[0] < 240

    if has_transparency:
        # Transparent cutout: expand alpha to make outline
        dilated = alpha.filter(ImageFilter.MaxFilter(outline_px * 2 + 1))
        outline_img = Image.new("RGBA", img.size, (0, 0, 0, 0))
        white_layer = Image.new("RGBA", img.size, (255, 255, 255, 255))
        outline_img.paste(white_layer, mask=dilated)
        outline_img.paste(img, mask=alpha)
        return outline_img
    else:
        # Solid image: add clean rounded border card
        margin = 12
        w, h = img.size
        target_w, target_h = max(1, w - margin * 2), max(1, h - margin * 2)
        scaled_img = img.resize((target_w, target_h), Image.LANCZOS)

        canvas = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        draw = ImageDraw.Draw(canvas)
        # White sticker background
        draw.rounded_rectangle((0, 0, w - 1, h - 1), radius=28, fill=(255, 255, 255, 255))

        # Paste inner image
        inner_mask = Image.new("L", (target_w, target_h), 0)
        ImageDraw.Draw(inner_mask).rounded_rectangle((0, 0, target_w - 1, target_h - 1), radius=20, fill=255)
        canvas.paste(scaled_img, (margin, margin), mask=inner_mask)
        return canvas


def _circle_crop(img: Image.Image, border: int = 8) -> Image.Image:
    """Crop to a circle with a white border."""
    min_side = min(img.size)
    left = (img.width - min_side) // 2
    top = (img.height - min_side) // 2
    cropped = img.crop((left, top, left + min_side, top + min_side))
    cropped = cropped.resize((STICKER_SIZE, STICKER_SIZE), Image.LANCZOS)

    result = Image.new("RGBA", (STICKER_SIZE, STICKER_SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(result)
    # White circle outer
    draw.ellipse((0, 0, STICKER_SIZE - 1, STICKER_SIZE - 1), fill=(255, 255, 255, 255))

    # Inner image
    inner_size = STICKER_SIZE - border * 2
    inner_img = cropped.resize((inner_size, inner_size), Image.LANCZOS)
    inner_mask = Image.new("L", (inner_size, inner_size), 0)
    ImageDraw.Draw(inner_mask).ellipse((0, 0, inner_size - 1, inner_size - 1), fill=255)
    result.paste(inner_img, (border, border), mask=inner_mask)

    # Outer circle mask
    final = Image.new("RGBA", (STICKER_SIZE, STICKER_SIZE), (0, 0, 0, 0))
    outer_mask = Image.new("L", (STICKER_SIZE, STICKER_SIZE), 0)
    ImageDraw.Draw(outer_mask).ellipse((0, 0, STICKER_SIZE - 1, STICKER_SIZE - 1), fill=255)
    final.paste(result, mask=outer_mask)
    return final


def _rounded_crop(img: Image.Image, radius: int = 36, border: int = 8) -> Image.Image:
    """Apply rounded corners with a white border."""
    w, h = img.size
    canvas = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(canvas)
    draw.rounded_rectangle((0, 0, w - 1, h - 1), radius=radius, fill=(255, 255, 255, 255))

    inner_w, inner_h = max(1, w - border * 2), max(1, h - border * 2)
    inner_img = img.resize((inner_w, inner_h), Image.LANCZOS)
    inner_mask = Image.new("L", (inner_w, inner_h), 0)
    ImageDraw.Draw(inner_mask).rounded_rectangle((0, 0, inner_w - 1, inner_h - 1), radius=max(4, radius - border), fill=255)
    canvas.paste(inner_img, (border, border), mask=inner_mask)
    return canvas


def _cartoon_effect(img: Image.Image) -> Image.Image:
    """Apply a fast posterized cartoon FX."""
    rgb = img.convert("RGB")
    rgb = rgb.filter(ImageFilter.MedianFilter(size=3))
    posterized = ImageOps.posterize(rgb, 4)

    # Edge overlay
    edges = rgb.convert("L").filter(ImageFilter.FIND_EDGES)
    edges = ImageOps.invert(edges)
    edges = edges.point(lambda x: 0 if x < 170 else 255)

    posterized = posterized.convert("RGBA")
    edge_layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    edge_layer.paste(
        Image.new("RGBA", img.size, (0, 0, 0, 255)),
        mask=ImageOps.invert(edges),
    )

    result = Image.alpha_composite(posterized, edge_layer)
    if img.mode == "RGBA":
        result.putalpha(img.split()[3])

    return result


# ── Helpers ──────────────────────────────────────────────────────

def _resize_to_sticker(img: Image.Image) -> Image.Image:
    """Resize to fit in 512×512 preserving aspect ratio, centered on transparent canvas."""
    w, h = img.size
    if w == 0 or h == 0:
        return Image.new("RGBA", (STICKER_SIZE, STICKER_SIZE), (0, 0, 0, 0))

    ratio = min(STICKER_SIZE / w, STICKER_SIZE / h)
    new_w, new_h = max(1, int(w * ratio)), max(1, int(h * ratio))
    img = img.resize((new_w, new_h), Image.LANCZOS)

    canvas = Image.new("RGBA", (STICKER_SIZE, STICKER_SIZE), (0, 0, 0, 0))
    canvas.paste(img, ((STICKER_SIZE - new_w) // 2, (STICKER_SIZE - new_h) // 2), img)
    return canvas


def _to_webp(img: Image.Image) -> bytes:
    """Convert to WebP, compressing until under 512 KB."""
    quality = WEBP_QUALITY_START
    while quality >= WEBP_QUALITY_MIN:
        buf = io.BytesIO()
        img.save(buf, format="WEBP", quality=quality, method=4)
        data = buf.getvalue()
        if len(data) <= MAX_STICKER_KB * 1024:
            return data
        quality -= 10

    buf = io.BytesIO()
    img.save(buf, format="WEBP", quality=WEBP_QUALITY_MIN, method=6)
    return buf.getvalue()


def _draw_gradient_rect(
    draw: ImageDraw.Draw,
    img: Image.Image,
    bbox: tuple[int, int, int, int],
    color: tuple[int, ...],
    radius: int = 40,
) -> None:
    """Draw a rounded rectangle with a vertical gradient."""
    x0, y0, x1, y1 = bbox

    gradient = Image.new("RGBA", img.size, (0, 0, 0, 0))
    g_draw = ImageDraw.Draw(gradient)

    for y in range(y0, y1):
        ratio = (y - y0) / max(1, (y1 - y0))
        r = max(0, min(255, int(color[0] * (1 - ratio * 0.3))))
        g = max(0, min(255, int(color[1] * (1 - ratio * 0.3))))
        b = max(0, min(255, int(color[2] * (1 - ratio * 0.3))))
        a = color[3] if len(color) > 3 else 255
        g_draw.line([(x0, y), (x1, y)], fill=(r, g, b, a))

    mask = Image.new("L", img.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle(bbox, radius=radius, fill=255)

    masked = Image.new("RGBA", img.size, (0, 0, 0, 0))
    masked.paste(gradient, mask=mask)
    img.paste(masked, (0, 0), masked)


def _hex_to_rgba(hex_color: str) -> tuple[int, int, int, int]:
    """Convert hex color string to RGBA tuple."""
    hex_color = hex_color.lstrip("#")
    if len(hex_color) == 6:
        r, g, b = int(hex_color[0:2], 16), int(hex_color[2:4], 16), int(hex_color[4:6], 16)
        return (r, g, b, 255)
    elif len(hex_color) == 8:
        r, g, b, a = int(hex_color[0:2], 16), int(hex_color[2:4], 16), int(hex_color[4:6], 16), int(hex_color[6:8], 16)
        return (r, g, b, a)
    return (88, 86, 214, 255)


def _load_best_font(text: str, target_width: int) -> ImageFont.FreeTypeFont:
    """Load font and binary-search for optimal size."""
    from pathlib import Path
    font_paths = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/TTF/DejaVuSans-Bold.ttf",
        "C:\\Windows\\Fonts\\arialbd.ttf",
        "C:\\Windows\\Fonts\\segoeui.ttf",
    ]
    font_file = None
    for p in font_paths:
        if Path(p).exists():
            font_file = p
            break

    for size in range(48, 16, -4):
        try:
            if font_file:
                font = ImageFont.truetype(font_file, size=size)
            else:
                font = ImageFont.load_default()
                return font

            dummy = Image.new("L", (1, 1))
            draw = ImageDraw.Draw(dummy)
            bbox = draw.textbbox((0, 0), text, font=font)
            if (bbox[2] - bbox[0]) <= target_width:
                return font
        except Exception:
            continue

    return ImageFont.load_default()


def _wrap_text(text: str, font, max_width: int) -> str:
    """Wrap text to fit within max_width."""
    words = text.split()
    if not words:
        return text

    dummy = Image.new("L", (1, 1))
    draw = ImageDraw.Draw(dummy)

    lines = []
    current_line = []

    for word in words:
        test_line = " ".join(current_line + [word])
        bbox = draw.textbbox((0, 0), test_line, font=font)
        if (bbox[2] - bbox[0]) <= max_width:
            current_line.append(word)
        else:
            if current_line:
                lines.append(" ".join(current_line))
            current_line = [word]

    if current_line:
        lines.append(" ".join(current_line))

    return "\n".join(lines)


def _smart_crop_face(img: Image.Image) -> Image.Image:
    """
    Uses MediaPipe to detect faces and crop around head and shoulders.
    Falls back safely to original image on any failure or if no face is found.
    """
    try:
        import cv2
        import numpy as np
        import mediapipe as mp
        
        mp_face_detection = mp.solutions.face_detection
        
        rgb_img = img.convert("RGB")
        np_img = np.array(rgb_img)
        cv_img = cv2.cvtColor(np_img, cv2.COLOR_RGB2BGR)
        
        with mp_face_detection.FaceDetection(model_selection=1, min_detection_confidence=0.5) as face_detection:
            results = face_detection.process(cv2.cvtColor(cv_img, cv2.COLOR_BGR2RGB))
            
            if not results or not results.detections:
                return img
                
            detection = results.detections[0]
            bbox = detection.location_data.relative_bounding_box
            
            h, w = cv_img.shape[:2]
            
            xmin = int(bbox.xmin * w)
            ymin = int(bbox.ymin * h)
            width = int(bbox.width * w)
            height = int(bbox.height * h)
            
            pad_top = int(height * 0.6)
            pad_bottom = int(height * 1.5)
            pad_sides = int(width * 1.0)
            
            crop_xmin = max(0, xmin - pad_sides)
            crop_ymin = max(0, ymin - pad_top)
            crop_xmax = min(w, xmin + width + pad_sides)
            crop_ymax = min(h, ymin + height + pad_bottom)
            
            crop_w = crop_xmax - crop_xmin
            crop_h = crop_ymax - crop_ymin
            
            if crop_w > crop_h:
                diff = crop_w - crop_h
                crop_ymin = max(0, crop_ymin - diff // 2)
                crop_ymax = min(h, crop_ymax + diff // 2)
            elif crop_h > crop_w:
                diff = crop_h - crop_w
                crop_xmin = max(0, crop_xmin - diff // 2)
                crop_xmax = min(w, crop_xmax + diff // 2)
                
            if crop_xmax > crop_xmin and crop_ymax > crop_ymin:
                return img.crop((crop_xmin, crop_ymin, crop_xmax, crop_ymax))
            return img
    except Exception:
        return img

