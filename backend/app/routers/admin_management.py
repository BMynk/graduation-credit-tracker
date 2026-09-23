# app/routers/admin_management.py
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.dependencies import get_current_admin
from app.security import hash_password, verify_password

router = APIRouter(prefix="/admin-management", tags=["Admin Management"])


# ---------- Helper Functions ----------

def _check_super_admin(current_admin: models.Admin) -> None:
    """Raise 403 if the current admin is not a super admin."""
    if not current_admin.is_super_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin privileges required for this action"
        )


def _get_admin_or_404(db: Session, admin_id: int) -> models.Admin:
    """Get admin by ID or raise 404."""
    admin = db.query(models.Admin).filter(models.Admin.id == admin_id).first()
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")
    return admin


def _get_admin_by_username(db: Session, username: str) -> Optional[models.Admin]:
    """Check if username already exists."""
    return db.query(models.Admin).filter(
        models.Admin.username == username
    ).first()


# ---------- Endpoints ----------

@router.get("/me", response_model=schemas.AdminProfileOut)
def get_my_admin_profile(
    current_admin: models.Admin = Depends(get_current_admin),
):
    """Get the currently logged-in admin's profile."""
    return schemas.AdminProfileOut(
        id=current_admin.id,
        name=current_admin.name,
        username=current_admin.username,
        is_active=current_admin.is_active,
        is_super_admin=current_admin.is_super_admin,
    )


@router.get("", response_model=List[schemas.AdminOut])
def list_admins(
    q: Optional[str] = Query(default=None, description="Search by name or username"),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    current_admin: models.Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """List all admin accounts. Only accessible by super admins."""
    _check_super_admin(current_admin)
    
    query = db.query(models.Admin)
    
    if q:
        like = f"%{q}%"
        query = query.filter(
            (models.Admin.name.ilike(like)) |
            (models.Admin.username.ilike(like))
        )
    
    admins = query.order_by(models.Admin.created_at.desc()).offset(skip).limit(limit).all()
    
    results = []
    for admin in admins:
        created_by_name = None
        if admin.created_by_id:
            creator = db.query(models.Admin).filter(
                models.Admin.id == admin.created_by_id
            ).first()
            if creator:
                created_by_name = creator.name
        
        results.append(
            schemas.AdminOut(
                id=admin.id,
                name=admin.name,
                username=admin.username,
                is_active=admin.is_active,
                is_super_admin=admin.is_super_admin,
                created_at=admin.created_at,
                created_by_id=admin.created_by_id,
                created_by_name=created_by_name,
            )
        )
    
    return results


@router.post("", response_model=schemas.AdminOut, status_code=status.HTTP_201_CREATED)
def create_admin(
    payload: schemas.AdminCreate,
    current_admin: models.Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Create a new admin account. Only accessible by super admins."""
    _check_super_admin(current_admin)
    
    if _get_admin_by_username(db, payload.username):
        raise HTTPException(
            status_code=409,
            detail=f"Admin with username '{payload.username}' already exists"
        )
    
    new_admin = models.Admin(
        name=payload.name,
        username=payload.username,
        hashed_password=hash_password(payload.password),
        is_active=True,
        is_super_admin=payload.is_super_admin,
        created_by_id=current_admin.id,
    )
    
    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)
    
    return schemas.AdminOut(
        id=new_admin.id,
        name=new_admin.name,
        username=new_admin.username,
        is_active=new_admin.is_active,
        is_super_admin=new_admin.is_super_admin,
        created_at=new_admin.created_at,
        created_by_id=current_admin.id,
        created_by_name=current_admin.name,
    )


@router.get("/{admin_id}", response_model=schemas.AdminOut)
def get_admin(
    admin_id: int,
    current_admin: models.Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Get a specific admin by ID. Only accessible by super admins."""
    _check_super_admin(current_admin)
    
    admin = _get_admin_or_404(db, admin_id)
    
    created_by_name = None
    if admin.created_by_id:
        creator = db.query(models.Admin).filter(
            models.Admin.id == admin.created_by_id
        ).first()
        if creator:
            created_by_name = creator.name
    
    return schemas.AdminOut(
        id=admin.id,
        name=admin.name,
        username=admin.username,
        is_active=admin.is_active,
        is_super_admin=admin.is_super_admin,
        created_at=admin.created_at,
        created_by_id=admin.created_by_id,
        created_by_name=created_by_name,
    )


@router.patch("/{admin_id}", response_model=schemas.AdminOut)
def update_admin(
    admin_id: int,
    payload: schemas.AdminUpdate,
    current_admin: models.Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Update an admin account. Only accessible by super admins."""
    _check_super_admin(current_admin)
    
    admin = _get_admin_or_404(db, admin_id)
    
    if admin_id == current_admin.id and payload.is_super_admin is False:
        raise HTTPException(
            status_code=403,
            detail="Cannot remove your own super admin privileges"
        )
    
    if admin_id == current_admin.id and payload.is_active is False:
        raise HTTPException(
            status_code=403,
            detail="Cannot deactivate your own account"
        )
    
    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(admin, field, value)
    
    db.commit()
    db.refresh(admin)
    
    created_by_name = None
    if admin.created_by_id:
        creator = db.query(models.Admin).filter(
            models.Admin.id == admin.created_by_id
        ).first()
        if creator:
            created_by_name = creator.name
    
    return schemas.AdminOut(
        id=admin.id,
        name=admin.name,
        username=admin.username,
        is_active=admin.is_active,
        is_super_admin=admin.is_super_admin,
        created_at=admin.created_at,
        created_by_id=admin.created_by_id,
        created_by_name=created_by_name,
    )


@router.delete("/{admin_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_admin(
    admin_id: int,
    current_admin: models.Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Delete (deactivate) an admin account. Only accessible by super admins."""
    _check_super_admin(current_admin)
    
    admin = _get_admin_or_404(db, admin_id)
    
    if admin_id == current_admin.id:
        raise HTTPException(
            status_code=403,
            detail="Cannot delete your own account"
        )
    
    admin.is_active = False
    db.commit()


@router.post("/{admin_id}/reactivate", response_model=schemas.AdminOut)
def reactivate_admin(
    admin_id: int,
    current_admin: models.Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Reactivate a deactivated admin account. Only accessible by super admins."""
    _check_super_admin(current_admin)
    
    admin = _get_admin_or_404(db, admin_id)
    admin.is_active = True
    db.commit()
    db.refresh(admin)
    
    created_by_name = None
    if admin.created_by_id:
        creator = db.query(models.Admin).filter(
            models.Admin.id == admin.created_by_id
        ).first()
        if creator:
            created_by_name = creator.name
    
    return schemas.AdminOut(
        id=admin.id,
        name=admin.name,
        username=admin.username,
        is_active=admin.is_active,
        is_super_admin=admin.is_super_admin,
        created_at=admin.created_at,
        created_by_id=admin.created_by_id,
        created_by_name=created_by_name,
    )


@router.post("/change-password")
def change_password(
    payload: schemas.AdminPasswordChange,
    current_admin: models.Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Change the logged-in admin's password after verifying the current one."""
    if not verify_password(
        payload.current_password,
        current_admin.hashed_password,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect",
        )

    if verify_password(
        payload.new_password,
        current_admin.hashed_password,
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from the current password",
        )

    current_admin.hashed_password = hash_password(payload.new_password)
    db.commit()
    return {
        "message": "Password updated successfully. Sign in again on your other devices."
    }


@router.post("/{admin_id}/reset-password")
def reset_admin_password(
    admin_id: int,
    payload: schemas.AdminPasswordReset,
    current_admin: models.Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Reset another admin's password. Only accessible by super admins."""
    _check_super_admin(current_admin)
    
    admin = _get_admin_or_404(db, admin_id)
    admin.hashed_password = hash_password(payload.new_password)
    db.commit()
    
    return {"message": f"Password updated for {admin.username}"}