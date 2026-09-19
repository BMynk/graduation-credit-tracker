from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.dependencies import get_current_admin


router = APIRouter(
    prefix="/support-services",
    tags=["Support Services"],
)


# ============================================================
# PUBLIC / ASSISTANT-SAFE ROUTES
# ============================================================

@router.get(
    "",
    response_model=list[schemas.SupportServiceOut],
)
def list_support_services(
    db: Session = Depends(get_db),
):
    """
    Return active, verified support services.

    This endpoint contains public institutional information
    and can later be used by the AI assistant.
    """

    return (
        db.query(models.SupportService)
        .filter(
            models.SupportService.is_active.is_(True),
            models.SupportService.verified_at.isnot(None),
        )
        .order_by(
            models.SupportService.is_emergency.desc(),
            models.SupportService.name.asc(),
        )
        .all()
    )


@router.get(
    "/{service_id}",
    response_model=schemas.SupportServiceOut,
)
def get_support_service(
    service_id: int,
    db: Session = Depends(get_db),
):
    service = (
        db.query(models.SupportService)
        .filter(
            models.SupportService.id == service_id,
            models.SupportService.is_active.is_(True),
            models.SupportService.verified_at.isnot(None),
        )
        .first()
    )

    if service is None:
        raise HTTPException(
            status_code=404,
            detail="Support service not found",
        )

    return service


# ============================================================
# ADMIN ROUTES
# ============================================================

@router.get(
    "/admin/all",
    response_model=list[schemas.SupportServiceOut],
)
def admin_list_support_services(
    current_admin: models.Admin = Depends(
        get_current_admin
    ),
    db: Session = Depends(get_db),
):
    """
    Admins can see active, inactive and unverified records.
    """

    return (
        db.query(models.SupportService)
        .order_by(
            models.SupportService.name.asc()
        )
        .all()
    )


@router.post(
    "",
    response_model=schemas.SupportServiceOut,
    status_code=201,
)
def create_support_service(
    payload: schemas.SupportServiceCreate,
    current_admin: models.Admin = Depends(
        get_current_admin
    ),
    db: Session = Depends(get_db),
):
    service = models.SupportService(
        **payload.model_dump()
    )

    # Admin-created records are treated as verified.
    service.verified_at = datetime.utcnow()

    db.add(service)
    db.commit()
    db.refresh(service)

    return service


@router.put(
    "/{service_id}",
    response_model=schemas.SupportServiceOut,
)
def update_support_service(
    service_id: int,
    payload: schemas.SupportServiceUpdate,
    current_admin: models.Admin = Depends(
        get_current_admin
    ),
    db: Session = Depends(get_db),
):
    service = (
        db.query(models.SupportService)
        .filter(
            models.SupportService.id
            == service_id
        )
        .first()
    )

    if service is None:
        raise HTTPException(
            status_code=404,
            detail="Support service not found",
        )

    updates = payload.model_dump(
        exclude_unset=True
    )

    for field, value in updates.items():
        setattr(
            service,
            field,
            value,
        )

    # Updating the record verifies the latest information.
    service.verified_at = datetime.utcnow()

    db.commit()
    db.refresh(service)

    return service


@router.post(
    "/{service_id}/verify",
    response_model=schemas.SupportServiceOut,
)
def verify_support_service(
    service_id: int,
    current_admin: models.Admin = Depends(
        get_current_admin
    ),
    db: Session = Depends(get_db),
):
    service = (
        db.query(models.SupportService)
        .filter(
            models.SupportService.id
            == service_id
        )
        .first()
    )

    if service is None:
        raise HTTPException(
            status_code=404,
            detail="Support service not found",
        )

    service.verified_at = datetime.utcnow()

    db.commit()
    db.refresh(service)

    return service


@router.delete(
    "/{service_id}",
    status_code=204,
)
def delete_support_service(
    service_id: int,
    current_admin: models.Admin = Depends(
        get_current_admin
    ),
    db: Session = Depends(get_db),
):
    """
    Soft-delete rather than permanently destroying the record.
    """

    service = (
        db.query(models.SupportService)
        .filter(
            models.SupportService.id
            == service_id
        )
        .first()
    )

    if service is None:
        raise HTTPException(
            status_code=404,
            detail="Support service not found",
        )

    service.is_active = False

    db.commit()

    return None