import os
from datetime import datetime, timezone
from fastapi import HTTPException, Security, Request, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
from sqlalchemy.orm import Session
from .database import get_db
from . import models

# Use environment variables
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

# Create a Supabase client to interact with the Auth API
supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security), db: Session = Depends(get_db)):
    """
    FastAPI dependency to verify the Supabase JWT and map to local PostgreSQL user.
    """
    token = credentials.credentials
    try:
        res = supabase.auth.get_user(token)
        if not res.user:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
            
        # We have the authenticated Supabase user ID
        supabase_id = res.user.id
        email = res.user.email
        
        # Check if local user exists
        local_user = db.query(models.User).filter(models.User.supabase_user_id == supabase_id).first()
        
        if not local_user:
            # Create local user for the first time
            local_user = models.User(supabase_user_id=supabase_id, email=email)
            # Check if this email should be an admin (bootstrap)
            allowed_admins = os.getenv("ADMIN_EMAILS", "").split(",")
            if email in allowed_admins:
                local_user.is_admin = 1
                local_user.is_verified = 1
                
            db.add(local_user)
            db.commit()
            db.refresh(local_user)
            
        # Update last login
        local_user.last_login_at = datetime.now(timezone.utc)
        db.commit()
            
        return local_user
    except Exception as e:
        print(f"Auth error in get_current_user: {str(e)}", flush=True)
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")

def get_verified_user(user: models.User = Depends(get_current_user)):
    """Dependency to ensure the user is verified with an admin token."""
    if not user.is_verified:
        raise HTTPException(
            status_code=403, 
            detail="Verification Required: Please enter the token provided by your admin."
        )
    return user

def get_admin_user(user: models.User = Depends(get_current_user)):
    """Dependency to ensure the user is an admin."""
    if not user.is_admin:
        raise HTTPException(
            status_code=403, 
            detail="Forbidden: Admin access only."
        )
    return user
