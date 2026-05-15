import asyncio
import os
import shutil
from io import BytesIO
from pathlib import Path
from typing import Literal

import httpx
from PIL import Image

MUSIC_DIR = Path(__file__).parent.parent / "assets" / "music"
Format = Literal["9:16", "16:9"]


def _get_dimensions(fmt: Format) -> tuple[int, int]:
    return (1080, 1920) if fmt == "9:16" else (1920, 1080)


async def _download_image(url: str) -> Image.Image | None:
    try:
        async with httpx.AsyncClient(timeout=12, follow_redirects=True) as c:
            r = await c.get(url)
            if r.status_code == 200:
                return Image.open(BytesIO(r.content)).convert("RGB")
    except Exception:
        return None
    return None


async def generate_video(
    script_sections: dict,
    image_urls: list[str],
    audio_path: str,
    output_path: str,
    product_name: str,
    affiliate_link: str,
    fmt: Format = "9:16",
) -> str:
    """
    Build a product video using FFmpeg:
      - Slides with Ken Burns zoom effect
      - Voiceover audio
      - Caption overlay
      - Optional background music (royalty-free MP3 from assets/music/)
    Returns the path to the generated video file.
    """
    W, H = _get_dimensions(fmt)
    work_dir = Path(output_path).parent / "_tmp_slides"
    work_dir.mkdir(parents=True, exist_ok=True)

    # 1. Prepare slide images
    slides: list[str] = []
    for i, url in enumerate(image_urls[:5]):
        slide_img = await _download_image(url)
        if slide_img:
            # Fill canvas without distortion
            canvas = Image.new("RGB", (W, H), (30, 30, 30))
            slide_img.thumbnail((W, H), Image.LANCZOS)
            offset_x = (W - slide_img.width) // 2
            offset_y = (H - slide_img.height) // 2
            canvas.paste(slide_img, (offset_x, offset_y))
            path = str(work_dir / f"slide_{i:02d}.jpg")
            canvas.save(path, "JPEG", quality=90)
            slides.append(path)

    if not slides:
        # Create a solid-color slide with product name
        canvas = Image.new("RGB", (W, H), (20, 20, 50))
        path = str(work_dir / "slide_00.jpg")
        canvas.save(path)
        slides.append(path)

    slide_duration = 4  # seconds per slide

    # 2. Build FFmpeg command
    # Each slide: loop + Ken Burns zoom/pan
    # Then concat → add voiceover + optional music → caption overlay
    inputs: list[str] = []
    for slide in slides:
        inputs += ["-loop", "1", "-t", str(slide_duration), "-i", slide]
    inputs += ["-i", audio_path]

    music_files = list(MUSIC_DIR.glob("*.mp3"))
    has_music = bool(music_files)
    if has_music:
        inputs += ["-i", str(music_files[0])]

    n = len(slides)
    voice_idx = n
    music_idx = n + 1 if has_music else None

    # Ken Burns effect per slide: slow zoom from 1.0× to 1.1×
    filter_parts: list[str] = []
    for i in range(n):
        total_frames = slide_duration * 25
        filter_parts.append(
            f"[{i}:v]scale={W * 2}:{H * 2},"
            f"zoompan=z='min(zoom+0.0004,1.1)':"
            f"x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':"
            f"d={total_frames}:s={W}x{H}:fps=25[kb{i}]"
        )

    # Concat all slides
    concat_in = "".join(f"[kb{i}]" for i in range(n))
    filter_parts.append(f"{concat_in}concat=n={n}:v=1:a=0[vraw]")

    # Caption bar at the bottom — use textfile to fully avoid FFmpeg drawtext escaping hell.
    # Apostrophes, colons, %, commas, accents all break drawtext when inline.
    caption_text = product_name[:50]
    # Strip non-ASCII to avoid font/encoding issues with default fonts
    caption_ascii = caption_text.encode("ascii", "ignore").decode("ascii").strip()
    if not caption_ascii:
        caption_ascii = "Best Deal"
    caption_file = work_dir / "caption.txt"
    caption_file.write_text(caption_ascii, encoding="ascii")
    # textfile path: forward slashes only, escape colon for Windows drive letter
    caption_path = str(caption_file).replace("\\", "/").replace(":", "\\:")
    filter_parts.append(
        f"[vraw]drawtext="
        f"textfile='{caption_path}':"
        f"fontsize=42:fontcolor=white:"
        f"box=1:boxcolor=black@0.65:boxborderw=10:"
        f"x=(w-text_w)/2:y=h-100[vcap]"
    )

    # Audio: mix voice + background music (music at 10% volume)
    if has_music:
        filter_parts.append(
            f"[{voice_idx}:a]aformat=sample_rates=44100:channel_layouts=stereo[voice];"
            f"[{music_idx}:a]volume=0.10,"
            f"aformat=sample_rates=44100:channel_layouts=stereo[music];"
            f"[voice][music]amix=inputs=2:duration=first[aout]"
        )
        audio_map = "[aout]"
    else:
        audio_map = f"{voice_idx}:a"

    filter_complex = ";".join(filter_parts)

    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)

    cmd = (
        ["ffmpeg", "-y"]
        + inputs
        + [
            "-filter_complex", filter_complex,
            "-map", "[vcap]",
            "-map", audio_map,
            "-c:v", "libx264",
            "-preset", "fast",
            "-crf", "23",
            "-c:a", "aac",
            "-b:a", "128k",
            "-pix_fmt", "yuv420p",
            "-shortest",
            output_path,
        ]
    )

    proc = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    _, stderr = await proc.communicate()

    if proc.returncode != 0:
        raise RuntimeError(f"FFmpeg failed (exit {proc.returncode}): {stderr.decode()[-1000:]}")

    shutil.rmtree(work_dir, ignore_errors=True)
    return output_path
