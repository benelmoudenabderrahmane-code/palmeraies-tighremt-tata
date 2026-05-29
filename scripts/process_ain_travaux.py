"""Optimise les photos AIN TRAVAUX pour le web : rotation EXIF, resize, compression."""
import os
from PIL import Image, ImageOps

SRC = "AIN TRAVAUX"
DST = os.path.join("public", "images", "tighremt")
MAX_W = 1600
QUALITY = 82

# (source, destination)
JOBS = [
    ("AVANT.jpg",            "ain-avant.jpg"),
    ("APRES.JPG",            "ain-apres.jpg"),
    ("DSCN0042.JPG",         "ain-g1.jpg"),
    ("20161220_115631.jpg",  "ain-g2.jpg"),
    ("DSCN0094.JPG",         "ain-g3.jpg"),
    ("DSCN0107.JPG",         "ain-g4.jpg"),
    ("DSCN0114.JPG",         "ain-g5.jpg"),
    ("20161220_115825.jpg",  "ain-g6.jpg"),
]

os.makedirs(DST, exist_ok=True)

for src_name, dst_name in JOBS:
    src_path = os.path.join(SRC, src_name)
    dst_path = os.path.join(DST, dst_name)
    with Image.open(src_path) as im:
        im = ImageOps.exif_transpose(im)        # applique la rotation EXIF
        if im.mode != "RGB":
            im = im.convert("RGB")
        if im.width > MAX_W:
            h = round(im.height * MAX_W / im.width)
            im = im.resize((MAX_W, h), Image.LANCZOS)
        im.save(dst_path, "JPEG", quality=QUALITY, optimize=True, progressive=True)
    kb = os.path.getsize(dst_path) // 1024
    print(f"{dst_name:16s} {im.width}x{im.height}  {kb} KB")

print("OK")
