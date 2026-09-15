# app/routers/programmes.py
from collections import defaultdict
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app import models, schemas
from app.database import get_db
from app.dependencies import get_current_admin

router = APIRouter(prefix="/programmes", tags=["Programmes"])


# ---------- Public Endpoints ----------

@router.get("", response_model=list[schemas.ProgrammeOut])
def list_programmes(db: Session = Depends(get_db)):
    return db.query(models.Programme).order_by(models.Programme.name).all()


@router.get("/{code}", response_model=schemas.ProgrammeOut)
def get_programme(code: str, db: Session = Depends(get_db)):
    programme = db.query(models.Programme).filter(models.Programme.code == code).first()
    if programme is None:
        raise HTTPException(status_code=404, detail=f"Unknown programme code '{code}'")
    return programme


@router.get("/{code}/curriculum", response_model=schemas.ProgrammeCurriculumOut)
def get_curriculum(code: str, db: Session = Depends(get_db)):
    programme = db.query(models.Programme).filter(models.Programme.code == code).first()
    if programme is None:
        raise HTTPException(status_code=404, detail=f"Unknown programme code '{code}'")

    links = (
        db.query(models.ProgrammeModule)
        .options(joinedload(models.ProgrammeModule.module))
        .filter(models.ProgrammeModule.programme_id == programme.id)
        .all()
    )

    by_level: dict = defaultdict(list)
    for link in links:
        m = link.module
        by_level[m.level].append(
            schemas.CurriculumModuleOut(
                code=m.code,
                name=m.name,
                credits=m.credits,
                category=m.category,
                level=m.level,
                description=m.description,
                is_compulsory=link.is_compulsory,
            )
        )
    for level_modules in by_level.values():
        level_modules.sort(key=lambda m: m.code)

    return schemas.ProgrammeCurriculumOut(
        code=programme.code,
        name=programme.name,
        faculty=programme.faculty,
        total_credits_required=programme.total_credits_required,
        modules_by_level=dict(by_level),
    )


# ---------- Programme-Module Management (Admin Only) ----------

@router.get("/{code}/modules", response_model=List[schemas.ProgrammeModuleOut])
def get_programme_modules(
    code: str,
    db: Session = Depends(get_db),
):
    """Get all modules linked to a programme with their compulsory status."""
    programme = db.query(models.Programme).filter(models.Programme.code == code).first()
    if not programme:
        raise HTTPException(status_code=404, detail="Programme not found")
    
    results = []
    for link in programme.programme_modules:
        results.append(
            schemas.ProgrammeModuleOut(
                programme_code=programme.code,
                programme_name=programme.name,
                module_code=link.module.code,
                module_name=link.module.name,
                is_compulsory=link.is_compulsory,
            )
        )
    
    results.sort(key=lambda x: x.module_code)
    return results


@router.post("/{code}/modules", status_code=status.HTTP_201_CREATED)
def add_module_to_programme(
    code: str,
    payload: schemas.ProgrammeModuleAdd,
    current_admin: models.Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Add a module to a programme's curriculum (admin only)."""
    programme = db.query(models.Programme).filter(models.Programme.code == code).first()
    if not programme:
        raise HTTPException(status_code=404, detail="Programme not found")
    
    module = db.query(models.Module).filter(models.Module.code == payload.module_code).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    existing = db.query(models.ProgrammeModule).filter(
        models.ProgrammeModule.programme_id == programme.id,
        models.ProgrammeModule.module_id == module.id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"Module '{payload.module_code}' is already linked to programme '{code}'"
        )
    
    link = models.ProgrammeModule(
        programme_id=programme.id,
        module_id=module.id,
        is_compulsory=payload.is_compulsory,
    )
    db.add(link)
    db.commit()
    db.refresh(link)
    
    return {"message": f"Module '{payload.module_code}' added to programme '{code}'"}


@router.patch("/{code}/modules/{module_code}")
def update_programme_module(
    code: str,
    module_code: str,
    payload: schemas.ProgrammeModuleUpdate,
    current_admin: models.Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Update a module's compulsory status within a programme (admin only)."""
    programme = db.query(models.Programme).filter(models.Programme.code == code).first()
    if not programme:
        raise HTTPException(status_code=404, detail="Programme not found")
    
    module = db.query(models.Module).filter(models.Module.code == module_code).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    link = db.query(models.ProgrammeModule).filter(
        models.ProgrammeModule.programme_id == programme.id,
        models.ProgrammeModule.module_id == module.id
    ).first()
    
    if not link:
        raise HTTPException(
            status_code=404,
            detail=f"Module '{module_code}' is not linked to programme '{code}'"
        )
    
    link.is_compulsory = payload.is_compulsory
    db.commit()
    
    return {"message": f"Module '{module_code}' status updated to {'compulsory' if payload.is_compulsory else 'elective'}"}


@router.delete("/{code}/modules/{module_code}", status_code=status.HTTP_204_NO_CONTENT)
def remove_module_from_programme(
    code: str,
    module_code: str,
    current_admin: models.Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Remove a module from a programme's curriculum (admin only)."""
    programme = db.query(models.Programme).filter(models.Programme.code == code).first()
    if not programme:
        raise HTTPException(status_code=404, detail="Programme not found")
    
    module = db.query(models.Module).filter(models.Module.code == module_code).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    link = db.query(models.ProgrammeModule).filter(
        models.ProgrammeModule.programme_id == programme.id,
        models.ProgrammeModule.module_id == module.id
    ).first()
    
    if not link:
        raise HTTPException(
            status_code=404,
            detail=f"Module '{module_code}' is not linked to programme '{code}'"
        )
    
    db.delete(link)
    db.commit()