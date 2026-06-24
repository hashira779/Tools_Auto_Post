"""User-facing errors raised by the lyric subtitle pipeline."""


class SrtBotError(Exception):
    """Base exception with a Telegram-safe user message."""

    user_message = "SRT generation failed."

    def __init__(self, message: str | None = None):
        super().__init__(message or self.user_message)


class InvalidYouTubeLink(SrtBotError):
    user_message = "Invalid YouTube link. Please send a valid YouTube or YouTube Music URL."


class MissingLyricsText(SrtBotError):
    user_message = "Missing lyrics text. Please send the Khmer lyrics as plain text."


class DownloadFailed(SrtBotError):
    user_message = "Download failed. Please try another YouTube song link."


class AudioTooLong(SrtBotError):
    user_message = "Audio too long. Please send a shorter song."


class SrtGenerationFailed(SrtBotError):
    user_message = "SRT generation failed. Please try again with clearer audio or shorter lyrics."

