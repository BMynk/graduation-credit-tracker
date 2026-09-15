# app/audit_logger.py
import logging
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from app import models

# Create audit logger
audit_logger = logging.getLogger("audit")
audit_logger.setLevel(logging.INFO)

# File handler for audit logs
handler = logging.FileHandler("audit.log")
handler.setFormatter(logging.Formatter(
    '%(asctime)s - %(levelname)s - %(message)s'
))
audit_logger.addHandler(handler)

def log_action(
    db: Session,
    user_id: int,
    user_role: str,
    action: str,
    target_type: str,
    target_id: Optional[int] = None,
    details: Optional[dict] = None,
):
    """Log admin/student actions"""
    audit_logger.info(
        f"User:{user_id}|Role:{user_role}|Action:{action}|"
        f"Target:{target_type}:{target_id}|Details:{details}"
    )
    
    # Optional: Save to database
    try:
        log_entry = models.AuditLog(
            user_id=user_id,
            user_role=user_role,
            action=action,
            target_type=target_type,
            target_id=target_id,
            details=details,
            timestamp=datetime.utcnow(),
        )
        db.add(log_entry)
        db.commit()
    except Exception:
        pass