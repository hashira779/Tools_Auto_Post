"""
YouTube OAuth 2.0 authentication.
Handles initial authorization flow and token refresh.
"""

import os
from pathlib import Path
from typing import Optional

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

from utils.logger import get_logger

logger = get_logger("youtube.auth")

# YouTube API scopes required for uploading and managing videos
SCOPES = [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube.readonly",
    "https://www.googleapis.com/auth/youtube.force-ssl",
]


class YouTubeServicePool:
    def __init__(self, services: list):
        self.services = services
        self.current_index = 0
        self.exhausted_count = 0

    def get_service(self):
        if not self.services:
            return None
        return self.services[self.current_index]

    def add_service(self, service):
        """Add a dynamically authenticated service to the pool."""
        self.services.append(service)
        logger.info(f"✨ Added new service to the pool! Total capacity: {len(self.services)*6} videos/day.")

    def mark_quota_exceeded(self) -> bool:
        """
        Marks current service as exhausted and rotates.
        Returns True if a fresh service is available, False if all are exhausted.
        """
        if not self.services:
            return False

        self.exhausted_count += 1
        if self.exhausted_count >= len(self.services):
            logger.error("❌ All YouTube accounts in the pool have exhausted their quotas!")
            return False

        self.current_index = (self.current_index + 1) % len(self.services)
        logger.warning(f"🔄 YouTube Quota Exceeded. Rotating to service account #{self.current_index + 1}...")
        return True


def get_service_pool(credentials_dir: str = "./credentials") -> YouTubeServicePool:
    """
    Authenticate and return a pool of all YouTube services.
    Scans the credentials directory for client_secret*.json files.
    """
    credentials_path = Path(credentials_dir)
    client_secrets = list(credentials_path.glob("client_secret*.json"))
    
    # Also support the legacy single file in the root
    legacy_file = Path("client_secrets.json")
    if legacy_file.exists() and legacy_file not in client_secrets:
        client_secrets.append(legacy_file)
        
    if not client_secrets:
        raise FileNotFoundError(
            f"❌ No client_secret*.json files found in {credentials_dir} (or root directory)\n"
            "   Please download them from Google Cloud Console."
        )

    services = []
    
    for secret_path in client_secrets:
        # Determine the token path. If client_secret_1.json -> token_1.json
        if secret_path.name == "client_secrets.json":
            token_path = "token.json"
        else:
            token_path = str(credentials_path / secret_path.name.replace("client_secret", "token"))
            
        try:
            credentials = _load_or_create_credentials(str(secret_path), token_path, allow_interactive=False)
            service = build("youtube", "v3", credentials=credentials)
            services.append(service)
            logger.info(f"✅ Authenticated YouTube service using {secret_path.name}")
        except Exception as e:
            logger.warning(f"⚠️ Skipping {secret_path.name}: {e}")

    if not services:
        raise Exception("❌ Failed to authenticate ANY YouTube accounts. Check logs.")

    logger.info(f"🚀 Initialized YouTube Service Pool with {len(services)} accounts.")
    return YouTubeServicePool(services)


def _load_or_create_credentials(
    client_secrets_path: str,
    token_path: str,
    allow_interactive: bool = False
) -> Credentials:
    """Load existing credentials or run the OAuth flow."""
    credentials = None

    # Try to load existing token
    if os.path.exists(token_path):
        try:
            credentials = Credentials.from_authorized_user_file(token_path, SCOPES)
            logger.debug("Loaded existing OAuth token")
        except Exception as e:
            logger.warning(f"Failed to load existing token: {e}")
            credentials = None

    # Check if credentials are valid
    if credentials and credentials.valid:
        return credentials

    # Try to refresh expired credentials
    if credentials and credentials.expired and credentials.refresh_token:
        try:
            credentials.refresh(Request())
            logger.info("🔄 OAuth token refreshed successfully")
            _save_credentials(credentials, token_path)
            return credentials
        except Exception as e:
            logger.warning(f"Failed to refresh token: {e}")
            credentials = None

    # Run the full OAuth flow (first time or after token invalidation)
    if not allow_interactive:
        raise Exception(f"OAuth token missing or expired for {client_secrets_path}. "
                        f"Local authorization is disabled in production to prevent freezing. "
                        f"Please use the Telegram bot to authorize this account.")

    if not os.path.exists(client_secrets_path):
        raise FileNotFoundError(
            f"❌ client_secrets.json not found at: {client_secrets_path}\n"
            "   Please download it from Google Cloud Console:\n"
            "   1. Go to https://console.cloud.google.com/\n"
            "   2. Select your project\n"
            "   3. APIs & Services → Credentials\n"
            "   4. Create OAuth 2.0 Client ID (Desktop App)\n"
            "   5. Download the JSON file and save it as client_secrets.json"
        )

    logger.info("🔐 Starting OAuth authorization flow...")
    logger.info("   A browser window will open for you to authorize the application.")

    flow = InstalledAppFlow.from_client_secrets_file(
        client_secrets_path,
        scopes=SCOPES,
    )

    # Run the local server flow (opens browser automatically)
    credentials = flow.run_local_server(
        port=8080,
        prompt="consent",
        authorization_prompt_message="Opening browser for YouTube authorization...",
    )

    # Save the credentials for future runs
    _save_credentials(credentials, token_path)
    logger.info("✅ OAuth authorization completed and token saved")

    return credentials


def _save_credentials(credentials: Credentials, token_path: str):
    """Save credentials to a file for future use."""
    Path(token_path).parent.mkdir(parents=True, exist_ok=True)
    with open(token_path, "w") as f:
        f.write(credentials.to_json())
    logger.debug(f"Token saved to: {token_path}")


def create_telegram_oauth_flow(client_secrets_path: str):
    """
    Creates an OAuth flow for Telegram out-of-band authorization.
    Returns (flow, authorization_url).
    """
    flow = InstalledAppFlow.from_client_secrets_file(
        client_secrets_path,
        scopes=SCOPES,
        redirect_uri='http://localhost:8080/'
    )
    auth_url, _ = flow.authorization_url(prompt='consent', access_type='offline')
    return flow, auth_url


def complete_telegram_oauth_flow(flow: InstalledAppFlow, redirect_url: str, token_path: str):
    """
    Completes the OAuth flow using the redirect URL from the user.
    Saves the credentials and returns the built service.
    """
    os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'
    flow.fetch_token(authorization_response=redirect_url)
    credentials = flow.credentials
    _save_credentials(credentials, token_path)
    
    service = build("youtube", "v3", credentials=credentials)
    return service
