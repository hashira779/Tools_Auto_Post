from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timezone, timedelta
import uuid

from ..database import get_db
from .. import models
from ..auth import get_admin_user, get_current_user

router = APIRouter(prefix="/api/admin", tags=["admin"])

class TokenCreate(BaseModel):
    description: Optional[str] = None
    valid_days: Optional[int] = 30 # Default 30 days
    max_uses: Optional[int] = 1
    is_unlimited: bool = False

class TokenResponse(BaseModel):
    id: uuid.UUID
    token_key: str
    description: Optional[str]
    valid_until: Optional[datetime]
    max_uses: int
    current_uses: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    is_admin: Optional[bool] = None
    is_verified: Optional[bool] = None
    status: Optional[str] = None

class TokenUpdate(BaseModel):
    is_active: Optional[bool] = None

@router.post("/tokens", response_model=TokenResponse)
def create_token(data: TokenCreate, admin: models.User = Depends(get_admin_user), db: Session = Depends(get_db)):
    token_key = f"CAM-{uuid.uuid4().hex[:8].upper()}-{uuid.uuid4().hex[:4].upper()}"
    
    valid_until = None
    if not data.is_unlimited and data.valid_days:
        valid_until = datetime.now(timezone.utc) + timedelta(days=data.valid_days)
    
    new_token = models.AdminToken(
        token_key=token_key,
        description=data.description,
        valid_until=valid_until,
        max_uses=0 if data.is_unlimited else data.max_uses,
        created_by=admin.id
    )
    db.add(new_token)
    db.commit()
    db.refresh(new_token)
    
    # Log action
    log = models.AdminActionLog(
        admin_id=admin.id,
        action="CREATE_TOKEN",
        details={"token_id": str(new_token.id), "token_key": token_key}
    )
    db.add(log)
    db.commit()
    
    return new_token

@router.get("/tokens", response_model=List[TokenResponse])
def list_tokens(admin: models.User = Depends(get_admin_user), db: Session = Depends(get_db)):
    return db.query(models.AdminToken).order_by(models.AdminToken.created_at.desc()).all()

@router.patch("/tokens/{token_id}", response_model=TokenResponse)
def update_token(token_id: uuid.UUID, data: TokenUpdate, admin: models.User = Depends(get_admin_user), db: Session = Depends(get_db)):
    """Enable or disable (revoke) a token without deleting it."""
    token = db.query(models.AdminToken).filter(models.AdminToken.id == token_id).first()
    if not token:
        raise HTTPException(status_code=404, detail="Token not found")

    if data.is_active is not None:
        token.is_active = 1 if data.is_active else 0

    db.commit()
    db.refresh(token)

    # Log action
    log = models.AdminActionLog(
        admin_id=admin.id,
        action="UPDATE_TOKEN",
        details={"token_id": str(token_id), "is_active": token.is_active}
    )
    db.add(log)
    db.commit()

    return token

@router.delete("/tokens/{token_id}")
def delete_token(token_id: uuid.UUID, admin: models.User = Depends(get_admin_user), db: Session = Depends(get_db)):
    token = db.query(models.AdminToken).filter(models.AdminToken.id == token_id).first()
    if not token:
        raise HTTPException(status_code=404, detail="Token not found")
    
    db.delete(token)
    db.commit()
    
    # Log action
    log = models.AdminActionLog(
        admin_id=admin.id,
        action="DELETE_TOKEN",
        details={"token_id": str(token_id)}
    )
    db.add(log)
    db.commit()
    
    return {"status": "success"}

@router.get("/users")
def list_users(admin: models.User = Depends(get_admin_user), db: Session = Depends(get_db)):
    users = db.query(models.User).order_by(models.User.created_at.desc()).all()
    return [{
        "id": u.id,
        "email": u.email,
        "is_admin": u.is_admin == 1,
        "is_verified": u.is_verified == 1,
        "status": u.status,
        "created_at": u.created_at,
        "last_login_at": u.last_login_at
    } for u in users]

@router.patch("/users/{user_id}")
def update_user(user_id: uuid.UUID, data: UserUpdate, admin: models.User = Depends(get_admin_user), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if data.is_admin is not None:
        user.is_admin = 1 if data.is_admin else 0
    if data.is_verified is not None:
        user.is_verified = 1 if data.is_verified else 0
    if data.status is not None:
        user.status = data.status
        
    db.commit()
    
    # Log action
    log = models.AdminActionLog(
        admin_id=admin.id,
        action="UPDATE_USER",
        details={"target_user_id": str(user_id), "updates": data.dict(exclude_none=True)}
    )
    db.add(log)
    db.commit()
    
    return {"status": "success"}

# --- User Verification Endpoint (Public/Authenticated) ---

class VerifyRequest(BaseModel):
    token_key: str

@router.post("/verify-token")
def verify_user_with_token(data: VerifyRequest, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """User submits a token to verify their account."""
    if user.is_verified:
        return {"status": "already_verified", "message": "You are already verified!"}
        
    token = db.query(models.AdminToken).filter(
        models.AdminToken.token_key == data.token_key,
        models.AdminToken.is_active == 1
    ).first()
    
    if not token:
        raise HTTPException(status_code=400, detail="Invalid token key")
        
    # Check expiry
    if token.valid_until and token.valid_until < datetime.now(timezone.utc):
        token.is_active = 0
        db.commit()
        raise HTTPException(status_code=400, detail="Token has expired")
        
    # Check uses
    if token.max_uses > 0 and token.current_uses >= token.max_uses:
        token.is_active = 0
        db.commit()
        raise HTTPException(status_code=400, detail="Token usage limit reached")
        
    # Valid token!
    user.is_verified = 1
    token.current_uses += 1
    
    # Auto-disable if reached limit
    if token.max_uses > 0 and token.current_uses >= token.max_uses:
        token.is_active = 0
        
    db.commit()
    
    return {"status": "success", "message": "Account verified successfully!"}
