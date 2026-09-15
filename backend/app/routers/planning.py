# app/routers/planning.py
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app import models, schemas
from app.database import get_db
from app.dependencies import get_current_student
from app.services import progress_service

router = APIRouter(prefix="/planning", tags=["Planning"])


# ---------- Schemas ----------

class ModulePlanItem(BaseModel):
    code: str
    name: str
    credits: int
    level: int
    category: str
    is_compulsory: bool
    is_eligible: bool
    reason: Optional[str] = None
    prerequisites_met: bool
    missing_prerequisites: List[str] = []


class PlanRequest(BaseModel):
    module_codes: List[str]
    semester: str


class PlanResponse(BaseModel):
    selected_modules: List[ModulePlanItem]
    total_credits: int
    compulsory_count: int
    elective_count: int
    warnings: List[str]
    is_valid: bool
    recommended_modules: List[ModulePlanItem]
    missing_compulsory: List[ModulePlanItem]


# ---------- Helper Function ----------

def _passed_module_ids(db: Session, student: models.Student) -> set:
    rows = (
        db.query(models.Enrolment.module_id)
        .filter(
            models.Enrolment.student_id == student.id,
            models.Enrolment.status == "completed"
        )
        .all()
    )
    return {r[0] for r in rows}


# ---------- Existing Endpoints ----------

@router.get("/eligible-modules", response_model=list[schemas.EligibleModuleOut])
def eligible_modules(
    current_student: models.Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """Modules the student could enrol in *right now* - not yet passed, and
    every prerequisite already completed."""
    results = progress_service.get_eligible_modules(db, current_student)
    return [
        schemas.EligibleModuleOut(
            **schemas.ModuleOut.model_validate(r["module"]).model_dump(),
            reason=r["reason"]
        )
        for r in results
    ]


@router.get("/graduation-audit", response_model=schemas.GraduationAudit)
def graduation_audit(
    current_student: models.Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """
    Enhanced graduation audit with detailed breakdown including:
    - Requirements breakdown (compulsory/elective with percentages)
    - Credits by level and category
    - Prerequisite warnings
    - Urgent items list
    - In-progress module count
    """
    return progress_service.build_graduation_audit(db, current_student)


# ---------- Course Planner Endpoints ----------

@router.get("/planning-modules", response_model=List[ModulePlanItem])
def get_planning_modules(
    current_student: models.Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """Get all modules in the student's programme with eligibility status for planning."""
    programme_modules = db.query(models.ProgrammeModule).filter(
        models.ProgrammeModule.programme_id == current_student.programme_id
    ).options(joinedload(models.ProgrammeModule.module)).all()
    
    completed_ids = set(e.module_id for e in db.query(models.Enrolment).filter(
        models.Enrolment.student_id == current_student.id,
        models.Enrolment.status == "completed"
    ).all())
    
    failed_ids = set()
    failed_enrolments = db.query(models.Enrolment).filter(
        models.Enrolment.student_id == current_student.id,
        models.Enrolment.status == "failed"
    ).all()
    for e in failed_enrolments:
        failed_ids.add(e.module_id)
    
    enrolled_ids = set(e.module_id for e in db.query(models.Enrolment).filter(
        models.Enrolment.student_id == current_student.id,
        models.Enrolment.status.in_(["planned", "in-progress"])
    ).all())
    
    passed_ids = _passed_module_ids(db, current_student)
    result = []
    
    for link in programme_modules:
        module = link.module
        is_completed = module.id in completed_ids
        is_failed = module.id in failed_ids
        is_enrolled = module.id in enrolled_ids
        is_compulsory = link.is_compulsory
        
        missing_prereqs = []
        prerequisites_met = True
        if module.prerequisites:
            for prereq in module.prerequisites:
                if prereq.id not in passed_ids:
                    missing_prereqs.append(prereq.code)
                    prerequisites_met = False
        
        is_eligible = False
        reason = None
        
        if is_completed:
            reason = "Already completed ✅"
        elif is_failed:
            reason = "Failed - needs retake ❌"
        elif is_enrolled:
            reason = "Already enrolled 📋"
        elif not prerequisites_met:
            reason = f"Missing prerequisites: {', '.join(missing_prereqs)}"
        else:
            is_eligible = True
            reason = "Eligible to take ✅"
        
        result.append(ModulePlanItem(
            code=module.code,
            name=module.name,
            credits=module.credits,
            level=module.level,
            category=module.category,
            is_compulsory=is_compulsory,
            is_eligible=is_eligible,
            reason=reason,
            prerequisites_met=prerequisites_met,
            missing_prerequisites=missing_prereqs,
        ))
    
    result.sort(key=lambda x: (x.level, x.code))
    return result


@router.post("/plan", response_model=PlanResponse)
def generate_plan(
    payload: PlanRequest,
    current_student: models.Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """Generate a semester plan based on selected modules."""
    all_modules = get_planning_modules(current_student, db)
    module_map = {m.code: m for m in all_modules}
    
    selected_modules = []
    warnings = []
    total_credits = 0
    compulsory_count = 0
    elective_count = 0
    
    missing_compulsory = []
    for m in all_modules:
        if m.is_compulsory and m.reason != "Already completed ✅" and not m.is_eligible:
            missing_compulsory.append(m)
        elif m.is_compulsory and m.reason != "Already completed ✅" and m.is_eligible and m.code not in payload.module_codes:
            missing_compulsory.append(m)
    
    for code in payload.module_codes:
        if code not in module_map:
            warnings.append(f"Module {code} not found in your programme")
            continue
        
        module = module_map[code]
        
        if not module.is_eligible:
            warnings.append(f"{code}: {module.reason}")
            continue
        
        selected_modules.append(module)
        total_credits += module.credits
        if module.is_compulsory:
            compulsory_count += 1
        else:
            elective_count += 1
    
    is_valid = True
    
    if total_credits > 60:
        warnings.append(f"Total credits ({total_credits}) exceeds recommended maximum (60)")
        is_valid = False
    
    if total_credits < 45:
        warnings.append(f"Total credits ({total_credits}) is below recommended minimum (45)")
        is_valid = False
    
    level_3_count = len([m for m in selected_modules if m.level == 3])
    if level_3_count > 4:
        warnings.append(f"Too many 3rd-year modules ({level_3_count}). Recommended maximum is 4.")
        is_valid = False
    
    recommended = []
    for m in missing_compulsory[:5]:
        if m.code not in payload.module_codes:
            recommended.append(m)
    
    return PlanResponse(
        selected_modules=selected_modules,
        total_credits=total_credits,
        compulsory_count=compulsory_count,
        elective_count=elective_count,
        warnings=warnings,
        is_valid=is_valid,
        recommended_modules=recommended,
        missing_compulsory=missing_compulsory,
    )


@router.post("/save-plan", status_code=status.HTTP_201_CREATED)
def save_plan(
    payload: PlanRequest,
    current_student: models.Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """Save the student's planned modules for a semester."""
    db.query(models.Enrolment).filter(
        models.Enrolment.student_id == current_student.id,
        models.Enrolment.semester == payload.semester,
        models.Enrolment.status == "planned"
    ).delete()
    
    programme_modules = db.query(models.ProgrammeModule).filter(
        models.ProgrammeModule.programme_id == current_student.programme_id
    ).options(joinedload(models.ProgrammeModule.module)).all()
    module_codes_in_programme = {link.module.code for link in programme_modules}
    
    passed_ids = _passed_module_ids(db, current_student)
    
    created = 0
    for code in payload.module_codes:
        if code not in module_codes_in_programme:
            continue
        
        module = db.query(models.Module).filter(models.Module.code == code).first()
        if not module:
            continue
        
        if module.id in passed_ids:
            continue
        
        existing = db.query(models.Enrolment).filter(
            models.Enrolment.student_id == current_student.id,
            models.Enrolment.module_id == module.id,
            models.Enrolment.status == "completed"
        ).first()
        
        if existing:
            continue
        
        existing_planned = db.query(models.Enrolment).filter(
            models.Enrolment.student_id == current_student.id,
            models.Enrolment.module_id == module.id,
            models.Enrolment.semester == payload.semester,
            models.Enrolment.status == "planned"
        ).first()
        
        if existing_planned:
            continue
        
        db.add(models.Enrolment(
            student_id=current_student.id,
            module_id=module.id,
            semester=payload.semester,
            grade=None,
            status="planned",
            attempt=1,
        ))
        created += 1
    
    db.commit()
    
    return {"message": f"Plan saved for {payload.semester}", "modules_saved": created}