"""Optimise les photos AIN TRAVAUX pour le web : rotation EXIF, resize, compression."""
import os
from PIL import Image, ImageOps

SRC = "AIN TRAVAUX"
DST = os.path.join("public", "images", "tighremt")
MAX_W = 1600
QUALITY = 82

# (source, destination)
# Before/after slider images (kept as-is — already processed)
# ain-avant.jpg  ← AVANT.jpg  (source deleted, public copy kept)
# ain-apres.jpg  ← APRES.JPG  (source deleted, public copy kept)

# Gallery: all remaining photos after user curation (20 photos)
JOBS = [
    ("APRES (2).JPG",            "ain-g1.jpg"),
    ("DSCN0058.JPG",             "ain-g2.jpg"),
    ("DSCN0067.JPG",             "ain-g3.jpg"),
    ("DSCN0077.JPG",             "ain-g4.jpg"),
    ("DSCN0081.JPG",             "ain-g5.jpg"),
    ("DSCN0086.JPG",             "ain-g6.jpg"),
    ("DSCN0087.JPG",             "ain-g7.jpg"),
    ("DSCN0088.JPG",             "ain-g8.jpg"),
    ("DSCN0089.JPG",             "ain-g9.jpg"),
    ("DSCN0090.JPG",             "ain-g10.jpg"),
    ("DSCN0112.JPG",             "ain-g11.jpg"),
    ("DSCN0116.JPG",             "ain-g12.jpg"),
    ("DSCN0118.JPG",             "ain-g13.jpg"),
    ("DSCN0119.JPG",             "ain-g14.jpg"),
    ("DSCN0120.JPG",             "ain-g15.jpg"),
    ("DSCN0121.JPG",             "ain-g16.jpg"),
    ("DSCN0144.JPG",             "ain-g17.jpg"),
    ("DSCN0159.JPG",             "ain-g18.jpg"),
    ("IMG_20161125_110044.jpg",  "ain-g19.jpg"),
    ("IMG_20161125_110148.jpg",  "ain-g20.jpg"),
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

print("OK — 20 photos traitées")
