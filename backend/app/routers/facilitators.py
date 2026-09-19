from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.dependencies import get_current_admin


router = APIRouter(
    prefix="/facilitators",
    tags=["Facilitators"],
)


# ============================================================
# PUBLIC / ASSISTANT-SAFE
# ============================================================

@router.get(
    "",
    response_model=list[schemas.FacilitatorOut],
)
def list_facilitators(
    programme_type: str | None = Query(default=None),
    campus: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    """
    Return active, verified SI/ELEP facilitators.
    """

    query = (
        db.query(models.Facilitator)
        .filter(
            models.Facilitator.is_active.is_(True),
            models.Facilitator.verified_at.isnot(None),
        )
    )

    if programme_type:
        query = query.filter(
            models.Facilitator.programme_type
            == programme_type.upper()
        )

    if campus:
        query = query.filter(
            models.Facilitator.campus == campus
        )

    return (
        query
        .order_by(
            models.Facilitator.programme_type.asc(),
            models.Facilitator.name.asc(),
        )
        .all()
    )


@router.get(
    "/search",
    response_model=list[schemas.FacilitatorOut],
)
def search_facilitators(
    module: str = Query(
        min_length=2,
        max_length=50,
    ),
    programme_type: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    """
    Search verified facilitators by module assignment.
    """

    query = (
        db.query(models.Facilitator)
        .filter(
            models.Facilitator.is_active.is_(True),
            models.Facilitator.verified_at.isnot(None),
            models.Facilitator.module_assignment.ilike(
                f"%{module.strip()}%"
            ),
        )
    )

    if programme_type:
        query = query.filter(
            models.Facilitator.programme_type
            == programme_type.upper()
        )

    return (
        query
        .order_by(
            models.Facilitator.programme_type.asc(),
            models.Facilitator.name.asc(),
        )
        .all()
    )


# ============================================================
# ADMIN
# ============================================================

@router.get(
    "/admin/all",
    response_model=list[schemas.FacilitatorOut],
)
def admin_list_facilitators(
    current_admin: models.Admin = Depends(
        get_current_admin
    ),
    db: Session = Depends(get_db),
):
    return (
        db.query(models.Facilitator)
        .order_by(
            models.Facilitator.programme_type.asc(),
            models.Facilitator.name.asc(),
        )
        .all()
    )


@router.post(
    "",
    response_model=schemas.FacilitatorOut,
    status_code=201,
)
def create_facilitator(
    payload: schemas.FacilitatorCreate,
    current_admin: models.Admin = Depends(
        get_current_admin
    ),
    db: Session = Depends(get_db),
):
    programme_type = (
        payload.programme_type
        .strip()
        .upper()
    )

    if programme_type not in {"SI", "ELEP"}:
        raise HTTPException(
            status_code=400,
            detail="programme_type must be SI or ELEP",
        )

    facilitator = models.Facilitator(
        **payload.model_dump(
            exclude={"programme_type"}
        ),
        programme_type=programme_type,
        verified_at=datetime.utcnow(),
    )

    db.add(facilitator)
    db.commit()
    db.refresh(facilitator)

    return facilitator


@router.put(
    "/{facilitator_id}",
    response_model=schemas.FacilitatorOut,
)
def update_facilitator(
    facilitator_id: int,
    payload: schemas.FacilitatorUpdate,
    current_admin: models.Admin = Depends(
        get_current_admin
    ),
    db: Session = Depends(get_db),
):
    facilitator = (
        db.query(models.Facilitator)
        .filter(
            models.Facilitator.id
            == facilitator_id
        )
        .first()
    )

    if facilitator is None:
        raise HTTPException(
            status_code=404,
            detail="Facilitator not found",
        )

    updates = payload.model_dump(
        exclude_unset=True
    )

    if "programme_type" in updates:
        programme_type = (
            updates["programme_type"]
            .strip()
            .upper()
        )

        if programme_type not in {
            "SI",
            "ELEP",
        }:
            raise HTTPException(
                status_code=400,
                detail=(
                    "programme_type must be "
                    "SI or ELEP"
                ),
            )

        updates["programme_type"] = (
            programme_type
        )

    for field, value in updates.items():
        setattr(
            facilitator,
            field,
            value,
        )

    facilitator.verified_at = (
        datetime.utcnow()
    )

    db.commit()
    db.refresh(facilitator)

    return facilitator


@router.post(
    "/{facilitator_id}/verify",
    response_model=schemas.FacilitatorOut,
)
def verify_facilitator(
    facilitator_id: int,
    current_admin: models.Admin = Depends(
        get_current_admin
    ),
    db: Session = Depends(get_db),
):
    facilitator = (
        db.query(models.Facilitator)
        .filter(
            models.Facilitator.id
            == facilitator_id
        )
        .first()
    )

    if facilitator is None:
        raise HTTPException(
            status_code=404,
            detail="Facilitator not found",
        )

    facilitator.verified_at = (
        datetime.utcnow()
    )

    db.commit()
    db.refresh(facilitator)

    return facilitator


@router.delete(
    "/{facilitator_id}",
    status_code=204,
)
def deactivate_facilitator(
    facilitator_id: int,
    current_admin: models.Admin = Depends(
        get_current_admin
    ),
    db: Session = Depends(get_db),
):
    facilitator = (
        db.query(models.Facilitator)
        .filter(
            models.Facilitator.id
            == facilitator_id
        )
        .first()
    )

    if facilitator is None:
        raise HTTPException(
            status_code=404,
            detail="Facilitator not found",
        )

    facilitator.is_active = False

    db.commit()

    return None