# app/routers/email.py
import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.dependencies import get_current_admin
from app.email_service import send_bulk_email
from app.config import settings  # 👈 Single import

logger = logging.getLogger("credit_tracker.email")

router = APIRouter(prefix="/email", tags=["Email"])


@router.post("/preview", response_model=schemas.BulkEmailPreview)
def preview_bulk_email(
    payload: schemas.BulkEmailRequest,
    current_admin: models.Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Preview how many students will receive the email and see sample recipients.
    Only accessible by admins.
    """
    query = db.query(models.Student)
    
    if payload.is_active:
        query = query.filter(models.Student.is_active.is_(True))
    
    if payload.programme_code:
        query = query.join(models.Programme).filter(
            models.Programme.code == payload.programme_code
        )
    
    if payload.current_year:
        query = query.filter(models.Student.current_year == payload.current_year)
    
    students = query.all()
    emails = [s.email for s in students if s.email]
    
    return schemas.BulkEmailPreview(
        recipient_count=len(emails),
        sample_recipients=emails[:5],
    )


@router.post("/send", response_model=schemas.BulkEmailResult)
def send_bulk_email_endpoint(
    payload: schemas.BulkEmailRequest,
    current_admin: models.Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Send a bulk email to students filtered by programme and/or year.
    Only accessible by admins.
    """
    query = db.query(models.Student)
    
    if payload.is_active:
        query = query.filter(models.Student.is_active.is_(True))
    
    if payload.programme_code:
        query = query.join(models.Programme).filter(
            models.Programme.code == payload.programme_code
        )
    
    if payload.current_year:
        query = query.filter(models.Student.current_year == payload.current_year)
    
    students = query.all()
    
    if not students:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No students found matching the filters"
        )
    
    recipients = [s.email for s in students if s.email]
    
    if not recipients:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid email addresses found"
        )
    
    # If test mode, only send to the admin's configured email
    if payload.send_test:
        # 👇 FIX: Use settings.smtp_from_email instead of current_admin.email
        recipients = [settings.smtp_from_email]
        if not recipients:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Sender email not configured in SMTP settings."
            )
    
    # Send the emails
    results = send_bulk_email(
        to_emails=recipients,
        subject=payload.subject,
        body=payload.body,
        sender_email=settings.smtp_from_email,
    )
    
    return schemas.BulkEmailResult(
        total_sent=results["sent"],
        failed=results["failed"],
        recipients=results["recipients"],
        errors=results["errors"],
    )