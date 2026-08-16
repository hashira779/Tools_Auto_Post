import os
from fastapi import HTTPException, Security, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client

# Use environment variables
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

# Create a Supabase client to interact with the Auth API
supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    """
    FastAPI dependency to verify the Supabase JWT.
    Extracts the Bearer token, sends it to Supabase GoTrue API to retrieve the user.
    If valid, returns the user object. If not, raises 401 Unauthorized.
    """
    token = credentials.credentials
    try:
        # We verify the token by fetching the user from Supabase using the token.
        # This is the safest way to verify the token without needing the JWT secret.
        res = supabase.auth.get_user(token)
        if res.user:
            return res.user
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")
