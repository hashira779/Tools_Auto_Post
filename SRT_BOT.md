# YouTube Khmer Lyrics SRT Bot

Run:

```bash
python main.py
```

## Telegram Commands

- `/start` - Show bot help.
- `/srt` - Generate `song.srt` and `song.lrc`.
- `/srt 00:10` - Generate subtitles and force the first lyric to start at 10 seconds.
- `/srt video` - Generate `song.srt`, `song.lrc`, and `lyric_video.mp4`.
- `/srtmp4` - Alias for `/srt video`.
- `/cancel` - Cancel the active `/srt` flow.

Only process songs you own or have permission to use.

## SRT Flow

1. User sends `/srt`.
2. Bot asks for a YouTube song link.
3. User sends the YouTube URL.
4. Bot asks for Khmer lyrics/script text.
5. User sends lyrics text. Each non-empty line becomes one subtitle line.
6. Bot saves `lyrics.txt`.
7. Bot downloads audio as MP3 with `yt-dlp`.
8. **Bot separates vocals** from background music using Demucs (if enabled).
9. **Bot runs KFA** (Khmer Forced Aligner) on the clean vocal track to detect per-word timing.
10. Bot maps the user-provided Khmer lyrics to detected timestamps.
11. Bot returns `song.srt` and `song.lrc`, then cleans temporary files.

For `/srt video`, the bot asks for a background image after lyrics and returns an MP4 lyric video if the file is small enough for Telegram.

## Alignment Accuracy

The bot uses a three-layer alignment strategy for maximum accuracy:

1. **Vocal Separation** (Demucs) — strips background music so the aligner only hears the singer's voice. This is the biggest accuracy improvement for songs with heavy instrumentation.
2. **KFA** (Khmer Forced Aligner) — a Khmer-specific Wav2Vec2 model that produces word-level timestamps. Much more accurate than generic models for Khmer.
3. **CTC Forced Aligner** (fallback) — used if KFA is not available.
4. **Whisper** (final fallback) — detects voiced segments and distributes lyrics by character weight.

The bot tries each layer in order and falls back to the next if one fails.

## Progress Messages

- `Downloading audio`
- `Separating vocals`
- `Processing audio`
- `Matching lyrics`
- `Generating SRT`
- `Done`

## Project Structure

```text
AUTO_POST/
  main.py
  config.py
  requirements.txt
  .env.example
  bot/
    handlers.py
    srt_handlers.py
    keyboards.py
  lyrics_srt/
    __init__.py
    errors.py
    exporters.py
    ffmpeg.py
    forced_alignment.py
    timing.py
    video.py
    vocal_separator.py
    youtube_audio.py
  downloader/
  youtube/
  tiktok/
  facebook/
  utils/
  downloads/
    srt/
```

## Environment

Copy `.env.example` to `.env` and set:

```env
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
SRT_WORK_DIR=./downloads/srt
SRT_MAX_AUDIO_SECONDS=900
SRT_WHISPER_MODEL=base
SRT_WHISPER_LANGUAGE=km
SRT_MAX_CONCURRENT_TASKS=1
SRT_MAX_TELEGRAM_FILE_MB=45
SRT_FALLBACK_START_SECONDS=10
SRT_LATE_WHISPER_START_SECONDS=30
SRT_VOCAL_SEPARATION=true
SRT_DEMUCS_MODEL=htdemucs
```

### Vocal Separation

When `SRT_VOCAL_SEPARATION=true`, the bot uses Demucs to isolate vocals before alignment. This dramatically improves timing accuracy for songs with loud background music.

- Set to `false` if you don't have enough RAM (needs ~4 GB) or want faster processing.
- `SRT_DEMUCS_MODEL` can be `htdemucs` (default, best quality) or `htdemucs_ft` (fine-tuned, slightly better but slower).

### Whisper Model Notes

- `tiny` is fastest but less accurate.
- `base` is a reasonable default.
- `small` or larger may improve timing but need more CPU/RAM/GPU.

If Whisper detects the first Khmer lyric too late, the bot shifts the timing to `SRT_FALLBACK_START_SECONDS`. For a specific song, use a command like:

```text
/srt 00:10
```

## Open-source Tools Used

- `python-telegram-bot`
- `yt-dlp`
- `openai-whisper`
- `demucs` — Meta's vocal/music source separation
- `kfa` — Khmer Forced Aligner (Wav2Vec2 + Phonetisaurus)
- `ctc-forced-aligner` — generic CTC alignment (fallback)
- `ffmpeg` through system FFmpeg or `imageio-ffmpeg`
