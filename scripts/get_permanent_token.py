import sys
import os
import requests
from dotenv import load_dotenv, set_key

def generate_permanent_token(short_token: str) -> dict:
    """
    Exchange a short-lived token for a permanent page token.
    Returns:
        dict: {"success": True, "token": "...", "page_name": "...", "expires": 0}
              or {"success": False, "error": "..."}
    """
    # Reload in case they were updated
    load_dotenv()
    
    app_id = os.getenv("FB_APP_ID", "")
    app_secret = os.getenv("FB_APP_SECRET", "")
    page_id = os.getenv("FB_PAGE_ID", "")

    if not app_id or not app_secret or not page_id:
        return {"success": False, "error": "FB_APP_ID, FB_APP_SECRET, and FB_PAGE_ID must be set in .env"}

    # Step 1: Exchange short-lived token for long-lived user token
    r = requests.get(
        "https://graph.facebook.com/v21.0/oauth/access_token",
        params={
            "grant_type": "fb_exchange_token",
            "client_id": app_id,
            "client_secret": app_secret,
            "fb_exchange_token": short_token,
        },
    )
    data = r.json()

    if "error" in data:
        return {"success": False, "error": data['error']['message']}

    long_lived_user_token = data["access_token"]

    # Step 2: Get permanent page token
    r = requests.get(
        f"https://graph.facebook.com/v21.0/{page_id}",
        params={
            "fields": "access_token,name",
            "access_token": long_lived_user_token,
        },
    )
    data = r.json()

    if "error" in data:
        return {"success": False, "error": data['error']['message']}

    page_token = data["access_token"]
    page_name = data.get("name", "Unknown")

    # Step 3: Verify it
    r = requests.get(
        "https://graph.facebook.com/v21.0/debug_token",
        params={
            "input_token": page_token,
            "access_token": f"{app_id}|{app_secret}",
        },
    )
    debug_data = r.json().get("data", {})
    expires = debug_data.get("expires_at", 0)

    return {
        "success": True,
        "token": page_token,
        "page_name": page_name,
        "expires": expires
    }

def update_env_token(new_token: str):
    """Update the FB_PAGE_ACCESS_TOKEN in .env and os.environ"""
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    
    # Read existing content
    if os.path.exists(env_path):
        with open(env_path, "r") as f:
            content = f.read()
        
        lines = content.split("\n")
        updated = False
        for i, line in enumerate(lines):
            if line.startswith("FB_PAGE_ACCESS_TOKEN="):
                lines[i] = f"FB_PAGE_ACCESS_TOKEN={new_token}"
                updated = True
                break
                
        if not updated:
            lines.append(f"FB_PAGE_ACCESS_TOKEN={new_token}")
            
        with open(env_path, "w") as f:
            f.write("\n".join(lines))
    else:
        with open(env_path, "w") as f:
            f.write(f"FB_PAGE_ACCESS_TOKEN={new_token}\n")

    # Update in memory
    os.environ["FB_PAGE_ACCESS_TOKEN"] = new_token

def main():
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    
    if len(sys.argv) < 2:
        print("❌ Usage: python get_permanent_token.py YOUR_SHORT_LIVED_TOKEN")
        print()
        print("Get a short-lived token from:")
        print("  https://developers.facebook.com/tools/explorer/")
        sys.exit(1)

    short_token = sys.argv[1]
    
    print("🔄 Generating permanent token...")
    result = generate_permanent_token(short_token)
    
    if not result["success"]:
        print(f"❌ Error: {result['error']}")
        sys.exit(1)
        
    print("✅ Token NEVER EXPIRES! 🎉" if result["expires"] == 0 else f"⚠️  Token expires at: {result['expires']}")
    print()
    print(f"📘 Page: {result['page_name']}")
    print(f"🔑 Permanent Token:")
    print(result["token"])
    print()
    
    print("🔄 Updating .env...")
    update_env_token(result["token"])
    print("✅ .env updated automatically!")
    print("👉 Now run: python update.py")

if __name__ == "__main__":
    main()
