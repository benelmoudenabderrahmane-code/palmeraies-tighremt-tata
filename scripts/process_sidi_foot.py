"""Optimise les photos SIDI OASIS TERRAIN DE FOOT pour le web : rotation EXIF, resize, compression."""
import os
from PIL import Image, ImageOps

SRC  = "002_Sidi_Oua3ziz_Terrain_Foot"
DST  = os.path.join("public", "images", "tighremt")
MAX_W   = 1600
QUALITY = 82

os.makedirs(DST, exist_ok=True)

all_files = sorted([
    f for f in os.listdir(SRC)
    if f.lower().endswith((".jpg", ".jpeg"))
])

AVANT_NAME = "AVANT.JPG"
APRES_NAME = "APRES.JPG"
gallery_files = [f for f in all_files if f not in (AVANT_NAME, APRES_NAME)]

def process(src_name, dst_name):
    src_path = os.path.join(SRC, src_name)
    dst_path = os.path.join(DST, dst_name)
    with Image.open(src_path) as im:
        im = ImageOps.exif_transpose(im)
        if im.mode != "RGB":
            im = im.convert("RGB")
        if im.width > MAX_W:
            h = round(im.height * MAX_W / im.width)
            im = im.resize((MAX_W, h), Image.LANCZOS)
        im.save(dst_path, "JPEG", quality=QUALITY, optimize=True, progressive=True)
    kb = os.path.getsize(dst_path) // 1024
    print(f"  {dst_name:26s}  {im.width}x{im.height}  {kb} KB")

print("Slider avant/après :")
process(AVANT_NAME, "sidi-foot-avant.jpg")
process(APRES_NAME, "sidi-foot-apres.jpg")

print(f"\nGalerie ({len(gallery_files)} photos) :")
for i, fname in enumerate(gallery_files, start=1):
    process(fname, f"sidi-foot-g{i}.jpg")

print(f"\nOK — {len(gallery_files)} photos galerie + 2 slider traitées")
