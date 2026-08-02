"""
Image processing service for sticker creation.
Pure Pillow-based — no AI, no external models. Fast and free.
"""

from __future__ import annotations

import io
from enum import Enum

from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

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


def process_image(image_bytes: bytes, style: str = "original") -> bytes:
    """
    Process an uploaded image into a Telegram-ready 512×512 WebP sticker.

    Args:
        image_bytes: Raw image bytes from upload.
        style: Processing style name.

    Returns:
        WebP bytes ready for Telegram, guaranteed under 512 KB.
    """
    img = Image.open(io.BytesIO(image_bytes)).convert("RGBA")
    sticker_style = StickerStyle.from_str(style)

    if sticker_style == StickerStyle.OUTLINE:
        img = _add_white_outline(img)
    elif sticker_style == StickerStyle.CIRCLE:
        img = _circle_crop(img)
    elif sticker_style == StickerStyle.ROUNDED:
        img = _rounded_crop(img)
    elif sticker_style == StickerStyle.CARTOON:
        img = _cartoon_effect(img)
    # ORIGINAL: just resize

    img = _resize_to_sticker(img)
    return _to_webp(img)


def create_text_sticker(
    text: str,
    bg_color: str = "#5856d6",
    text_color: str = "#ffffff",
) -> bytes:
    """
    Generate a text-based sticker with gradient background.

    Args:
        text: The text to render.
        bg_color: Hex color for background.
        text_color: Hex color for text.

    Returns:
        WebP bytes.
    """
    size = STICKER_SIZE
    bg_rgba = _hex_to_rgba(bg_color)
    txt_rgba = _hex_to_rgba(text_color)

    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Draw gradient rounded rectangle background
    _draw_gradient_rect(draw, img, (20, 20, size - 20, size - 20), bg_rgba, radius=40)

    # Load font and fit text
    font = _load_best_font(text, target_width=size - 100)
    wrapped = _wrap_text(text, font, max_width=size - 100)

    # Measure text
    bbox = draw.textbbox((0, 0), wrapped, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    tx = (size - tw) // 2
    ty = (size - th) // 2

    # Drop shadow
    draw.text((tx + 2, ty + 2), wrapped, fill=(0, 0, 0, 80), font=font, align="center")
    # Main text
    draw.text((tx, ty), wrapped, fill=txt_rgba, font=font, align="center")

    return _to_webp(img)


def get_available_styles() -> list[dict]:
    """Return all available style options with metadata."""
    return [
        {"id": "original", "name": "Original", "icon": "📷", "description": "Keep original image, resize to 512×512"},
        {"id": "outline", "name": "White Outline", "icon": "✏️", "description": "Add a white border outline"},
        {"id": "circle", "name": "Circle Crop", "icon": "⭕", "description": "Circular crop with white border"},
        {"id": "rounded", "name": "Rounded", "icon": "🔲", "description": "Rounded corners with smooth edges"},
        {"id": "cartoon", "name": "Cartoon", "icon": "🎨", "description": "Posterize with bold edge lines"},
    ]


# ── Style Effects ────────────────────────────────────────────────

def _add_white_outline(img: Image.Image, width: int = 12) -> Image.Image:
    """Add a white outline around the image content."""
    # If image has transparency, outline the non-transparent parts
    alpha = img.split()[3]

    # Dilate alpha to create outline region
    dilated = alpha.filter(ImageFilter.MaxFilter(width * 2 + 1))

    # Create white outline layer
    outline_img = Image.new("RGBA", img.size, (0, 0, 0, 0))
    white_layer = Image.new("RGBA", img.size, (255, 255, 255, 255))
    outline_img.paste(white_layer, mask=dilated)

    # Composite original on top
    outline_img.paste(img, mask=alpha)
    return outline_img


def _circle_crop(img: Image.Image, border: int = 10) -> Image.Image:
    """Crop to a circle with a white border."""
    # Make square
    min_side = min(img.size)
    left = (img.width - min_side) // 2
    top = (img.height - min_side) // 2
    img = img.crop((left, top, left + min_side, top + min_side))
    img = img.resize((STICKER_SIZE, STICKER_SIZE), Image.LANCZOS)

    # Create circular mask
    mask = Image.new("L", (STICKER_SIZE, STICKER_SIZE), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, STICKER_SIZE - 1, STICKER_SIZE - 1), fill=255)

    # Result canvas
    result = Image.new("RGBA", (STICKER_SIZE, STICKER_SIZE), (0, 0, 0, 0))

    # White border circle
    ImageDraw.Draw(result).ellipse(
        (0, 0, STICKER_SIZE - 1, STICKER_SIZE - 1),
        fill=(255, 255, 255, 255),
    )

    # Inner mask
    inner_mask = Image.new("L", (STICKER_SIZE, STICKER_SIZE), 0)
    ImageDraw.Draw(inner_mask).ellipse(
        (border, border, STICKER_SIZE - border - 1, STICKER_SIZE - border - 1),
        fill=255,
    )
    result.paste(img, mask=inner_mask)

    # Apply outer circle mask
    final = Image.new("RGBA", (STICKER_SIZE, STICKER_SIZE), (0, 0, 0, 0))
    final.paste(result, mask=mask)
    return final


def _rounded_crop(img: Image.Image, radius: int = 60) -> Image.Image:
    """Crop image with rounded corners."""
    # Resize to sticker size first
    img = ImageOps.fit(img, (STICKER_SIZE, STICKER_SIZE), Image.LANCZOS)
    img = img.convert("RGBA")

    # Create rounded rectangle mask
    mask = Image.new("L", (STICKER_SIZE, STICKER_SIZE), 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        (0, 0, STICKER_SIZE - 1, STICKER_SIZE - 1),
        radius=radius,
        fill=255,
    )

    # Apply mask
    result = Image.new("RGBA", (STICKER_SIZE, STICKER_SIZE), (0, 0, 0, 0))
    result.paste(img, mask=mask)
    return result


def _cartoon_effect(img: Image.Image) -> Image.Image:
    """Posterize with edge emphasis for a cartoon look."""
    rgb = img.convert("RGB")
    posterized = ImageOps.posterize(rgb, 4)

    # Find edges
    edges = rgb.convert("L").filter(ImageFilter.FIND_EDGES)
    edges = ImageOps.invert(edges)
    edges = edges.point(lambda x: 0 if x < 180 else 255)

    # Combine
    posterized = posterized.convert("RGBA")
    edge_layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    edge_layer.paste(
        Image.new("RGBA", img.size, (0, 0, 0, 255)),
        mask=ImageOps.invert(edges),
    )

    result = Image.alpha_composite(posterized, edge_layer)

    # Preserve original alpha
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
    new_w, new_h = int(w * ratio), int(h * ratio)
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

    # Create gradient layer
    gradient = Image.new("RGBA", img.size, (0, 0, 0, 0))
    g_draw = ImageDraw.Draw(gradient)

    for y in range(y0, y1):
        ratio = (y - y0) / (y1 - y0)
        r = max(0, min(255, int(color[0] * (1 - ratio * 0.3))))
        g = max(0, min(255, int(color[1] * (1 - ratio * 0.3))))
        b = max(0, min(255, int(color[2] * (1 - ratio * 0.3))))
        a = color[3] if len(color) > 3 else 255
        g_draw.line([(x0, y), (x1, y)], fill=(r, g, b, a))

    # Apply rounded corners
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
    return (88, 86, 214, 255)  # Default purple


def _load_best_font(text: str, target_width: int) -> ImageFont.FreeTypeFont:
    """Load font and binary-search for optimal size."""
    from pathlib import Path

    font_paths = [
        "/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf",
        "/usr/share/fonts/truetype/noto/NotoSansKhmer-Bold.ttf",
        "C:/Windows/Fonts/arialbd.ttf",
        "C:/Windows/Fonts/arial.ttf",
    ]

    font_path = next((fp for fp in font_paths if Path(fp).exists()), None)

    lo, hi, best = 20, 200, 48
    while lo <= hi:
        mid = (lo + hi) // 2
        try:
            test_font = ImageFont.truetype(font_path, size=mid) if font_path else ImageFont.load_default(size=mid)
        except (OSError, TypeError):
            test_font = ImageFont.load_default()
            break

        wrapped = _wrap_text(text, test_font, max_width=target_width)
        d = ImageDraw.Draw(Image.new("RGBA", (1, 1)))
        bb = d.textbbox((0, 0), wrapped, font=test_font)
        tw, th = bb[2] - bb[0], bb[3] - bb[1]

        if tw <= target_width and th <= target_width:
            best = mid
            lo = mid + 1
        else:
            hi = mid - 1

    try:
        return ImageFont.truetype(font_path, size=best) if font_path else ImageFont.load_default(size=best)
    except (OSError, TypeError):
        return ImageFont.load_default()


def _wrap_text(text: str, font: ImageFont.FreeTypeFont, max_width: int) -> str:
    """Word-wrap text to fit within max_width pixels."""
    d = ImageDraw.Draw(Image.new("RGBA", (1, 1)))
    words = text.split()
    lines, current = [], ""

    for word in words:
        test = f"{current} {word}".strip() if current else word
        bb = d.textbbox((0, 0), test, font=font)
        if bb[2] - bb[0] <= max_width:
            current = test
        else:
            if current:
                lines.append(current)
            current = word

    if current:
        lines.append(current)
    return "\n".join(lines) if lines else text
