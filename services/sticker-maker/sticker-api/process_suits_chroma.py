import glob
import os
from pathlib import Path
from PIL import Image, ImageFilter

BRAIN_DIR = Path(r"C:\Users\chhoy\.gemini\antigravity-ide\brain\3a7e1d41-181c-48a1-9bd1-5462fadbe597")
OUT_DIR = Path(r"d:\Project\CamTech\services\sticker-maker\sticker-api\app\assets\suits")

suit_types = {
    "suit_men_green_bg": "men_black_suit.png",
    "suit_doctor_green_bg": "doctor_white_coat.png",
    "suit_women_green_bg": "women_black_blazer.png",
}

def remove_green_screen(img_path):
    img = Image.open(img_path).convert("RGBA")
    w, h = img.size
    pixels = img.load()
    
    # Create mask image
    mask = Image.new("L", (w, h), 255)
    mask_pixels = mask.load()

    # Chroma key out pure green (#00FF00) with tolerance
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            # Detect bright green
            if g > 150 and r < 100 and b < 100:
                mask_pixels[x, y] = 0
            # Detect edge green (spill)
            elif g > r + 30 and g > b + 30:
                # Semi-transparent for edges
                mask_pixels[x, y] = max(0, 255 - (g - max(r, b)) * 3)

    # Smooth the mask
    mask = mask.filter(ImageFilter.GaussianBlur(1.5))
    
    # Apply mask
    img.putalpha(mask)
    return img

OUT_DIR.mkdir(parents=True, exist_ok=True)

for prefix, out_name in suit_types.items():
    matches = list(BRAIN_DIR.glob(f"{prefix}_*.png"))
    if not matches:
        print(f"No matches for {prefix}")
        continue
    
    src_file = matches[-1]
    print(f"Processing {src_file} -> {out_name}")
    
    clean_suit = remove_green_screen(src_file)
    clean_suit.save(OUT_DIR / out_name, "PNG")
    print(f"Saved {OUT_DIR / out_name}")
