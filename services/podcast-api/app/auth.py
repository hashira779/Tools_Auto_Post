import os
from datetime import datetime, timezone
from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
from sqlalchemy.orm import Session
from app.database import get_db
from sqlalchemy import Column, String, Text, DateTime, Integer, LargeBinary
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base
import uuid

# Re-define minimal User model to avoid circular imports or missing definitions
class User(Base):
    __tablename__ = "users"
    __table_args__ = {'extend_existing': True}
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    supabase_user_id = Column(String(255), unique=True, index=True, nullable=False)
    email = Column(String(255), index=True, nullable=True)
    is_admin = Column(Integer, default=0)
    is_verified = Column(Integer, default=0)

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
        
        # Check if local user exists
        local_user = db.query(User).filter(User.supabase_user_id == supabase_id).first()
        
        if not local_user:
            # In a shared DB, the user SHOULD already exist if they logged into the main portal
            # If not, we still allow them but they won't be verified/admin
            raise HTTPException(status_code=403, detail="User record not found in system. Please login to the main portal first.")
            
        return local_user
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")

def get_verified_user(user: User = Depends(get_current_user)):
    """Dependency to ensure the user is verified with an admin token."""
    if not user.is_verified:
        raise HTTPException(
            status_code=403, 
            detail="Verification Required: Please enter the token provided by your admin in the main portal."
        )
    return user

def get_admin_user(user: User = Depends(get_current_user)):
    """Dependency to ensure the user is an admin."""
    if not user.is_admin:
        raise HTTPException(
            status_code=403, 
            detail="Forbidden: Admin access only."
        )
    return user
