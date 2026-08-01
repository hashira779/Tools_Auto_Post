"""
Logging configuration for the Auto Post service.
Provides structured logging with colored console output and file logging.
"""

import logging
import sys
from pathlib import Path


# ANSI color codes for console output
class Colors:
    RESET = "\033[0m"
    RED = "\033[31m"
    GREEN = "\033[32m"
    YELLOW = "\033[33m"
    BLUE = "\033[34m"
    MAGENTA = "\033[35m"
    CYAN = "\033[36m"
    GRAY = "\033[90m"


class ColoredFormatter(logging.Formatter):
    """Custom formatter with colored level names for console output."""

    LEVEL_COLORS = {
        logging.DEBUG: Colors.GRAY,
        logging.INFO: Colors.GREEN,
        logging.WARNING: Colors.YELLOW,
        logging.ERROR: Colors.RED,
        logging.CRITICAL: Colors.MAGENTA,
    }

    def format(self, record):
        color = self.LEVEL_COLORS.get(record.levelno, Colors.RESET)
        record.levelname = f"{color}{record.levelname:<8}{Colors.RESET}"
        record.name = f"{Colors.CYAN}{record.name}{Colors.RESET}"
        return super().format(record)


def setup_logger(name: str = "auto_post", level: str = "INFO") -> logging.Logger:
    """
    Set up and return a configured logger.

    Args:
        name: Logger name
        level: Log level string (DEBUG, INFO, WARNING, ERROR)

    Returns:
        Configured logging.Logger instance
    """
    logger = logging.getLogger(name)

    # Prevent duplicate handlers if called multiple times
    if logger.handlers:
        return logger

    logger.setLevel(getattr(logging, level.upper(), logging.INFO))

    # Console handler with colors
    if sys.platform == "win32":
        sys.stdout.reconfigure(encoding="utf-8")
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.DEBUG)
    console_fmt = ColoredFormatter(
        fmt="%(asctime)s │ %(levelname)s │ %(name)s │ %(message)s",
        datefmt="%H:%M:%S",
    )
    console_handler.setFormatter(console_fmt)
    logger.addHandler(console_handler)

    # File handler (plain text, no colors)
    log_dir = Path(__file__).parent.parent
    file_handler = logging.FileHandler(log_dir / "auto_post.log", encoding="utf-8")
    file_handler.setLevel(logging.DEBUG)
    file_fmt = logging.Formatter(
        fmt="%(asctime)s │ %(levelname)-8s │ %(name)s │ %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    file_handler.setFormatter(file_fmt)
    logger.addHandler(file_handler)

    return logger


# Create the main application logger
def get_logger(module_name: str = "auto_post") -> logging.Logger:
    """Get a child logger for a specific module."""
    return logging.getLogger(f"auto_post.{module_name}")
