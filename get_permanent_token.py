"""
Get a PERMANENT (Never Expires) Facebook Page Access Token.

Usage:
    1. Go to https://developers.facebook.com/tools/explorer/
    2. Select your app, click "Generate Access Token"
    3. Grant permissions: pages_manage_posts, pages_read_engagement, pages_show_list
    4. Copy the token
    5. Run: python get_permanent_token.py YOUR_SHORT_LIVED_TOKEN
"""

import sys
import os
import requests
from dotenv import load_dotenv

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

load_dotenv()

APP_ID = os.getenv("FB_APP_ID", "")
APP_SECRET = os.getenv("FB_APP_SECRET", "")
PAGE_ID = os.getenv("FB_PAGE_ID", "")


def main():
    if len(sys.argv) < 2:
        print("❌ Usage: python get_permanent_token.py YOUR_SHORT_LIVED_TOKEN")
        print()
        print("Get a short-lived token from:")
        print("  https://developers.facebook.com/tools/explorer/")
        sys.exit(1)

    short_token = sys.argv[1]

    if not APP_ID or not APP_SECRET:
        print("❌ FB_APP_ID and FB_APP_SECRET must be set in .env")
        sys.exit(1)

    # Step 1: Exchange short-lived token for long-lived user token
    print("🔄 Step 1: Exchanging for long-lived user token...")
    r = requests.get(
        "https://graph.facebook.com/v21.0/oauth/access_token",
        params={
            "grant_type": "fb_exchange_token",
            "client_id": APP_ID,
            "client_secret": APP_SECRET,
            "fb_exchange_token": short_token,
        },
    )
    data = r.json()

    if "error" in data:
        print(f"❌ Error: {data['error']['message']}")
        sys.exit(1)

    long_lived_user_token = data["access_token"]
    print(f"✅ Got long-lived user token!")

    # Step 2: Get permanent page token
    print(f"🔄 Step 2: Getting permanent page token for page {PAGE_ID}...")
    r = requests.get(
        f"https://graph.facebook.com/v21.0/{PAGE_ID}",
        params={
            "fields": "access_token,name",
            "access_token": long_lived_user_token,
        },
    )
    data = r.json()

    if "error" in data:
        print(f"❌ Error: {data['error']['message']}")
        sys.exit(1)

    page_token = data["access_token"]
    page_name = data.get("name", "Unknown")

    # Step 3: Verify it never expires
    print("🔄 Step 3: Verifying token...")
    r = requests.get(
        "https://graph.facebook.com/v21.0/debug_token",
        params={
            "input_token": page_token,
            "access_token": f"{APP_ID}|{APP_SECRET}",
        },
    )
    debug_data = r.json().get("data", {})
    expires = debug_data.get("expires_at", 0)

    if expires == 0:
        print("✅ Token NEVER EXPIRES! 🎉")
    else:
        print(f"⚠️  Token expires at: {expires}")

    print()
    print(f"📘 Page: {page_name}")
    print(f"🔑 Permanent Token:")
    print(page_token)
    print()

    # Step 4: Auto-update .env
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    with open(env_path, "r") as f:
        content = f.read()

    # Replace old token
    lines = content.split("\n")
    for i, line in enumerate(lines):
        if line.startswith("FB_PAGE_ACCESS_TOKEN="):
            lines[i] = f"FB_PAGE_ACCESS_TOKEN={page_token}"
            break

    with open(env_path, "w") as f:
        f.write("\n".join(lines))

    print("✅ .env updated automatically!")
    print("👉 Now run: python update.py")


if __name__ == "__main__":
    main()
