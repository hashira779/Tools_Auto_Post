"""
n8n Workflow Automation Router
──────────────────────────────
CRUD for registered workflows, trigger proxy to n8n webhooks,
and automation log endpoints.  All admin-only except trigger
(which any verified user can call).
"""

import os
import time
import uuid
from datetime import datetime, timezone
from typing import List, Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models
from ..auth import get_admin_user, get_verified_user

router = APIRouter(prefix="/api/n8n", tags=["n8n"])

N8N_INTERNAL_URL = os.environ.get("N8N_URL", "http://n8n:5678")


# ── Pydantic schemas ───────────────────────────────────────────

class WorkflowCreate(BaseModel):
    name: str
    description: Optional[str] = None
    n8n_workflow_id: str
    webhook_path: Optional[str] = None
    category: str = "general"

class WorkflowUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    webhook_path: Optional[str] = None
    category: Optional[str] = None
    is_active: Optional[bool] = None

class WorkflowResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str]
    n8n_workflow_id: str
    webhook_path: Optional[str]
    category: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class TriggerRequest(BaseModel):
    payload: Optional[dict] = None

class TriggerResponse(BaseModel):
    log_id: uuid.UUID
    status: str
    duration_ms: int
    n8n_response: Optional[dict] = None

class LogResponse(BaseModel):
    id: uuid.UUID
    workflow_id: uuid.UUID
    workflow_name: Optional[str] = None
    triggered_by: Optional[uuid.UUID]
    triggered_by_email: Optional[str] = None
    payload: Optional[dict]
    response: Optional[dict]
    status: str
    duration_ms: Optional[int]
    executed_at: datetime

    class Config:
        from_attributes = True


# ── Workflow CRUD (admin only) ─────────────────────────────────

@router.post("/workflows", response_model=WorkflowResponse)
def create_workflow(
    data: WorkflowCreate,
    admin: models.User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Register a new n8n workflow so users can trigger it from the web."""
    existing = db.query(models.N8nWorkflow).filter(
        models.N8nWorkflow.n8n_workflow_id == data.n8n_workflow_id
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Workflow with this n8n ID is already registered")

    wf = models.N8nWorkflow(
        name=data.name,
        description=data.description,
        n8n_workflow_id=data.n8n_workflow_id,
        webhook_path=data.webhook_path,
        category=data.category,
        created_by=admin.id,
    )
    db.add(wf)
    db.commit()
    db.refresh(wf)

    # Log admin action
    log = models.AdminActionLog(
        admin_id=admin.id,
        action="CREATE_N8N_WORKFLOW",
        details={"workflow_id": str(wf.id), "name": wf.name},
    )
    db.add(log)
    db.commit()

    return wf


@router.get("/workflows", response_model=List[WorkflowResponse])
def list_workflows(
    admin: models.User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """List all registered n8n workflows."""
    return (
        db.query(models.N8nWorkflow)
        .order_by(models.N8nWorkflow.created_at.desc())
        .all()
    )


@router.patch("/workflows/{workflow_id}", response_model=WorkflowResponse)
def update_workflow(
    workflow_id: uuid.UUID,
    data: WorkflowUpdate,
    admin: models.User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Update a registered workflow's metadata or toggle active state."""
    wf = db.query(models.N8nWorkflow).filter(models.N8nWorkflow.id == workflow_id).first()
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")

    if data.name is not None:
        wf.name = data.name
    if data.description is not None:
        wf.description = data.description
    if data.webhook_path is not None:
        wf.webhook_path = data.webhook_path
    if data.category is not None:
        wf.category = data.category
    if data.is_active is not None:
        wf.is_active = 1 if data.is_active else 0

    db.commit()
    db.refresh(wf)

    # Log admin action
    log = models.AdminActionLog(
        admin_id=admin.id,
        action="UPDATE_N8N_WORKFLOW",
        details={"workflow_id": str(workflow_id), "updates": data.dict(exclude_none=True)},
    )
    db.add(log)
    db.commit()

    return wf


@router.delete("/workflows/{workflow_id}")
def delete_workflow(
    workflow_id: uuid.UUID,
    admin: models.User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Remove a registered workflow and its logs."""
    wf = db.query(models.N8nWorkflow).filter(models.N8nWorkflow.id == workflow_id).first()
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")

    db.delete(wf)
    db.commit()

    # Log admin action
    log = models.AdminActionLog(
        admin_id=admin.id,
        action="DELETE_N8N_WORKFLOW",
        details={"workflow_id": str(workflow_id)},
    )
    db.add(log)
    db.commit()

    return {"status": "success"}


# ── Trigger (verified users) ──────────────────────────────────

@router.post("/trigger/{workflow_id}", response_model=TriggerResponse)
async def trigger_workflow(
    workflow_id: uuid.UUID,
    body: TriggerRequest = TriggerRequest(),
    user: models.User = Depends(get_verified_user),
    db: Session = Depends(get_db),
):
    """
    Trigger a registered n8n workflow via its webhook URL.
    Proxies the request to n8n and records the result.
    """
    wf = db.query(models.N8nWorkflow).filter(
        models.N8nWorkflow.id == workflow_id,
        models.N8nWorkflow.is_active == 1,
    ).first()
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found or inactive")

    if not wf.webhook_path:
        raise HTTPException(
            status_code=400,
            detail="Workflow has no webhook path configured. Set it in the admin panel.",
        )

    # Build the full n8n webhook URL
    webhook_url = f"{N8N_INTERNAL_URL.rstrip('/')}{wf.webhook_path}"

    # Prepare the log entry
    log_entry = models.AutomationLog(
        workflow_id=wf.id,
        triggered_by=user.id,
        payload=body.payload,
        status="pending",
    )
    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)

    # Call n8n
    start = time.monotonic()
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                webhook_url,
                json=body.payload or {},
                headers={"Content-Type": "application/json"},
            )
        duration_ms = int((time.monotonic() - start) * 1000)

        # Try to parse n8n response as JSON
        try:
            n8n_body = resp.json()
        except Exception:
            n8n_body = {"raw": resp.text[:2000]}

        if resp.is_success:
            log_entry.status = "success"
        else:
            log_entry.status = "error"

        log_entry.response = n8n_body
        log_entry.duration_ms = duration_ms

    except httpx.RequestError as exc:
        duration_ms = int((time.monotonic() - start) * 1000)
        log_entry.status = "error"
        log_entry.response = {"error": str(exc)}
        log_entry.duration_ms = duration_ms
        n8n_body = log_entry.response

    db.commit()
    db.refresh(log_entry)

    return TriggerResponse(
        log_id=log_entry.id,
        status=log_entry.status,
        duration_ms=log_entry.duration_ms,
        n8n_response=n8n_body,
    )


# ── Automation Logs (admin only) ───────────────────────────────

@router.get("/logs", response_model=List[LogResponse])
def list_all_logs(
    limit: int = 50,
    admin: models.User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """List recent automation logs across all workflows."""
    rows = (
        db.query(models.AutomationLog)
        .order_by(models.AutomationLog.executed_at.desc())
        .limit(limit)
        .all()
    )
    return _enrich_logs(rows, db)


@router.get("/logs/{workflow_id}", response_model=List[LogResponse])
def list_workflow_logs(
    workflow_id: uuid.UUID,
    limit: int = 50,
    admin: models.User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """List automation logs for a specific workflow."""
    rows = (
        db.query(models.AutomationLog)
        .filter(models.AutomationLog.workflow_id == workflow_id)
        .order_by(models.AutomationLog.executed_at.desc())
        .limit(limit)
        .all()
    )
    return _enrich_logs(rows, db)


def _enrich_logs(rows, db: Session):
    """Attach workflow name and user email to log rows."""
    result = []
    # Cache lookups
    wf_cache = {}
    user_cache = {}

    for row in rows:
        # Workflow name
        if row.workflow_id not in wf_cache:
            wf = db.query(models.N8nWorkflow).filter(models.N8nWorkflow.id == row.workflow_id).first()
            wf_cache[row.workflow_id] = wf.name if wf else None
        # User email
        email = None
        if row.triggered_by:
            if row.triggered_by not in user_cache:
                u = db.query(models.User).filter(models.User.id == row.triggered_by).first()
                user_cache[row.triggered_by] = u.email if u else None
            email = user_cache[row.triggered_by]

        result.append(LogResponse(
            id=row.id,
            workflow_id=row.workflow_id,
            workflow_name=wf_cache.get(row.workflow_id),
            triggered_by=row.triggered_by,
            triggered_by_email=email,
            payload=row.payload,
            response=row.response,
            status=row.status,
            duration_ms=row.duration_ms,
            executed_at=row.executed_at,
        ))
    return result
