# app/routers/modules.py
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.dependencies import get_current_admin

router = APIRouter(prefix="/modules", tags=["Modules"])


# ---------- Public Endpoints ----------

@router.get("", response_model=List[schemas.ModuleOut])
def list_modules(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """List all modules (public)."""
    return db.query(models.Module).offset(skip).limit(limit).all()


@router.get("/{code}", response_model=schemas.ModuleWithPrerequisitesOut)
def get_module(code: str, db: Session = Depends(get_db)):
    """Get a single module by its code, including prerequisites and unlocks."""
    module = db.query(models.Module).filter(models.Module.code == code).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    return schemas.ModuleWithPrerequisitesOut(
        code=module.code,
        name=module.name,
        credits=module.credits,
        category=module.category,
        level=module.level,
        description=module.description,
        prerequisites=[p.code for p in module.prerequisites],
        unlocks=[u.code for u in module.unlocks],
        status=None,
        grade=None,
        attempt=None,
        is_compulsory=None,
    )


# ---------- Admin-Only Endpoints ----------

@router.post("", response_model=schemas.ModuleOut, status_code=status.HTTP_201_CREATED)
def create_module(
    payload: schemas.ModuleCreate,
    current_admin: models.Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Create a new module (admin only)."""
    existing = db.query(models.Module).filter(models.Module.code == payload.code).first()
    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"Module with code '{payload.code}' already exists"
        )
    
    module = models.Module(**payload.model_dump())
    db.add(module)
    db.commit()
    db.refresh(module)
    return module


@router.patch("/{code}", response_model=schemas.ModuleOut)
def update_module(
    code: str,
    payload: schemas.ModuleUpdate,
    current_admin: models.Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Update a module (admin only)."""
    module = db.query(models.Module).filter(models.Module.code == code).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(module, field, value)
    
    db.commit()
    db.refresh(module)
    return module


@router.delete("/{code}", status_code=status.HTTP_204_NO_CONTENT)
def delete_module(
    code: str,
    current_admin: models.Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Delete a module (admin only). Checks that no students are enrolled."""
    module = db.query(models.Module).filter(models.Module.code == code).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    # Check if any students are enrolled in this module
    enrolments = db.query(models.Enrolment).filter(
        models.Enrolment.module_id == module.id
    ).first()
    
    if enrolments:
        raise HTTPException(
            status_code=409,
            detail=f"Cannot delete module '{code}' - students are enrolled in it"
        )
    
    db.delete(module)
    db.commit()


# ---------- Prerequisite Management ----------

@router.get("/{code}/prerequisites", response_model=List[schemas.ModuleOut])
def get_prerequisites(
    code: str,
    db: Session = Depends(get_db),
):
    """Get all prerequisites for a module."""
    module = db.query(models.Module).filter(models.Module.code == code).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    return module.prerequisites


@router.put("/{code}/prerequisites", response_model=schemas.ModuleWithPrerequisitesOut)
def set_prerequisites(
    code: str,
    payload: schemas.PrerequisiteUpdate,
    current_admin: models.Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Set the full list of prerequisites for a module.
    This replaces any existing prerequisites with the new list.
    """
    module = db.query(models.Module).filter(models.Module.code == code).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    # Validate that all prerequisite codes exist
    prerequisite_modules = []
    for prereq_code in payload.prerequisite_codes:
        prereq = db.query(models.Module).filter(models.Module.code == prereq_code).first()
        if not prereq:
            raise HTTPException(
                status_code=404,
                detail=f"Prerequisite module '{prereq_code}' not found"
            )
        if prereq.id == module.id:
            raise HTTPException(
                status_code=400,
                detail="A module cannot be its own prerequisite"
            )
        prerequisite_modules.append(prereq)
    
    # Check for circular dependencies
    for prereq in prerequisite_modules:
        if module in prereq.prerequisites:
            raise HTTPException(
                status_code=400,
                detail=f"Circular dependency detected: {module.code} and {prereq.code} depend on each other"
            )
    
    # Replace prerequisites
    module.prerequisites = prerequisite_modules
    db.commit()
    db.refresh(module)
    
    return schemas.ModuleWithPrerequisitesOut(
        code=module.code,
        name=module.name,
        credits=module.credits,
        category=module.category,
        level=module.level,
        description=module.description,
        prerequisites=[p.code for p in module.prerequisites],
        unlocks=[u.code for u in module.unlocks],
        status=None,
        grade=None,
        attempt=None,
        is_compulsory=None,
    )


@router.post("/{code}/prerequisites/{prereq_code}", response_model=schemas.ModuleWithPrerequisitesOut)
def add_prerequisite(
    code: str,
    prereq_code: str,
    current_admin: models.Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Add a single prerequisite to a module."""
    module = db.query(models.Module).filter(models.Module.code == code).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    prereq = db.query(models.Module).filter(models.Module.code == prereq_code).first()
    if not prereq:
        raise HTTPException(status_code=404, detail="Prerequisite module not found")
    
    if prereq.id == module.id:
        raise HTTPException(status_code=400, detail="A module cannot be its own prerequisite")
    
    if prereq in module.prerequisites:
        raise HTTPException(
            status_code=409,
            detail=f"'{prereq_code}' is already a prerequisite of '{code}'"
        )
    
    if module in prereq.prerequisites:
        raise HTTPException(
            status_code=400,
            detail=f"Circular dependency: {code} already depends on {prereq_code}"
        )
    
    module.prerequisites.append(prereq)
    db.commit()
    db.refresh(module)
    
    return schemas.ModuleWithPrerequisitesOut(
        code=module.code,
        name=module.name,
        credits=module.credits,
        category=module.category,
        level=module.level,
        description=module.description,
        prerequisites=[p.code for p in module.prerequisites],
        unlocks=[u.code for u in module.unlocks],
        status=None,
        grade=None,
        attempt=None,
        is_compulsory=None,
    )


@router.delete("/{code}/prerequisites/{prereq_code}", response_model=schemas.ModuleWithPrerequisitesOut)
def remove_prerequisite(
    code: str,
    prereq_code: str,
    current_admin: models.Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Remove a single prerequisite from a module."""
    module = db.query(models.Module).filter(models.Module.code == code).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    prereq = db.query(models.Module).filter(models.Module.code == prereq_code).first()
    if not prereq:
        raise HTTPException(status_code=404, detail="Prerequisite module not found")
    
    if prereq not in module.prerequisites:
        raise HTTPException(
            status_code=404,
            detail=f"'{prereq_code}' is not a prerequisite of '{code}'"
        )
    
    module.prerequisites.remove(prereq)
    db.commit()
    db.refresh(module)
    
    return schemas.ModuleWithPrerequisitesOut(
        code=module.code,
        name=module.name,
        credits=module.credits,
        category=module.category,
        level=module.level,
        description=module.description,
        prerequisites=[p.code for p in module.prerequisites],
        unlocks=[u.code for u in module.unlocks],
        status=None,
        grade=None,
        attempt=None,
        is_compulsory=None,
    )