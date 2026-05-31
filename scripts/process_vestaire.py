"""Optimise les photos VESTAIRE pour le web."""
import os
from PIL import Image, ImageOps

SRC  = "photo de vestaire"
DST  = os.path.join("public", "images", "tighremt")
MAX_W, QUALITY = 1600, 82

os.makedirs(DST, exist_ok=True)
files = sorted([f for f in os.listdir(SRC) if f.lower().endswith((".jpg",".jpeg"))])

for i, fname in enumerate(files, 1):
    dst = f"vest-g{i}.jpg"
    with Image.open(os.path.join(SRC, fname)) as im:
        im = ImageOps.exif_transpose(im)
        if im.mode != "RGB": im = im.convert("RGB")
        if im.width > MAX_W:
            im = im.resize((MAX_W, round(im.height * MAX_W / im.width)), Image.LANCZOS)
        im.save(os.path.join(DST, dst), "JPEG", quality=QUALITY, optimize=True, progressive=True)
    print(f"  {dst:14s}  {im.width}x{im.height}  {os.path.getsize(os.path.join(DST,dst))//1024} KB")

print(f"OK — {len(files)} photos vestaire")
