"""
TikTok API OAuth 2.0 implementation.
"""
import os
import json
import requests
import urllib.parse
import secrets
import hashlib
import base64
from pathlib import Path
from utils.logger import get_logger
from config import config

logger = get_logger("tiktok.auth")

TIKTOK_AUTH_URL = "https://www.tiktok.com/v2/auth/authorize/"
TIKTOK_TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/"

def get_tiktok_token_path():
    return Path(config.CREDENTIALS_DIR) / "tiktok_token.json"

def create_tiktok_oauth_flow():
    """Generate TikTok authorization URL."""
    client_key = config.TIKTOK_CLIENT_KEY
    if not client_key:
        raise ValueError("TIKTOK_CLIENT_KEY is not set in .env")

    # TikTok blocks localhost, so we use your real domain!
    redirect_uri = "https://orsptt.space/"
    state = "tiktok_auth"
    
    # Generate PKCE verifier and challenge
    code_verifier = secrets.token_urlsafe(32)
    code_challenge = base64.urlsafe_b64encode(
        hashlib.sha256(code_verifier.encode('utf-8')).digest()
    ).decode('utf-8').rstrip('=')
    
    # Required scopes for uploading
    scopes = "video.upload,user.info.basic"
    
    auth_url = (
        f"{TIKTOK_AUTH_URL}?"
        f"client_key={client_key}&"
        f"response_type=code&"
        f"scope={scopes}&"
        f"redirect_uri={urllib.parse.quote_plus(redirect_uri)}&"
        f"state={state}&"
        f"code_challenge={code_challenge}&"
        f"code_challenge_method=S256"
    )
    return auth_url, code_verifier

def complete_tiktok_oauth_flow(redirect_url: str, code_verifier: str):
    """Exchange authorization code for access token."""
    client_key = config.TIKTOK_CLIENT_KEY
    client_secret = config.TIKTOK_CLIENT_SECRET
    
    if not client_key or not client_secret:
        raise ValueError("TIKTOK_CLIENT_KEY or TIKTOK_CLIENT_SECRET missing in .env")

    # Extract code from URL
    parsed = urllib.parse.urlparse(redirect_url)
    params = urllib.parse.parse_qs(parsed.query)
    
    if "code" not in params:
        raise ValueError("No 'code' parameter found in the redirect URL")
        
    code = params["code"][0]
    
    data = {
        "client_key": client_key,
        "client_secret": client_secret,
        "code": code,
        "grant_type": "authorization_code",
        "redirect_uri": "https://orsptt.space/",
        "code_verifier": code_verifier
    }
    
    response = requests.post(
        TIKTOK_TOKEN_URL,
        data=data,
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    
    if response.status_code != 200:
        raise Exception(f"Failed to get TikTok token: {response.text}")
        
    token_data = response.json()
    if "error" in token_data:
        raise Exception(f"TikTok API Error: {token_data.get('error_description', token_data['error'])}")
        
    _save_tiktok_token(token_data)
    logger.info("✅ Successfully authenticated TikTok account!")
    return token_data

def _save_tiktok_token(token_data: dict):
    path = get_tiktok_token_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w") as f:
        json.dump(token_data, f)

def get_tiktok_access_token():
    """Load and optionally refresh the TikTok access token."""
    path = get_tiktok_token_path()
    if not path.exists():
        return None
        
    with open(path, "r") as f:
        token_data = json.load(f)
        
    # TODO: Implement token refresh if expired using refresh_token
    return token_data.get("access_token")
