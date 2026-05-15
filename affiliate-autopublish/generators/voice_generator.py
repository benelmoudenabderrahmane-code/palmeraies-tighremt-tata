import asyncio
import os
from config.settings import get_settings

settings = get_settings()


async def generate_voice(text: str, output_path: str, use_elevenlabs: bool = False) -> str:
    """
    Generate MP3 voiceover.
    Uses ElevenLabs if key is set and use_elevenlabs=True, otherwise gTTS (completely free).
    """
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)

    if use_elevenlabs and settings.elevenlabs_api_key:
        try:
            from elevenlabs.client import ElevenLabs
            client = ElevenLabs(api_key=settings.elevenlabs_api_key)
            audio_generator = client.generate(
                text=text,
                voice=settings.elevenlabs_voice_id,
                model="eleven_turbo_v2",
            )
            with open(output_path, "wb") as f:
                for chunk in audio_generator:
                    f.write(chunk)
            return output_path
        except Exception:
            # Fall through to gTTS if ElevenLabs fails
            pass

    # gTTS — completely free, no API key needed
    from gtts import gTTS
    tts = gTTS(text=text, lang="en", slow=False)
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, tts.save, output_path)
    return output_path
