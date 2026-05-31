"""Optimise les photos TOURNOI DE FOOT pour le web : rotation EXIF, resize, compression."""
import os, glob
from PIL import Image, ImageOps

SRC  = "tournoi de foot"
DST  = os.path.join("public", "images", "tighremt")
MAX_W   = 1600
QUALITY = 82

os.makedirs(DST, exist_ok=True)

# Récupère tous les JPG/JPEG du dossier source
all_files = sorted([
    f for f in os.listdir(SRC)
    if f.lower().endswith((".jpg", ".jpeg"))
])

# "photo avant et apres.JPG" → tournoi-avant.jpg (slider before)
# Reste → tournoi-g1.jpg … tournoi-gN.jpg
AVANT_NAME = "photo avant et apres.JPG"

gallery_files = [f for f in all_files if f != AVANT_NAME]
count = 0

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
    print(f"  {dst_name:22s}  {im.width}x{im.height}  {kb} KB")

# Avant/après slider
if AVANT_NAME in all_files:
    print("Slider avant/après :")
    process(AVANT_NAME, "tournoi-avant.jpg")

# Galerie
print(f"\nGalerie ({len(gallery_files)} photos) :")
for i, fname in enumerate(gallery_files, start=1):
    process(fname, f"tournoi-g{i}.jpg")
    count = i

print(f"\nOK — {count} photos galerie traitées")
