# app/routers/admin.py
import csv
import io
from datetime import datetime, timezone
from typing import Optional, List
import jwt

from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, UploadFile, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.dependencies import get_current_admin, get_current_student
from app.exceptions import DuplicateModuleCompletionError
from app.rate_limit import limiter
from app.email_service import send_login_pin_email
from app.security import create_access_token, create_refresh_token, generate_pin, hash_password, verify_password
from app.config import settings
from app.services import progress_service

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.post("/login", response_model=schemas.TokenPair)
@limiter.limit("5/minute")
def admin_login(request: Request, payload: schemas.AdminLogin, db: Session = Depends(get_db)):
    admin = db.query(models.Admin).filter(models.Admin.username == payload.username).first()
    if not admin or not verify_password(payload.password, admin.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    if not admin.is_active:
        raise HTTPException(status_code=403, detail="This admin account has been deactivated")

    return schemas.TokenPair(
        access_token=create_access_token(admin.id, "admin"),
        refresh_token=create_refresh_token(admin.id, "admin"),
    )


@router.get("/me", response_model=schemas.AdminOut)
def get_me(current_admin: models.Admin = Depends(get_current_admin)):
    return current_admin


# ---------- Student record management ----------

def _get_programme_or_404(db: Session, code: str) -> models.Programme:
    programme = db.query(models.Programme).filter(models.Programme.code == code).first()
    if programme is None:
        raise HTTPException(status_code=404, detail=f"Unknown programme code '{code}'")
    return programme


@router.get("/students", response_model=schemas.PaginatedStudentResponse)
def list_students(
    # Search
    q: Optional[str] = Query(default=None, description="Search name / student number / email"),
    
    # Filters
    programme_code: Optional[str] = Query(default=None, description="Filter by programme code"),
    current_year: Optional[int] = Query(default=None, description="Filter by year (1-4)"),
    is_active: Optional[bool] = Query(default=None, description="Filter by status (true/false)"),
    
    # Sorting
    sort_by: Optional[str] = Query(default="name", description="Field to sort by: name, student_number, year, programme, average"),
    sort_order: Optional[str] = Query(default="asc", description="Sort order: asc or desc"),
    
    # Pagination
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    
    current_admin: models.Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    List students with advanced filtering, sorting, and pagination.
    """
    query = db.query(models.Student)
    
    # ---------- Text Search ----------
    if q:
        like = f"%{q}%"
        query = query.filter(
            (models.Student.name.ilike(like))
            | (models.Student.student_number.ilike(like))
            | (models.Student.email.ilike(like))
        )
    
    # ---------- Filters ----------
    if programme_code:
        query = query.join(models.Programme).filter(models.Programme.code == programme_code)
    
    if current_year:
        query = query.filter(models.Student.current_year == current_year)
    
    if is_active is not None:
        query = query.filter(models.Student.is_active == is_active)
    
    # ---------- Sorting ----------
    sort_field_map = {
        "name": models.Student.name,
        "student_number": models.Student.student_number,
        "year": models.Student.current_year,
        "programme": models.Programme.code,
        "average": None,
    }
    
    if sort_by == "average":
        order_col = models.Student.target_average
    else:
        order_col = sort_field_map.get(sort_by, models.Student.name)
    
    if sort_order == "desc":
        query = query.order_by(order_col.desc())
    else:
        query = query.order_by(order_col.asc())
    
    if sort_by == "programme":
        query = query.join(models.Programme).order_by(
            models.Programme.code.desc() if sort_order == "desc" else models.Programme.code.asc()
        )
    
    # ---------- Get Total Count ----------
    total_count = query.count()
    
    # ---------- Pagination ----------
    students = query.offset(skip).limit(limit).all()
    
    return schemas.PaginatedStudentResponse(
        total=total_count,
        skip=skip,
        limit=limit,
        students=students,
    )


@router.post("/students", response_model=schemas.AdminStudentCreatedOut, status_code=status.HTTP_201_CREATED)
def create_student(
    payload: schemas.AdminStudentCreate,
    current_admin: models.Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    programme = _get_programme_or_404(db, payload.programme_code)
    if db.query(models.Student).filter(models.Student.student_number == payload.student_number).first():
        raise HTTPException(status_code=409, detail="A student with that student number already exists")
    if db.query(models.Student).filter(models.Student.email == payload.email).first():
        raise HTTPException(status_code=409, detail="A student with that email already exists")

    pin = generate_pin()
    student = models.Student(
        name=payload.name,
        student_number=payload.student_number,
        email=payload.email,
        pin_hash=hash_password(pin),
        programme_id=programme.id,
        current_year=payload.current_year,
    )
    db.add(student)
    db.commit()
    db.refresh(student)

    send_login_pin_email(student.email, student.name, pin)

    return schemas.AdminStudentCreatedOut(
        **schemas.AdminStudentOut.model_validate(student).model_dump(),
        login_pin=pin,
    )


@router.post("/students/{student_id}/regenerate-pin", response_model=schemas.AdminStudentCreatedOut)
def regenerate_pin(
    student_id: int,
    current_admin: models.Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if student is None:
        raise HTTPException(status_code=404, detail="Student not found")

    pin = generate_pin()
    student.pin_hash = hash_password(pin)
    db.commit()
    db.refresh(student)

    send_login_pin_email(student.email, student.name, pin)

    return schemas.AdminStudentCreatedOut(
        **schemas.AdminStudentOut.model_validate(student).model_dump(),
        login_pin=pin,
    )


@router.get("/students/{student_id}", response_model=schemas.AdminStudentOut)
def get_student(
    student_id: int,
    current_admin: models.Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if student is None:
        raise HTTPException(status_code=404, detail="Student not found")
    return student


@router.get("/students/{student_id}/summary", response_model=schemas.ProgressSummary)
def get_student_summary(
    student_id: int,
    current_admin: models.Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if student is None:
        raise HTTPException(status_code=404, detail="Student not found")
    return progress_service.build_progress_summary(db, student)


@router.patch("/students/{student_id}", response_model=schemas.AdminStudentOut)
def update_student(
    student_id: int,
    payload: schemas.AdminStudentUpdate,
    current_admin: models.Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if student is None:
        raise HTTPException(status_code=404, detail="Student not found")

    updates = payload.model_dump(exclude_unset=True)
    if "programme_code" in updates:
        programme = _get_programme_or_404(db, updates.pop("programme_code"))
        student.programme_id = programme.id
    for field, value in updates.items():
        setattr(student, field, value)

    db.commit()
    db.refresh(student)
    return student


@router.delete("/students/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
def deactivate_student(
    student_id: int,
    current_admin: models.Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if student is None:
        raise HTTPException(status_code=404, detail="Student not found")
    student.is_active = False
    db.commit()


# ---------- Marks ----------

@router.post(
    "/students/{student_id}/marks",
    response_model=schemas.EnrolmentOut,
    status_code=status.HTTP_201_CREATED,
)
def record_mark(
    student_id: int,
    payload: schemas.ModuleCompletion,
    current_admin: models.Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if student is None:
        raise HTTPException(status_code=404, detail="Student not found")

    try:
        enrolment = progress_service.record_official_completion(
            db, student, payload.module_code, payload.semester, payload.grade
        )
        
        # 👇 NEW: Send grade notification if module is completed (passed)
        if enrolment.status == "completed":
            module = db.query(models.Module).filter(models.Module.code == payload.module_code).first()
            if module:
                # Send grade release email
                progress_service.notify_grade_released(db, student, module, payload.grade, payload.semester)
                
                # Check for newly unlocked achievements
                progress_service.check_and_notify_achievements(db, student)
        
        return enrolment
        
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except DuplicateModuleCompletionError as exc:
        raise HTTPException(status_code=409, detail=str(exc))


# ---------- Bulk CSV upload ----------

@router.post("/students/upload", response_model=schemas.BulkUploadReport)
def upload_students_csv(
    file: UploadFile = File(...),
    current_admin: models.Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """CSV columns: name, student_number, email, programme_code, current_year"""
    content = file.file.read().decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(content))

    results = []
    succeeded = 0
    for i, row in enumerate(reader, start=2):
        student_number = (row.get("student_number") or "").strip()
        try:
            programme_code = (row.get("programme_code") or "").strip()
            programme = db.query(models.Programme).filter(models.Programme.code == programme_code).first()
            if programme is None:
                raise ValueError(f"Unknown programme code '{programme_code}'")

            existing = (
                db.query(models.Student)
                .filter(models.Student.student_number == student_number)
                .first()
            )
            if existing:
                existing.name = row["name"].strip()
                existing.email = row["email"].strip()
                existing.programme_id = programme.id
                existing.current_year = int(row.get("current_year") or existing.current_year)
                db.commit()
                results.append(schemas.BulkUploadRowResult(row=i, identifier=student_number, status="updated"))
            else:
                pin = generate_pin()
                student = models.Student(
                    name=row["name"].strip(),
                    student_number=student_number,
                    email=row["email"].strip(),
                    pin_hash=hash_password(pin),
                    programme_id=programme.id,
                    current_year=int(row.get("current_year") or 1),
                )
                db.add(student)
                db.commit()
                send_login_pin_email(student.email, student.name, pin)
                results.append(schemas.BulkUploadRowResult(row=i, identifier=student_number, status="created"))
            succeeded += 1
        except Exception as exc:
            db.rollback()
            results.append(
                schemas.BulkUploadRowResult(
                    row=i, identifier=student_number or "(missing)", status="error", detail=str(exc)
                )
            )

    return schemas.BulkUploadReport(
        total_rows=len(results), succeeded=succeeded, failed=len(results) - succeeded, results=results
    )


@router.post("/marks/upload", response_model=schemas.BulkUploadReport)
def upload_marks_csv(
    file: UploadFile = File(...),
    current_admin: models.Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """CSV columns: student_number, module_code, semester, grade"""
    content = file.file.read().decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(content))

    results = []
    succeeded = 0
    for i, row in enumerate(reader, start=2):
        student_number = (row.get("student_number") or "").strip()
        module_code = (row.get("module_code") or "").strip()
        identifier = f"{student_number}/{module_code}"
        try:
            student = (
                db.query(models.Student)
                .filter(models.Student.student_number == student_number)
                .first()
            )
            if student is None:
                raise ValueError(f"No student with number '{student_number}'")

            enrolment = progress_service.record_official_completion(
                db, student, module_code, (row.get("semester") or "").strip(), float(row["grade"])
            )
            
            # 👇 NEW: Send grade notification for bulk uploads too
            if enrolment.status == "completed":
                module = db.query(models.Module).filter(models.Module.code == module_code).first()
                if module:
                    progress_service.notify_grade_released(db, student, module, float(row["grade"]), row.get("semester", "").strip())
                    progress_service.check_and_notify_achievements(db, student)
            
            results.append(schemas.BulkUploadRowResult(row=i, identifier=identifier, status="created"))
            succeeded += 1
        except Exception as exc:
            db.rollback()
            results.append(
                schemas.BulkUploadRowResult(row=i, identifier=identifier, status="error", detail=str(exc))
            )

    return schemas.BulkUploadReport(
        total_rows=len(results), succeeded=succeeded, failed=len(results) - succeeded, results=results
    )


# ---------- Dashboard ----------

@router.get("/dashboard", response_model=schemas.DashboardStats)
def get_dashboard(
    current_admin: models.Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    total_students = db.query(models.Student).count()
    active_students_list = db.query(models.Student).filter(models.Student.is_active.is_(True)).all()

    programme_counts: dict = {}
    averages = []
    at_risk = []

    for s in active_students_list:
        entry = programme_counts.setdefault(s.programme.code, {"name": s.programme.name, "count": 0})
        entry["count"] += 1

        summary = progress_service.build_progress_summary(db, s)
        if summary["weighted_average"] is not None:
            averages.append(summary["weighted_average"])

        blocking = [f for f in summary["failed_modules"] if f["is_prerequisite_for_major"]]
        reasons = []
        if blocking:
            reasons.append(f"{len(blocking)} failed module(s) blocking major")
        if summary["weighted_average"] is not None and summary["weighted_average"] < s.target_average:
            reasons.append(
                f"Weighted average ({summary['weighted_average']}) below target ({s.target_average})"
            )

        if reasons:
            at_risk.append(
                schemas.AtRiskStudentOut(
                    id=s.id,
                    name=s.name,
                    student_number=s.student_number,
                    programme_code=s.programme.code,
                    weighted_average=summary["weighted_average"],
                    target_average=s.target_average,
                    failed_blocking_count=len(blocking),
                    reasons=reasons,
                )
            )

    at_risk.sort(key=lambda x: (-x.failed_blocking_count, x.weighted_average or 0))

    return schemas.DashboardStats(
        total_students=total_students,
        active_students=len(active_students_list),
        students_by_programme=[
            schemas.ProgrammeCount(programme_code=code, programme_name=v["name"], student_count=v["count"])
            for code, v in sorted(programme_counts.items())
        ],
        cohort_average=round(sum(averages) / len(averages), 2) if averages else None,
        at_risk_count=len(at_risk),
        at_risk_students=at_risk,
    )


@router.get("/programme-breakdown", response_model=list[schemas.ProgrammeBreakdown])
def get_programme_breakdown(
    current_admin: models.Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Get per-programme analytics."""
    programmes = db.query(models.Programme).order_by(models.Programme.name).all()
    breakdown = []

    for programme in programmes:
        students = (
            db.query(models.Student)
            .filter(models.Student.programme_id == programme.id, models.Student.is_active.is_(True))
            .all()
        )

        percentages = []
        averages = []
        fail_counts: dict = {}

        for s in students:
            summary = progress_service.build_progress_summary(db, s)
            percentages.append(summary["percentage_complete"])
            if summary["weighted_average"] is not None:
                averages.append(summary["weighted_average"])
            for f in summary["failed_modules"]:
                fail_counts[f["module"].id] = fail_counts.get(f["module"].id, 0) + 1

        top_modules = sorted(fail_counts.items(), key=lambda x: -x[1])[:5]
        bottleneck_modules = []
        for module_id, count in top_modules:
            module = db.query(models.Module).filter(models.Module.id == module_id).first()
            if module:
                bottleneck_modules.append(
                    schemas.BottleneckModuleOut(code=module.code, name=module.name, fail_count=count)
                )

        breakdown.append(
            schemas.ProgrammeBreakdown(
                programme_code=programme.code,
                programme_name=programme.name,
                student_count=len(students),
                avg_percentage_complete=round(sum(percentages) / len(percentages), 1) if percentages else None,
                avg_weighted_average=round(sum(averages) / len(averages), 2) if averages else None,
                bottleneck_modules=bottleneck_modules,
            )
        )

    return breakdown


# ---------- Impersonation ----------

@router.post("/impersonate/{student_id}", response_model=schemas.TokenPair)
def impersonate_student(
    student_id: int,
    current_admin: models.Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Generate a student access token for the admin to view the student's dashboard.
    """
    student = db.query(models.Student).filter(
        models.Student.id == student_id,
        models.Student.is_active.is_(True)
    ).first()
    
    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found or account is inactive"
        )
    
    now = datetime.now(timezone.utc)
    
    access_payload = {
        "sub": str(student.id),
        "role": "student",
        "type": "access",
        "impersonated_by": current_admin.id,
        "impersonated_by_name": current_admin.name,
        "is_impersonation": True,
        "iat": now,
        "exp": now + timedelta(minutes=settings.access_token_expire_minutes),
    }
    
    refresh_payload = {
        "sub": str(student.id),
        "role": "student",
        "type": "refresh",
        "impersonated_by": current_admin.id,
        "impersonated_by_name": current_admin.name,
        "is_impersonation": True,
        "iat": now,
        "exp": now + timedelta(days=settings.refresh_token_expire_days),
    }
    
    access_token = jwt.encode(access_payload, settings.secret_key, algorithm=settings.algorithm)
    refresh_token = jwt.encode(refresh_payload, settings.secret_key, algorithm=settings.algorithm)
    
    return schemas.TokenPair(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
    )


@router.post("/stop-impersonation", status_code=status.HTTP_204_NO_CONTENT)
def stop_impersonation(
    current_student: models.Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """
    Endpoint for the frontend to call when exiting impersonation mode.
    """
    return None