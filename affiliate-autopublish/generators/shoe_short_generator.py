"""
Shoe Short Generator — Full AI Pipeline
========================================
Takes local shoe photos + AI-generated script → creates a 30-second YouTube Short.

Two modes:
  1. Simple mode  — photos only (no script), basic Ken Burns + generic overlays
  2. Script mode  — photos + script dict → 5-segment structure with timed overlays

Style (based on reference video analysis + prompt spec):
  • 9:16 vertical, 1080×1920, 30 FPS
  • 30 seconds exactly (script mode) or 10–20s (simple mode)
  • No voice-over — pure visual ASMR
  • Ken Burns zoom alternating direction per segment
  • Bold text overlays timed to each segment (FFmpeg drawtext enable)
  • Black letterbox bars top+bottom for cinematic feel
  • Cut to black on final frame
"""
import asyncio
import os
import re
import shutil
from pathlib import Path
from typing import Literal

from PIL import Image, ImageDraw, ImageFont

W, H = 1080, 1920
FPS = 30
ASSETS_DIR = Path(__file__).parent.parent / "assets"
SOUNDS_DIR = ASSETS_DIR / "sounds"


# ── Helpers ──────────────────────────────────────────────────────────────────

def _fit_image_to_canvas(img: Image.Image, w: int = W, h: int = H) -> Image.Image:
    """Scale + center-crop to fill canvas exactly."""
    img = img.convert("RGB")
    img_ratio = img.width / img.height
    canvas_ratio = w / h
    if img_ratio > canvas_ratio:
        new_h = h
        new_w = int(img_ratio * h)
    else:
        new_w = w
        new_h = int(w / img_ratio)
    img = img.resize((new_w, new_h), Image.LANCZOS)
    x = (new_w - w) // 2
    y = (new_h - h) // 2
    return img.crop((x, y, x + w, y + h))


def _load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    candidates = []
    if bold:
        candidates = [
            str(ASSETS_DIR / "fonts" / "Montserrat-Bold.ttf"),
            "C:/Windows/Fonts/impact.ttf",
            "/c/Windows/Fonts/impact.ttf",
            "C:/Windows/Fonts/arialbd.ttf",
            "/c/Windows/Fonts/arialbd.ttf",
        ]
    else:
        candidates = [
            str(ASSETS_DIR / "fonts" / "Montserrat-Regular.ttf"),
            "C:/Windows/Fonts/arialbd.ttf",
            "/c/Windows/Fonts/arialbd.ttf",
            "C:/Windows/Fonts/arial.ttf",
            "/c/Windows/Fonts/arial.ttf",
        ]
    for path in candidates:
        try:
            return ImageFont.truetype(path, size)
        except Exception:
            pass
    return ImageFont.load_default()


def _prepare_slide(
    photo_path: str,
    work_dir: Path,
    idx: int,
    crop_hint: str = "full",   # "full" | "top" | "bottom" | "center" | "tight_logo" | "tight_sole"
) -> str:
    """
    Prepare a slide JPEG. crop_hint controls zoom/crop area to simulate cinematography.
    """
    img = Image.open(photo_path).convert("RGB")

    if crop_hint == "tight_sole":
        # Bottom 40% of image (sole area)
        crop_h = int(img.height * 0.45)
        img = img.crop((0, img.height - crop_h, img.width, img.height))
    elif crop_hint == "tight_logo":
        # Top-center 50% (usually where brand logo is)
        crop_h = int(img.height * 0.5)
        img = img.crop((int(img.width * 0.1), 0, int(img.width * 0.9), crop_h))
    elif crop_hint == "top":
        img = img.crop((0, 0, img.width, int(img.height * 0.6)))
    elif crop_hint == "bottom":
        img = img.crop((0, int(img.height * 0.4), img.width, img.height))

    canvas = _fit_image_to_canvas(img)

    # Dark vignette overlay for cinematic feel
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ov = ImageDraw.Draw(overlay)
    # Top gradient
    for row in range(0, 200):
        alpha = int(120 * (1 - row / 200))
        ov.line([(0, row), (W, row)], fill=(0, 0, 0, alpha))
    # Bottom gradient
    for row in range(H - 320, H):
        alpha = int(200 * (row - (H - 320)) / 320)
        ov.line([(0, row), (W, row)], fill=(0, 0, 0, alpha))

    canvas = canvas.convert("RGBA")
    canvas = Image.alpha_composite(canvas, overlay).convert("RGB")

    out_path = str(work_dir / f"slide_{idx:02d}.jpg")
    canvas.save(out_path, "JPEG", quality=92)
    return out_path


def _escape_ffmpeg_text(text: str) -> str:
    """Escape text for FFmpeg drawtext (avoid special char crashes)."""
    # Remove emojis and non-ASCII to avoid font issues
    text = text.encode("ascii", "ignore").decode("ascii")
    # Escape FFmpeg special chars
    text = text.replace("\\", "\\\\")
    text = text.replace("'", "\\'")
    text = text.replace(":", "\\:")
    text = text.replace("[", "\\[")
    text = text.replace("]", "\\]")
    return text.strip()


def _assign_photos_to_segments(photo_paths: list[str], segments: list[dict]) -> dict[str, list[str]]:
    """
    Map available photos to script segments intelligently.
    photo_hint values: "hero" | "side_and_sole" | "detail_shots" | "on_feet"
    """
    n = len(photo_paths)
    mapping: dict[str, list[str]] = {}

    # Always have at least 1 photo
    hero = photo_paths[0]
    side = photo_paths[1] if n > 1 else hero
    detail1 = photo_paths[2] if n > 2 else side
    detail2 = photo_paths[3] if n > 3 else detail1
    detail3 = photo_paths[4] if n > 4 else detail2
    on_feet = photo_paths[n - 1] if n > 1 else hero  # last photo often on-feet

    for seg in segments:
        hint = seg.get("photo_hint", "hero")
        if hint == "hero":
            mapping[seg["id"]] = [hero]
        elif hint == "side_and_sole":
            mapping[seg["id"]] = [side, hero] if n > 1 else [hero]
        elif hint == "detail_shots":
            # Gros plans: use 3-4 detail photos
            details = [detail1, detail2, detail3]
            if n > 3:
                details.append(photo_paths[min(3, n - 1)])
            mapping[seg["id"]] = list(dict.fromkeys(details))  # deduplicate
        elif hint == "on_feet":
            mapping[seg["id"]] = [on_feet]
        else:
            mapping[seg["id"]] = [hero]

    return mapping


def _build_ffmpeg_command(
    slide_files: list[tuple[str, float]],  # (path, duration_seconds)
    output_path: str,
    text_layers: list[dict],  # [{text, start, end, y_pos, size, color}]
    total_duration: float,
    work_dir: Path,
) -> list[str]:
    """
    Build full FFmpeg command with:
    - Ken Burns per slide (alternating zoom)
    - xfade crossfades between slides
    - Timed drawtext overlays
    - Silent audio track
    """
    inputs: list[str] = []
    n = len(slide_files)

    for path, dur in slide_files:
        inputs += ["-loop", "1", "-t", str(dur), "-i", path]

    # Silent audio
    inputs += ["-f", "lavfi", "-i", f"anullsrc=r=44100:cl=stereo:d={total_duration}"]
    audio_idx = n

    filter_parts: list[str] = []

    # Ken Burns per slide — alternating direction
    for i, (_, dur) in enumerate(slide_files):
        frames = int(dur * FPS)
        if i % 2 == 0:
            zoom = "min(zoom+0.0004,1.12)"
            x_e = "iw/2-(iw/zoom/2)"
            y_e = "ih/2-(ih/zoom/2)"
        else:
            zoom = "max(zoom-0.0004,1.0)"
            x_e = "iw/2-(iw/zoom/2)"
            y_e = "ih/2-(ih/zoom/2)"

        filter_parts.append(
            f"[{i}:v]scale={W * 2}:{H * 2},"
            f"zoompan=z='{zoom}':x='{x_e}':y='{y_e}':"
            f"d={frames}:s={W}x{H}:fps={FPS}[kb{i}]"
        )

    # Crossfade between slides
    fade_dur = 0.25
    if n == 1:
        filter_parts.append("[kb0]copy[vconcat]")
    else:
        prev = "kb0"
        running_offset = 0.0
        for i in range(1, n):
            running_offset += slide_files[i - 1][1] - fade_dur
            out_tag = f"xf{i}" if i < n - 1 else "vconcat"
            filter_parts.append(
                f"[{prev}][kb{i}]xfade=transition=fade:duration={fade_dur}:"
                f"offset={running_offset:.3f}[{out_tag}]"
            )
            prev = f"xf{i}"

    # Timed text overlays — chain drawtext filters
    current_v = "vconcat"
    for idx, layer in enumerate(text_layers):
        out_v = f"vtxt{idx}" if idx < len(text_layers) - 1 else "vfinal"
        text = _escape_ffmpeg_text(layer["text"])
        if not text:
            continue
        t_start = layer["start"]
        t_end = layer["end"]
        size = layer.get("size", 58)
        color = layer.get("color", "white")
        y_pos = layer.get("y_pos", "h-220")
        shadow = layer.get("shadow", True)

        # Write text to file to avoid escaping hell with complex chars
        txt_file = work_dir / f"overlay_{idx}.txt"
        txt_file.write_text(text, encoding="ascii")
        txt_path = str(txt_file).replace("\\", "/").replace(":", "\\:")

        # Font path
        font_path = ""
        for fp in ["C:/Windows/Fonts/arialbd.ttf", "/c/Windows/Fonts/arialbd.ttf"]:
            if Path(fp.replace("/c/", "C:/")).exists():
                font_path = f":fontfile='{fp.replace(':', '\\:').replace('\\\\', '/')}'"
                break

        shadow_str = f":shadowcolor=black:shadowx=3:shadowy=3" if shadow else ""
        box_str = ":box=1:boxcolor=black@0.6:boxborderw=14" if layer.get("box", True) else ""

        filter_parts.append(
            f"[{current_v}]drawtext="
            f"textfile='{txt_path}'"
            f"{font_path}"
            f":fontsize={size}"
            f":fontcolor={color}"
            f"{box_str}"
            f"{shadow_str}"
            f":x=(w-text_w)/2"
            f":y={y_pos}"
            f":enable='between(t,{t_start},{t_end})'"
            f"[{out_v}]"
        )
        current_v = out_v

    # If no text layers were added, rename
    if not text_layers:
        filter_parts.append("[vconcat]copy[vfinal]")

    filter_complex = ";".join(filter_parts)

    cmd = (
        ["ffmpeg", "-y"]
        + inputs
        + [
            "-filter_complex", filter_complex,
            "-map", "[vfinal]",
            "-map", f"{audio_idx}:a",
            "-c:v", "libx264",
            "-preset", "fast",
            "-crf", "18",
            "-c:a", "aac",
            "-b:a", "96k",
            "-pix_fmt", "yuv420p",
            "-t", str(total_duration),
            output_path,
        ]
    )
    return cmd


# ── Public API ────────────────────────────────────────────────────────────────

async def generate_shoe_short(
    photo_paths: list[str],
    output_path: str,
    product_name: str,
    price: float | None = None,
    slide_duration: int = 3,
    script: dict | None = None,
) -> str:
    """
    Generate a 30-second (script mode) or 10–18s (simple mode) YouTube Short.

    Args:
        photo_paths:    absolute paths to shoe images
        output_path:    where to write the MP4
        product_name:   used for text overlay if no script
        price:          shown in gold on last slide (simple mode only)
        slide_duration: seconds per slide (simple mode)
        script:         full script dict from shoe_script_generator (optional)
                        If provided → 30-sec structured video with timed overlays.
                        If None → simple Ken Burns slideshow.
    Returns:
        output_path
    """
    if not photo_paths:
        raise ValueError("At least one photo is required")

    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    work_dir = Path(output_path).parent / "_tmp_shoe"
    work_dir.mkdir(parents=True, exist_ok=True)

    try:
        if script:
            return await _generate_scripted_short(photo_paths, output_path, script, work_dir)
        else:
            return await _generate_simple_short(photo_paths, output_path, product_name, price, slide_duration, work_dir)
    finally:
        shutil.rmtree(work_dir, ignore_errors=True)


async def _generate_scripted_short(
    photo_paths: list[str],
    output_path: str,
    script: dict,
    work_dir: Path,
) -> str:
    """30-second structured video with 5 segments and timed text overlays."""
    segments: list[dict] = script.get("segments", [])
    if not segments:
        raise ValueError("Script has no segments")

    # Map photos to segments
    photo_map = _assign_photos_to_segments(photo_paths, segments)

    # Build slide list with durations
    slide_files: list[tuple[str, float]] = []
    text_layers: list[dict] = []
    current_time = 0.0

    CROP_HINTS = {
        "hero":          ["full"],
        "side_and_sole": ["full", "tight_sole"],
        "detail_shots":  ["tight_logo", "full", "tight_sole", "full"],
        "on_feet":       ["full"],
    }

    for seg in segments:
        seg_id = seg["id"]
        seg_start = float(seg.get("start", current_time))
        seg_end = float(seg.get("end", seg_start + 3))
        seg_dur = seg_end - seg_start

        photos = photo_map.get(seg_id, [photo_paths[0]])
        hint = seg.get("photo_hint", "hero")
        crops = CROP_HINTS.get(hint, ["full"])

        # Distribute segment duration across its photos
        n_photos = len(photos)
        dur_each = seg_dur / n_photos

        for j, photo in enumerate(photos):
            slide_idx = len(slide_files)
            crop = crops[j % len(crops)]
            slide_path = _prepare_slide(photo, work_dir, slide_idx, crop_hint=crop)
            slide_files.append((slide_path, dur_each))

        # Text overlay for this segment
        overlay_text = seg.get("overlay", "")
        if overlay_text:
            # Y position varies by segment
            if seg_id == "hook":
                y_pos = "h*0.12"          # top area
                size = 72
                color = "white"
            elif seg_id == "cta":
                y_pos = "h/2-50"          # centered
                size = 62
                color = "white"
            else:
                y_pos = "h-280"           # bottom
                size = 52
                color = "white"

            text_layers.append({
                "text": overlay_text,
                "start": seg_start,
                "end": seg_end,
                "y_pos": y_pos,
                "size": size,
                "color": color,
                "box": seg_id not in ("hook",),
            })

        current_time = seg_end

    total_duration = float(segments[-1].get("end", 30))

    cmd = _build_ffmpeg_command(slide_files, output_path, text_layers, total_duration, work_dir)

    proc = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    _, stderr = await proc.communicate()

    if proc.returncode != 0:
        raise RuntimeError(f"FFmpeg failed (exit {proc.returncode}):\n{stderr.decode()[-2000:]}")

    return output_path


async def _generate_simple_short(
    photo_paths: list[str],
    output_path: str,
    product_name: str,
    price: float | None,
    slide_duration: int,
    work_dir: Path,
) -> str:
    """Simple mode: Ken Burns slideshow, generic overlays."""
    MAX_SLIDES = 6
    MIN_SLIDES = 3
    slides_src = photo_paths[:MAX_SLIDES]
    while len(slides_src) < MIN_SLIDES:
        slides_src = (slides_src * ((MIN_SLIDES // len(slides_src)) + 1))[:MIN_SLIDES]

    slide_files: list[tuple[str, float]] = []
    for i, photo in enumerate(slides_src):
        sp = _prepare_slide(photo, work_dir, i, crop_hint="full")
        slide_files.append((sp, float(slide_duration)))

    total_duration = slide_duration * len(slide_files)

    # Simple overlays
    text_layers = [
        {
            "text": product_name[:50].encode("ascii", "ignore").decode(),
            "start": 0,
            "end": slide_duration,
            "y_pos": f"h*0.12",
            "size": 62,
            "color": "white",
            "box": False,
        },
    ]
    if price and price > 0:
        text_layers.append({
            "text": f"EUR {price:.2f}",
            "start": total_duration - slide_duration,
            "end": total_duration,
            "y_pos": "h/2-40",
            "size": 80,
            "color": "white",
            "box": True,
        })
        text_layers.append({
            "text": "Lien en description",
            "start": total_duration - slide_duration,
            "end": total_duration,
            "y_pos": "h/2+60",
            "size": 44,
            "color": "white",
            "box": False,
        })

    cmd = _build_ffmpeg_command(slide_files, output_path, text_layers, total_duration, work_dir)

    proc = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    _, stderr = await proc.communicate()

    if proc.returncode != 0:
        raise RuntimeError(f"FFmpeg failed (exit {proc.returncode}):\n{stderr.decode()[-2000:]}")

    return output_path
