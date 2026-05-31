"""Optimise les photos TIGHREMT PHOTO pour la galerie."""
import os
from PIL import Image, ImageOps

SRC  = "tighremt photo"
DST  = os.path.join("public", "images", "tighremt")
MAX_W, QUALITY = 1600, 82

os.makedirs(DST, exist_ok=True)
files = sorted([f for f in os.listdir(SRC) if f.lower().endswith((".jpg",".jpeg"))])

for i, fname in enumerate(files, 1):
    dst = f"tigh-g{i}.jpg"
    with Image.open(os.path.join(SRC, fname)) as im:
        im = ImageOps.exif_transpose(im)
        if im.mode != "RGB": im = im.convert("RGB")
        if im.width > MAX_W:
            im = im.resize((MAX_W, round(im.height * MAX_W / im.width)), Image.LANCZOS)
        im.save(os.path.join(DST, dst), "JPEG", quality=QUALITY, optimize=True, progressive=True)
    kb = os.path.getsize(os.path.join(DST, dst)) // 1024
    orient = "portrait" if im.height > im.width else "landscape"
    print(f"  {dst:14s}  {im.width}x{im.height}  {kb} KB  [{orient}]")

print(f"OK — {len(files)} photos tighremt galerie")
