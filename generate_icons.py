import os
from PIL import Image

def create_icons(source_png, output_dir):
    if not os.path.exists(source_png):
        print(f"Source image {source_png} not found.")
        return

    os.makedirs(output_dir, exist_ok=True)
    img = Image.open(source_png)

    # Windows Icon
    ico_path = os.path.join(output_dir, 'app_icon.ico')
    img.save(ico_path, format='ICO', sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
    print(f"Created {ico_path}")

    # macOS Icon (Basic version using PNG, PyInstaller handles it or we can use iconutil if available)
    # For now, we'll just save it as a high-res PNG and let PyInstaller try to handle it, 
    # or just name it .icns if we were on a system that could convert it.
    # Actually, PyInstaller on Mac prefers .icns.
    # We'll just provide the path to the PNG to the build script as a fallback.

if __name__ == "__main__":
    create_icons('logos/icon_logo.png', 'logos')
