import glob
import os
from pathlib import Path
from PIL import Image, ImageOps, ImageFilter
import numpy as np

BRAIN_DIR = Path(r"C:\Users\chhoy\.gemini\antigravity-ide\brain\3a7e1d41-181c-48a1-9bd1-5462fadbe597")
OUT_DIR = Path(r"d:\Project\CamTech\services\sticker-maker\sticker-api\app\assets\suits")
OUT_DIR.mkdir(parents=True, exist_ok=True)

suit_types = {
    "suit_men_black": "men_black_suit.png",
    "suit_doctor_white": "doctor_white_coat.png",
    "suit_women_blazer": "women_black_blazer.png",
}

for prefix, out_name in suit_types.items():
    matches = list(BRAIN_DIR.glob(f"{prefix}_*.png"))
    if not matches:
        print(f"No matches for {prefix}")
        continue
    
    src_file = matches[-1]
    print(f"Processing {src_file} -> {out_name}")
    img = Image.open(src_file).convert("RGBA")
    
    # Convert white background to transparent
    data = np.array(img)
    r, g, b, a = data[:, :, 0], data[:, :, 1], data[:, :, 2], data[:, :, 3]
    
    # White background threshold
    white_mask = (r > 240) & (g > 240) & (b > 240)
    data[:, :, 3] = np.where(white_mask, 0, 255)
    
    clean_suit = Image.fromarray(data)
    clean_suit.save(OUT_DIR / out_name, "PNG")
    print(f"Saved {OUT_DIR / out_name}")
