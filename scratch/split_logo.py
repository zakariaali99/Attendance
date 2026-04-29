import os
from PIL import Image

def split_logo(source_path):
    if not os.path.exists(source_path):
        print(f"File {source_path} not found")
        return

    img = Image.open(source_path)
    # Convert to RGBA if not already
    img = img.convert("RGBA")
    
    # Simple split: Top half is usually the icon, bottom half is text in these vertical logos
    width, height = img.size
    
    # Crop 1: The Clock (Top part)
    # Let's assume the clock is roughly the top 60%
    clock_crop = img.crop((0, 0, width, int(height * 0.65)))
    # Trim transparency
    bbox = clock_crop.getbbox()
    if bbox:
        clock_crop = clock_crop.crop(bbox)
    clock_crop.save("logos/clock_icon.png")
    print("Saved logos/clock_icon.png")

    # Crop 2: The Text (Bottom part)
    text_crop = img.crop((0, int(height * 0.65), width, height))
    bbox = text_crop.getbbox()
    if bbox:
        text_crop = text_crop.crop(bbox)
    text_crop.save("logos/text_logo.png")
    print("Saved logos/text_logo.png")

if __name__ == "__main__":
    split_logo("logos/arabic_logo_structured.png")
