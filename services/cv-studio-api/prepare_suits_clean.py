import glob
import os
from pathlib import Path
from PIL import Image, ImageFilter
from collections import deque

BRAIN_DIR = Path(r"C:\Users\chhoy\.gemini\antigravity-ide\brain\3a7e1d41-181c-48a1-9bd1-5462fadbe597")
OUT_DIRS = [
    Path(r"d:\Project\CamTech\services\sticker-maker\sticker-api\app\assets\suits"),
    Path(r"d:\Project\CamTech\services\cv-studio-api\app\assets\suits"),
]

suit_types = {
    "suit_men_black": "men_black_suit.png",
    "suit_doctor_white": "doctor_white_coat.png",
    "suit_women_blazer": "women_black_blazer.png",
}

def flood_fill_bg(img: Image.Image, tolerance: int = 35) -> Image.Image:
    """Flood fill outer white background from edges so inner white shirt remains 100% solid."""
    img = img.convert("RGBA")
    w, h = img.size
    pixels = img.load()
    
    visited = set()
    queue = deque()
    
    # Add border pixels as seed
    for x in range(w):
        queue.append((x, 0))
        queue.append((x, h - 1))
    for y in range(h):
        queue.append((0, y))
        queue.append((w - 1, y))
        
    # Also seed top middle for neck opening (top 15% height in center)
    for x in range(int(w * 0.40), int(w * 0.60)):
        for y in range(0, int(h * 0.12)):
            queue.append((x, y))

    def is_white_bg(px):
        r, g, b, _ = px
        return r > (255 - tolerance) and g > (255 - tolerance) and b > (255 - tolerance)

    while queue:
        cx, cy = queue.popleft()
        if (cx, cy) in visited:
            continue
        visited.add((cx, cy))
        
        px = pixels[cx, cy]
        if is_white_bg(px):
            # Make background transparent
            pixels[cx, cy] = (px[0], px[1], px[2], 0)
            
            # Check 4 neighbors
            for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                if 0 <= nx < w and 0 <= ny < h and (nx, ny) not in visited:
                    queue.append((nx, ny))

    return img

for prefix, out_name in suit_types.items():
    matches = list(BRAIN_DIR.glob(f"{prefix}_*.png"))
    if not matches:
        print(f"No matches for {prefix}")
        continue
    
    src_file = matches[-1]
    print(f"Processing {src_file} -> {out_name}")
    raw_img = Image.open(src_file)
    clean_img = flood_fill_bg(raw_img, tolerance=30)
    
    for d in OUT_DIRS:
        d.mkdir(parents=True, exist_ok=True)
        clean_img.save(d / out_name, "PNG")
        print(f"Saved {d / out_name}")
