#!/bin/bash
# Start the Facebook bot in the background
python -u fb_bot.py &
# Start the main bot in the foreground
python -u main.py
