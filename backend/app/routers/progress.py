# app/routers/progress.py
from typing import Optional
from typing import List, Optional
from datetime import datetime, timedelta, timezone


from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from app import models, schemas
from app.database import get_db
from app.dependencies import get_current_student
from app.services import progress_service

router = APIRouter(prefix="/progress", tags=["Progress"])

VALID_STATUSES = {"planned", "in-progress", "completed", "failed"}


@router.get("/summary", response_model=schemas.ProgressSummary)
def get_summary(
    current_student: models.Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    return progress_service.build_progress_summary(db, current_student)


@router.get("/history", response_model=list[schemas.EnrolmentOut])
def get_history(
    status_filter: Optional[str] = Query(default=None, alias="status"),
    current_student: models.Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    if status_filter and status_filter not in VALID_STATUSES:
        raise HTTPException(status_code=422, detail=f"status must be one of {sorted(VALID_STATUSES)}")

    query = (
        db.query(models.Enrolment)
        .options(joinedload(models.Enrolment.module))
        .filter(models.Enrolment.student_id == current_student.id)
    )
    if status_filter:
        query = query.filter(models.Enrolment.status == status_filter)

    return query.order_by(models.Enrolment.semester, models.Enrolment.id).all()


@router.get("/degree-progress", response_model=dict)
def get_degree_progress(
    current_student: models.Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """
    Get degree progress with breakdown by category for the visual progress bar.
    """
    summary = progress_service.build_progress_summary(db, current_student)
    
    # Get compulsory vs elective breakdown
    compulsory_links = db.query(models.ProgrammeModule).filter(
        models.ProgrammeModule.programme_id == current_student.programme_id,
        models.ProgrammeModule.is_compulsory.is_(True)
    ).all()
    
    compulsory_modules = [link.module_id for link in compulsory_links]
    completed_ids = set(e.module_id for e in db.query(models.Enrolment).filter(
        models.Enrolment.student_id == current_student.id,
        models.Enrolment.status == "completed"
    ).all())
    
    compulsory_completed = len([m for m in compulsory_modules if m in completed_ids])
    compulsory_total = len(compulsory_modules)
    
    # Get elective progress
    elective_links = db.query(models.ProgrammeModule).filter(
        models.ProgrammeModule.programme_id == current_student.programme_id,
        models.ProgrammeModule.is_compulsory.is_(False)
    ).all()
    elective_total = len(elective_links)
    elective_completed = len([link for link in elective_links if link.module_id in completed_ids])
    
    # Calculate projected graduation
    distinct_semesters = db.query(models.Enrolment.semester).filter(
        models.Enrolment.student_id == current_student.id,
        models.Enrolment.status == "completed"
    ).distinct().count()
    
    projected_graduation = None
    if distinct_semesters > 0:
        avg_credits_per_semester = summary["credits_completed"] / distinct_semesters
        remaining_credits = summary["credits_remaining"]
        if avg_credits_per_semester > 0:
            semesters_needed = remaining_credits / avg_credits_per_semester
            projected_graduation = f"~{round(semesters_needed)} semester(s) remaining"
    
    return {
        "credits_completed": summary["credits_completed"],
        "credits_required": summary["credits_required"],
        "percentage": summary["percentage_complete"],
        "compulsory": {
            "completed": compulsory_completed,
            "total": compulsory_total,
            "percentage": round((compulsory_completed / compulsory_total) * 100, 1) if compulsory_total else 0
        },
        "elective": {
            "completed": elective_completed,
            "total": elective_total,
            "percentage": round((elective_completed / elective_total) * 100, 1) if elective_total else 0
        },
        "projected_graduation": projected_graduation,
        "weighted_average": summary["weighted_average"]
    }


@router.get("/semesters", response_model=List[dict])
def get_semester_breakdown(
    current_student: models.Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """
    Get all semesters with modules grouped by semester.
    Returns a timeline view of the student's academic progress.
    """
    enrolments = db.query(models.Enrolment).options(
        joinedload(models.Enrolment.module)
    ).filter(
        models.Enrolment.student_id == current_student.id
    ).order_by(models.Enrolment.semester).all()
    
    if not enrolments:
        return []
    
    semesters_dict = {}
    for e in enrolments:
        if e.semester not in semesters_dict:
            semesters_dict[e.semester] = []
        semesters_dict[e.semester].append(e)
    
    result = []
    for semester, modules in sorted(semesters_dict.items()):
        credits_completed = sum(
            m.module.credits for m in modules 
            if m.status == "completed"
        )
        
        grades = [m.grade for m in modules if m.grade is not None]
        avg = round(sum(grades) / len(grades), 2) if grades else None
        
        has_failed = any(m.status == "failed" for m in modules)
        all_completed = all(m.status == "completed" for m in modules)
        
        if all_completed and not has_failed:
            status = "completed"
        elif has_failed:
            status = "has_failed"
        else:
            status = "in_progress"
        
        result.append({
            "semester": semester,
            "modules": [
                {
                    "id": m.id,
                    "module": {
                        "code": m.module.code,
                        "name": m.module.name,
                        "credits": m.module.credits,
                        "level": m.module.level,
                    },
                    "grade": m.grade,
                    "status": m.status,
                    "attempt": m.attempt,
                }
                for m in modules
            ],
            "credits_completed": credits_completed,
            "average": avg,
            "status": status,
            "module_count": len(modules),
        })
    
    return result


@router.get("/yearly-breakdown", response_model=List[dict])
def get_yearly_breakdown(
    current_student: models.Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """
    Get academic progress grouped by year, with semester-level details.
    """
    enrolments = db.query(models.Enrolment).options(
        joinedload(models.Enrolment.module)
    ).filter(
        models.Enrolment.student_id == current_student.id
    ).order_by(models.Enrolment.semester).all()
    
    if not enrolments:
        return []
    
    years = {}
    for e in enrolments:
        if '-' in e.semester:
            year = e.semester.split('-')[0]
        else:
            year = e.semester[:4]
        
        if year not in years:
            years[year] = {}
        
        sem = e.semester
        if sem not in years[year]:
            years[year][sem] = []
        years[year][sem].append(e)
    
    result = []
    for year, semesters in sorted(years.items()):
        year_data = {
            "year": year,
            "semesters": [],
            "year_credits": 0,
            "year_modules": 0,
            "year_average": None
        }
        all_grades = []
        
        for sem, modules in sorted(semesters.items()):
            credits_completed = sum(m.module.credits for m in modules if m.status == "completed")
            grades = [m.grade for m in modules if m.grade is not None]
            avg = round(sum(grades) / len(grades), 2) if grades else None
            
            sem_data = {
                "semester": sem,
                "modules": [
                    {
                        "id": m.id,
                        "module": {
                            "code": m.module.code,
                            "name": m.module.name,
                            "credits": m.module.credits,
                            "level": m.module.level,
                        },
                        "grade": m.grade,
                        "status": m.status,
                        "attempt": m.attempt,
                    }
                    for m in modules
                ],
                "credits_completed": credits_completed,
                "average": avg,
                "module_count": len(modules)
            }
            year_data["semesters"].append(sem_data)
            year_data["year_credits"] += credits_completed
            year_data["year_modules"] += len(modules)
            if avg is not None:
                all_grades.extend(grades)
        
        if all_grades:
            year_data["year_average"] = round(sum(all_grades) / len(all_grades), 2)
        
        result.append(year_data)
    
    return result


@router.get("/peer-comparison", response_model=dict)
def get_peer_comparison(
    current_student: models.Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """
    Get anonymized peer comparison statistics for the current student.
    """
    return progress_service.get_peer_comparison(db, current_student)


@router.get("/modules/{code}/detail", response_model=schemas.ModuleDetailOut)
def get_module_detail(
    code: str,
    current_student: models.Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """
    Get detailed module information including prerequisites, unlocks,
    and the student's personal status.
    """
    module = db.query(models.Module).filter(models.Module.code == code).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    enrolment = db.query(models.Enrolment).filter(
        models.Enrolment.student_id == current_student.id,
        models.Enrolment.module_id == module.id
    ).order_by(models.Enrolment.attempt.desc()).first()
    
    programme_module = db.query(models.ProgrammeModule).filter(
        models.ProgrammeModule.programme_id == current_student.programme_id,
        models.ProgrammeModule.module_id == module.id
    ).first()
    
    return schemas.ModuleDetailOut(
        code=module.code,
        name=module.name,
        credits=module.credits,
        category=module.category,
        level=module.level,
        description=module.description,
        prerequisites=[p.code for p in module.prerequisites],
        unlocks=[u.code for u in module.unlocks],
        status=enrolment.status if enrolment else "not_taken",
        grade=enrolment.grade if enrolment else None,
        attempt=enrolment.attempt if enrolment else None,
        is_compulsory=programme_module.is_compulsory if programme_module else None,
    )


@router.post("/predict-grades", response_model=schemas.GradePredictionResult)
def predict_grades(
    payload: schemas.GradePredictionRequest,
    current_student: models.Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """
    Predict what happens to the student's GPA if they get certain grades
    in modules they haven't completed yet.
    """
    summary = progress_service.build_progress_summary(db, current_student)
    
    completed_enrolments = db.query(models.Enrolment).options(
        joinedload(models.Enrolment.module)
    ).filter(
        models.Enrolment.student_id == current_student.id,
        models.Enrolment.status == "completed",
        models.Enrolment.grade.isnot(None)
    ).all()
    
    total_weighted = 0
    total_credits = 0
    for e in completed_enrolments:
        total_weighted += e.grade * e.module.credits
        total_credits += e.module.credits
    
    current_avg = round(total_weighted / total_credits, 2) if total_credits > 0 else None
    
    affected_modules = []
    eligibility_warnings = []
    new_total_weighted = total_weighted
    new_total_credits = total_credits
    credits_with_predictions = 0
    
    completed_module_ids = {e.module_id for e in completed_enrolments}
    eligible_modules = progress_service.get_eligible_modules(db, current_student)
    eligible_codes = {m["module"].code for m in eligible_modules}
    
    for pred in payload.predictions:
        module = db.query(models.Module).filter(
            models.Module.code == pred.module_code
        ).first()
        
        if not module:
            eligibility_warnings.append(f"Module {pred.module_code} not found")
            continue
        
        if module.id in completed_module_ids:
            eligibility_warnings.append(
                f"{module.code} already completed (skipped)"
            )
            continue
        
        if module.code not in eligible_codes:
            missing = progress_service.check_prerequisites_met(db, current_student, module)
            if missing:
                eligibility_warnings.append(
                    f"{module.code}: Missing prerequisites: {', '.join(missing)}"
                )
                continue
            else:
                eligibility_warnings.append(
                    f"{module.code}: Not yet eligible for other reasons"
                )
                continue
        
        new_total_weighted += pred.predicted_grade * module.credits
        new_total_credits += module.credits
        credits_with_predictions += module.credits
        
        grade_diff = pred.predicted_grade - (current_avg or 0)
        if grade_diff >= 10:
            impact = "🚀 Significant boost"
        elif grade_diff >= 5:
            impact = "📈 Moderate boost"
        elif grade_diff >= -5:
            impact = "➖ Minor impact"
        elif grade_diff >= -10:
            impact = "📉 Moderate drop"
        else:
            impact = "⚠️ Significant drop"
        
        affected_modules.append({
            "code": module.code,
            "name": module.name,
            "credits": module.credits,
            "predicted_grade": pred.predicted_grade,
            "impact": impact,
            "grade_diff": round(grade_diff, 1),
        })
    
    new_avg = round(new_total_weighted / new_total_credits, 2) if new_total_credits > 0 else None
    
    if new_avg and current_avg:
        if new_avg >= current_avg + 2:
            graduation_impact = "🎉 Your average would increase significantly! This could improve your graduation prospects."
        elif new_avg > current_avg:
            graduation_impact = "📈 Your average would improve slightly. Keep it up!"
        elif new_avg >= current_avg - 2:
            graduation_impact = "➖ Your average would remain stable."
        else:
            graduation_impact = "⚠️ Your average would decrease. Consider retaking some modules."
    else:
        graduation_impact = "Complete more modules to get a meaningful prediction."

    return schemas.GradePredictionResult(
        current_weighted_average=current_avg,
        new_weighted_average=new_avg,
        change=round(new_avg - current_avg, 2) if current_avg and new_avg else 0,
        credits_completed=total_credits,
        credits_with_predictions=credits_with_predictions,
        total_credits_after=new_total_credits,
        modules_affected=affected_modules,
        eligibility_warnings=eligibility_warnings,
        graduation_impact=graduation_impact,
    )


@router.get("/achievements", response_model=dict)
def get_achievements(
    current_student: models.Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """
    Get all achievements and milestones for the current student.
    """
    return progress_service.get_achievement_summary(db, current_student)