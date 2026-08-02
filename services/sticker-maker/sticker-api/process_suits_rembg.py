"""
Process suit template images using rembg AI to correctly separate
the suit (including white shirt) from the white background.
The AI understands clothing vs background, keeping shirts solid.
"""
import sys
from pathlib import Path
from PIL import Image

# Install rembg if needed
try:
    from rembg import remove, new_session
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "rembg", "onnxruntime"])
    from rembg import remove, new_session

BRAIN_DIR = Path(r"C:\Users\chhoy\.gemini\antigravity-ide\brain\3a7e1d41-181c-48a1-9bd1-5462fadbe597")
OUT_DIR = Path(r"d:\Project\CamTech\services\sticker-maker\sticker-api\app\assets\suits")

suit_types = {
    "suit_men_black": "men_black_suit.png",
    "suit_doctor_white": "doctor_white_coat.png",
    "suit_women_blazer": "women_black_blazer.png",
}

# Use the full u2net model for best quality
print("Loading u2net AI model...")
try:
    session = new_session("u2net")
except Exception:
    session = None

for prefix, out_name in suit_types.items():
    matches = list(BRAIN_DIR.glob(f"{prefix}_*.png"))
    if not matches:
        print(f"  No source image for {prefix}, skipping")
        continue

    src_file = matches[-1]
    print(f"Processing {src_file.name} -> {out_name}")

    raw = Image.open(src_file).convert("RGB")

    # Use rembg AI to intelligently remove the background
    # The neural network understands that the white shirt is CLOTHING, not background
    if session:
        cutout = remove(raw, session=session)
    else:
        cutout = remove(raw)

    cutout = cutout.convert("RGBA")
    
    # Verify the white shirt is still opaque
    # Sample a pixel in the center-top shirt area
    w, h = cutout.size
    shirt_pixel = cutout.getpixel((w // 2, int(h * 0.20)))
    print(f"  Shirt center pixel: RGBA{shirt_pixel}")
    print(f"  Size: {w}x{h}")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    cutout.save(OUT_DIR / out_name, "PNG")
    print(f"  Saved -> {OUT_DIR / out_name}")

print("\nDone! All suit templates processed with AI background removal.")
