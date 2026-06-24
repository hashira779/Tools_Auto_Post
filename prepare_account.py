import sys
import os
import shutil
from pathlib import Path
from youtube.auth import _load_or_create_credentials

def main():
    if len(sys.argv) < 2:
        print("Usage: python prepare_account.py <path_to_downloaded_client_secret.json>")
        print("Example: python prepare_account.py C:\\Users\\PTT\\Downloads\\client_secret_123.json")
        sys.exit(1)

    source_file = sys.argv[1]
    if not os.path.exists(source_file):
        print(f"❌ Error: File not found: {source_file}")
        sys.exit(1)

    cred_dir = Path("credentials")
    cred_dir.mkdir(parents=True, exist_ok=True)

    # Find the next available number
    existing = list(cred_dir.glob("client_secret_*.json"))
    max_num = 0
    for p in existing:
        try:
            num = int(p.stem.split("_")[-1])
            max_num = max(max_num, num)
        except ValueError:
            pass

    next_num = max_num + 1
    new_client_secret = cred_dir / f"client_secret_{next_num}.json"
    new_token = cred_dir / f"token_{next_num}.json"

    # Copy the file
    print(f"📦 Copying {source_file} -> {new_client_secret}")
    shutil.copy2(source_file, new_client_secret)

    print(f"\n🔐 Authenticating Account #{next_num}...")
    print("   Your web browser will open. Please log in and click 'Allow'.")
    
    try:
        # Run the interactive OAuth flow
        _load_or_create_credentials(str(new_client_secret), str(new_token), allow_interactive=True)
        print(f"\n✅ Success! Account #{next_num} is fully authenticated and ready.")
        print(f"   Saved token to: {new_token}")
        print("\n🚀 You can now run `update.py` to push these new credentials to your production server!")
    except Exception as e:
        print(f"\n❌ Error authenticating: {e}")
        # Clean up the copied file if it failed
        if os.path.exists(new_client_secret):
            os.remove(new_client_secret)
        sys.exit(1)

if __name__ == "__main__":
    main()
