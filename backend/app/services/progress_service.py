# app/services/progress_service.py
import math
from collections import defaultdict
from typing import List, Optional
from datetime import datetime
from app.email_service import send_grade_released_email, send_achievement_unlocked_email
from app.models import StudentAchievement
from sqlalchemy.orm import Session, joinedload

from app import models
from app.config import settings
from app.exceptions import DuplicateModuleCompletionError, PrerequisiteNotMetError


def _passed_module_ids(db: Session, student: models.Student) -> set:
    rows = (
        db.query(models.Enrolment.module_id)
        .filter(models.Enrolment.student_id == student.id, models.Enrolment.status == "completed")
        .all()
    )
    return {r[0] for r in rows}


def check_prerequisites_met(db: Session, student: models.Student, module: models.Module) -> List[str]:
    if not module.prerequisites:
        return []
    passed_ids = _passed_module_ids(db, student)
    return [p.code for p in module.prerequisites if p.id not in passed_ids]


def _save_completion(db, student, module, semester, grade) -> models.Enrolment:
    existing = (
        db.query(models.Enrolment)
        .filter(models.Enrolment.student_id == student.id, models.Enrolment.module_id == module.id)
        .order_by(models.Enrolment.attempt.desc())
        .first()
    )
    if existing and existing.status == "completed":
        raise DuplicateModuleCompletionError(module.code)

    status = "completed" if grade >= settings.pass_mark else "failed"
    next_attempt = (existing.attempt + 1) if existing else 1

    enrolment = models.Enrolment(
        student_id=student.id, module_id=module.id, semester=semester,
        grade=grade, status=status, attempt=next_attempt,
    )
    db.add(enrolment)
    db.commit()
    db.refresh(enrolment)
    return enrolment


def record_module_completion(db, student, module_code, semester, grade) -> models.Enrolment:
    """Self-service path (student-facing) - enforces prerequisites."""
    module = db.query(models.Module).filter(models.Module.code == module_code).first()
    if module is None:
        raise ValueError(f"No module with code '{module_code}'")
    missing = check_prerequisites_met(db, student, module)
    if missing:
        raise PrerequisiteNotMetError(module_code, missing)
    return _save_completion(db, student, module, semester, grade)


def record_official_completion(db, student, module_code, semester, grade) -> models.Enrolment:
    """Admin path - official record entry, doesn't block on unmet prerequisites."""
    module = db.query(models.Module).filter(models.Module.code == module_code).first()
    if module is None:
        raise ValueError(f"No module with code '{module_code}'")
    return _save_completion(db, student, module, semester, grade)


def _relevant_prerequisite_ids(db: Session, student: models.Student) -> set:
    """Direct prerequisites of any compulsory module in the student's programme."""
    compulsory = (
        db.query(models.ProgrammeModule)
        .options(joinedload(models.ProgrammeModule.module).joinedload(models.Module.prerequisites))
        .filter(
            models.ProgrammeModule.programme_id == student.programme_id,
            models.ProgrammeModule.is_compulsory.is_(True),
        )
        .all()
    )
    relevant = set()
    for link in compulsory:
        for prereq in link.module.prerequisites:
            relevant.add(prereq.id)
    return relevant


def build_progress_summary(db: Session, student: models.Student) -> dict:
    programme = student.programme

    completed_enrolments = (
        db.query(models.Enrolment)
        .options(joinedload(models.Enrolment.module))
        .filter(models.Enrolment.student_id == student.id, models.Enrolment.status == "completed")
        .all()
    )
    passed_module_ids = {e.module_id for e in completed_enrolments}

    all_failed = (
        db.query(models.Enrolment)
        .options(joinedload(models.Enrolment.module))
        .filter(models.Enrolment.student_id == student.id, models.Enrolment.status == "failed")
        .order_by(models.Enrolment.id.desc())
        .all()
    )
    seen_modules = set()
    pending_failed = []
    for e in all_failed:
        if e.module_id in passed_module_ids or e.module_id in seen_modules:
            continue
        seen_modules.add(e.module_id)
        pending_failed.append(e)

    relevant_prereq_ids = _relevant_prerequisite_ids(db, student)
    failed_modules = [
        {
            "module": e.module,
            "semester": e.semester,
            "grade": e.grade,
            "attempt": e.attempt,
            "is_prerequisite_for_major": e.module_id in relevant_prereq_ids,
        }
        for e in pending_failed
    ]

    credits_completed = sum(e.module.credits for e in completed_enrolments)
    credits_required = programme.total_credits_required
    credits_remaining = max(credits_required - credits_completed, 0)
    percentage = round((credits_completed / credits_required) * 100, 1) if credits_required else 0.0

    graded = [e for e in completed_enrolments if e.grade is not None]
    weighted_average = (
        round(sum(e.grade * e.module.credits for e in graded) / sum(e.module.credits for e in graded), 2)
        if graded else None
    )

    category_breakdown: dict = defaultdict(lambda: {"credits_completed": 0, "modules_completed": 0})
    for e in completed_enrolments:
        cat = e.module.category
        category_breakdown[cat]["credits_completed"] += e.module.credits
        category_breakdown[cat]["modules_completed"] += 1

    compulsory_links = (
        db.query(models.ProgrammeModule)
        .options(joinedload(models.ProgrammeModule.module))
        .filter(
            models.ProgrammeModule.programme_id == programme.id,
            models.ProgrammeModule.is_compulsory.is_(True),
        )
        .all()
    )
    missing_compulsory = [link.module for link in compulsory_links if link.module_id not in passed_module_ids]
    missing_compulsory.sort(key=lambda m: (m.level, m.code))

    return {
        "programme": programme,
        "current_year": student.current_year,
        "credits_completed": credits_completed,
        "credits_required": credits_required,
        "credits_remaining": credits_remaining,
        "percentage_complete": percentage,
        "weighted_average": weighted_average,
        "modules_completed": len(completed_enrolments),
        "modules_failed_pending_retake": len(pending_failed),
        "category_breakdown": dict(category_breakdown),
        "missing_compulsory_modules": missing_compulsory,
        "failed_modules": failed_modules,
    }


def build_graduation_audit(db: Session, student: models.Student) -> dict:
    """Enhanced graduation audit with detailed breakdowns."""
    summary = build_progress_summary(db, student)
    
    # Get all programme modules
    programme_modules = db.query(models.ProgrammeModule).filter(
        models.ProgrammeModule.programme_id == student.programme_id
    ).options(joinedload(models.ProgrammeModule.module)).all()
    
    # Get completed module IDs
    completed_enrolments = db.query(models.Enrolment).filter(
        models.Enrolment.student_id == student.id,
        models.Enrolment.status == "completed"
    ).all()
    completed_ids = {e.module_id for e in completed_enrolments}
    
    # Categorize requirements
    compulsory_modules = []
    elective_modules = []
    completed_compulsory = []
    completed_elective = []
    missing_compulsory = []
    missing_elective = []
    
    for link in programme_modules:
        module = link.module
        is_compulsory = link.is_compulsory
        
        if is_compulsory:
            compulsory_modules.append(module)
            if module.id in completed_ids:
                completed_compulsory.append(module)
            else:
                missing_compulsory.append(module)
        else:
            elective_modules.append(module)
            if module.id in completed_ids:
                completed_elective.append(module)
            else:
                missing_elective.append(module)
    
    # Calculate credits by level
    credits_by_level = {}
    for link in programme_modules:
        level = link.module.level
        if level not in credits_by_level:
            credits_by_level[level] = {"total": 0, "completed": 0}
        credits_by_level[level]["total"] += link.module.credits
        if link.module.id in completed_ids:
            credits_by_level[level]["completed"] += link.module.credits
    
    # Calculate credits by category
    credits_by_category = {}
    for link in programme_modules:
        cat = link.module.category
        if cat not in credits_by_category:
            credits_by_category[cat] = {"total": 0, "completed": 0}
        credits_by_category[cat]["total"] += link.module.credits
        if link.module.id in completed_ids:
            credits_by_category[cat]["completed"] += link.module.credits
    
    # Calculate percentages
    compulsory_percentage = round((len(completed_compulsory) / len(compulsory_modules)) * 100, 1) if compulsory_modules else 0
    elective_percentage = round((len(completed_elective) / len(elective_modules)) * 100, 1) if elective_modules else 0
    
    # Determine if on track for graduation
    on_track = True
    reasons = []
    urgent_items = []
    
    # Check missing compulsory modules
    if missing_compulsory:
        on_track = False
        reasons.append(f"Missing {len(missing_compulsory)} compulsory module(s)")
        urgent_items.extend([m.code for m in missing_compulsory[:5]])
    
    # Check failed modules blocking major
    failed_blocking = [f for f in summary["failed_modules"] if f["is_prerequisite_for_major"]]
    if failed_blocking:
        on_track = False
        reasons.append(f"{len(failed_blocking)} failed module(s) blocking your major")
        urgent_items.extend([f["module"].code for f in failed_blocking])
    
    # Check GPA
    if summary["weighted_average"] is not None and summary["weighted_average"] < student.target_average:
        on_track = False
        reasons.append(f"Current weighted average ({summary['weighted_average']}) below target ({student.target_average})")
    
    # Check if there are any in-progress modules
    in_progress = db.query(models.Enrolment).filter(
        models.Enrolment.student_id == student.id,
        models.Enrolment.status == "in-progress"
    ).all()
    
    # Check if any prerequisites are missing for upcoming modules
    prerequisite_warnings = []
    for module in missing_compulsory + missing_elective:
        for prereq in module.prerequisites:
            if prereq.id not in completed_ids:
                prerequisite_warnings.append({
                    "module": module.code,
                    "missing_prereq": prereq.code
                })
    
    # Build detailed requirements breakdown
    requirements_breakdown = {
        "compulsory": {
            "completed": len(completed_compulsory),
            "total": len(compulsory_modules),
            "percentage": compulsory_percentage,
            "completed_modules": [{"code": m.code, "name": m.name} for m in completed_compulsory],
            "missing_modules": [{"code": m.code, "name": m.name} for m in missing_compulsory],
        },
        "elective": {
            "completed": len(completed_elective),
            "total": len(elective_modules),
            "percentage": elective_percentage,
            "completed_modules": [{"code": m.code, "name": m.name} for m in completed_elective],
            "missing_modules": [{"code": m.code, "name": m.name} for m in missing_elective],
        },
        "by_level": credits_by_level,
        "by_category": credits_by_category,
    }
    
    # Calculate remaining semesters
    avg_credits_per_semester = None
    projected_semesters_remaining = None
    
    distinct_semesters = db.query(models.Enrolment.semester).filter(
        models.Enrolment.student_id == student.id,
        models.Enrolment.status == "completed"
    ).distinct().count()
    
    if distinct_semesters > 0:
        avg_credits_per_semester = round(summary["credits_completed"] / distinct_semesters, 1)
        remaining_credits = summary["credits_remaining"]
        if avg_credits_per_semester > 0:
            projected_semesters_remaining = max(0, round(remaining_credits / avg_credits_per_semester))
    
    return {
        "on_track": on_track,
        "reasons": reasons,
        "urgent_items": urgent_items,
        "projected_semesters_remaining": projected_semesters_remaining,
        "average_credits_per_semester": avg_credits_per_semester,
        "requirements_breakdown": requirements_breakdown,
        "prerequisite_warnings": prerequisite_warnings,
        "in_progress_modules": len(in_progress),
        "summary": summary,
    }


def get_eligible_modules(db: Session, student: models.Student) -> List[dict]:
    passed_ids = _passed_module_ids(db, student)
    programme_module_ids = {
        link.module_id
        for link in db.query(models.ProgrammeModule).filter(
            models.ProgrammeModule.programme_id == student.programme_id
        )
    }
    candidates = (
        db.query(models.Module)
        .filter(models.Module.id.in_(programme_module_ids))
        .filter(models.Module.id.notin_(passed_ids) if passed_ids else True)
        .all()
    )
    eligible = []
    for module in candidates:
        missing = [p.code for p in module.prerequisites if p.id not in passed_ids]
        if not missing:
            reason = "Prerequisites satisfied" if module.prerequisites else "No prerequisites required"
            eligible.append({"module": module, "reason": reason})
    eligible.sort(key=lambda item: (item["module"].level, item["module"].code))
    return eligible


# ---------- Peer Comparison ----------

def get_peer_comparison(db: Session, student: models.Student) -> dict:
    """Calculate anonymized peer comparison statistics for a student."""
    peers = db.query(models.Student).filter(
        models.Student.programme_id == student.programme_id,
        models.Student.current_year == student.current_year,
        models.Student.is_active == True,
        models.Student.id != student.id
    ).all()
    
    if not peers:
        return {
            "stats": {
                "programme_code": student.programme.code,
                "programme_name": student.programme.name,
                "year": student.current_year,
                "total_students": 1,
                "your_rank": 1,
                "percentile": 100,
                "your_average": None,
                "cohort_average": None,
                "max_average": None,
                "min_average": None,
                "distribution": [],
            },
            "message": "No other students in your cohort yet. Check back later!"
        }
    
    peer_averages = []
    for p in peers:
        summary = build_progress_summary(db, p)
        avg = summary.get("weighted_average")
        if avg is not None:
            peer_averages.append(avg)
    
    own_summary = build_progress_summary(db, student)
    own_avg = own_summary.get("weighted_average")
    
    if not peer_averages:
        return {
            "stats": {
                "programme_code": student.programme.code,
                "programme_name": student.programme.name,
                "year": student.current_year,
                "total_students": 1,
                "your_rank": 1,
                "percentile": 100,
                "your_average": own_avg,
                "cohort_average": None,
                "max_average": None,
                "min_average": None,
                "distribution": [],
            },
            "message": "Your peers have not completed enough modules yet."
        }
    
    peer_averages.sort()
    total_peers = len(peer_averages)
    
    if own_avg is None:
        rank = total_peers + 1
    else:
        higher = sum(1 for avg in peer_averages if avg > own_avg)
        rank = higher + 1
    
    percentile = 100 - ((higher / total_peers) * 100) if total_peers > 0 else 100
    
    cohort_avg = sum(peer_averages) / total_peers if total_peers > 0 else None
    max_avg = max(peer_averages) if peer_averages else None
    min_avg = min(peer_averages) if peer_averages else None
    
    bins = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
    all_averages = peer_averages.copy()
    if own_avg is not None:
        all_averages.append(own_avg)
    
    distribution = []
    for i in range(len(bins) - 1):
        low = bins[i]
        high = bins[i+1]
        if low == 90:
            count = sum(1 for avg in all_averages if avg >= 90)
        else:
            count = sum(1 for avg in all_averages if low <= avg < high)
        distribution.append({
            "range": f"{low}-{high}%" if low < 90 else "90-100%",
            "count": count
        })
    
    return {
        "stats": {
            "programme_code": student.programme.code,
            "programme_name": student.programme.name,
            "year": student.current_year,
            "total_students": total_peers + 1,
            "your_rank": rank,
            "percentile": round(percentile, 1),
            "your_average": own_avg,
            "cohort_average": round(cohort_avg, 1) if cohort_avg is not None else None,
            "max_average": round(max_avg, 1) if max_avg is not None else None,
            "min_average": round(min_avg, 1) if min_avg is not None else None,
            "distribution": distribution,
        },
        "message": "Here's how you compare to your peers." if own_avg is not None else "Complete more modules to see your comparison."
    }


# ---------- Achievements ----------

ACHIEVEMENT_DEFINITIONS = {
    "first_steps": {
        "id": "first_steps",
        "title": "First Steps",
        "description": "Complete your first module",
        "icon": "🌱",
        "category": "milestone",
    },
    "year_1_complete": {
        "id": "year_1_complete",
        "title": "Year 1 Complete",
        "description": "Complete all first-year modules",
        "icon": "📚",
        "category": "milestone",
    },
    "year_2_complete": {
        "id": "year_2_complete",
        "title": "Year 2 Complete",
        "description": "Complete all second-year modules",
        "icon": "📚",
        "category": "milestone",
    },
    "year_3_complete": {
        "id": "year_3_complete",
        "title": "Year 3 Complete",
        "description": "Complete all third-year modules",
        "icon": "📚",
        "category": "milestone",
    },
    "all_compulsory_complete": {
        "id": "all_compulsory_complete",
        "title": "Compulsory Conqueror",
        "description": "Complete all compulsory modules",
        "icon": "🎯",
        "category": "academic",
    },
    "halfway_there": {
        "id": "halfway_there",
        "title": "Halfway There!",
        "description": "Complete 50% of your degree credits",
        "icon": "🏔️",
        "category": "milestone",
    },
    "credit_king": {
        "id": "credit_king",
        "title": "Credit King",
        "description": "Complete 75% of your degree credits",
        "icon": "👑",
        "category": "milestone",
    },
    "gpa_70": {
        "id": "gpa_70",
        "title": "Academic Excellence",
        "description": "Achieve a weighted average of 70% or higher",
        "icon": "⭐",
        "category": "excellence",
    },
    "gpa_75": {
        "id": "gpa_75",
        "title": "Top Achiever",
        "description": "Achieve a weighted average of 75% or higher",
        "icon": "🌟",
        "category": "excellence",
    },
    "gpa_80": {
        "id": "gpa_80",
        "title": "Academic Elite",
        "description": "Achieve a weighted average of 80% or higher",
        "icon": "🏅",
        "category": "excellence",
    },
    "perfect_semester": {
        "id": "perfect_semester",
        "title": "Perfect Semester",
        "description": "Pass all modules in a single semester",
        "icon": "💯",
        "category": "academic",
    },
    "retake_success": {
        "id": "retake_success",
        "title": "Comeback King",
        "description": "Pass a module you previously failed",
        "icon": "🔄",
        "category": "perseverance",
    },
    "elective_explorer": {
        "id": "elective_explorer",
        "title": "Elective Explorer",
        "description": "Complete at least 2 elective modules",
        "icon": "🧭",
        "category": "academic",
    },
    "module_master": {
        "id": "module_master",
        "title": "Module Master",
        "description": "Complete 10 modules",
        "icon": "🎓",
        "category": "milestone",
    },
    "all_clear": {
        "id": "all_clear",
        "title": "No Failures",
        "description": "Complete all taken modules without any failures",
        "icon": "✨",
        "category": "excellence",
    },
}


def _get_completed_levels(db: Session, student: models.Student) -> dict:
    """Get completion status by level."""
    programme_modules = db.query(models.ProgrammeModule).filter(
        models.ProgrammeModule.programme_id == student.programme_id
    ).options(joinedload(models.ProgrammeModule.module)).all()
    
    completed_ids = set(e.module_id for e in db.query(models.Enrolment).filter(
        models.Enrolment.student_id == student.id,
        models.Enrolment.status == "completed"
    ).all())
    
    level_counts = {}
    for link in programme_modules:
        level = link.module.level
        if level not in level_counts:
            level_counts[level] = {"total": 0, "completed": 0}
        level_counts[level]["total"] += 1
        if link.module.id in completed_ids:
            level_counts[level]["completed"] += 1
    
    return level_counts


def _get_all_pass_count(db: Session, student: models.Student) -> bool:
    """Check if student has no failures."""
    failed = db.query(models.Enrolment).filter(
        models.Enrolment.student_id == student.id,
        models.Enrolment.status == "failed"
    ).first()
    return failed is None


def calculate_achievements(db: Session, student: models.Student) -> set:
    """Calculate all achievements for a student."""
    summary = build_progress_summary(db, student)
    completed_ids = set(e.module_id for e in db.query(models.Enrolment).filter(
        models.Enrolment.student_id == student.id,
        models.Enrolment.status == "completed"
    ).all())
    
    programme_modules = db.query(models.ProgrammeModule).filter(
        models.ProgrammeModule.programme_id == student.programme_id
    ).options(joinedload(models.ProgrammeModule.module)).all()
    
    total_modules = len(programme_modules)
    total_compulsory = len([pm for pm in programme_modules if pm.is_compulsory])
    completed_compulsory = len([pm for pm in programme_modules if pm.is_compulsory and pm.module.id in completed_ids])
    completed_elective = len([pm for pm in programme_modules if not pm.is_compulsory and pm.module.id in completed_ids])
    total_elective = len([pm for pm in programme_modules if not pm.is_compulsory])
    
    credits_completed = summary["credits_completed"]
    credits_required = summary["credits_required"]
    
    enrolments = db.query(models.Enrolment).filter(
        models.Enrolment.student_id == student.id
    ).all()
    
    failed_module_ids = set()
    passed_module_ids = set()
    for e in enrolments:
        if e.status == "failed":
            failed_module_ids.add(e.module_id)
        elif e.status == "completed":
            passed_module_ids.add(e.module_id)
    
    retake_success = len(failed_module_ids.intersection(passed_module_ids)) > 0
    
    semester_modules = {}
    for e in enrolments:
        if e.semester not in semester_modules:
            semester_modules[e.semester] = []
        semester_modules[e.semester].append(e)
    
    perfect_semester = False
    for semester, modules in semester_modules.items():
        if all(m.status == "completed" for m in modules):
            perfect_semester = True
            break
    
    level_counts = _get_completed_levels(db, student)
    
    achievements = []
    
    if total_modules > 0 and len(completed_ids) >= 1:
        achievements.append("first_steps")
    
    if len(completed_ids) >= 10:
        achievements.append("module_master")
    
    if credits_completed >= credits_required * 0.5:
        achievements.append("halfway_there")
    
    if credits_completed >= credits_required * 0.75:
        achievements.append("credit_king")
    
    if total_compulsory > 0 and completed_compulsory == total_compulsory:
        achievements.append("all_compulsory_complete")
    
    if completed_elective >= 2:
        achievements.append("elective_explorer")
    
    if level_counts.get(1, {}).get("total", 0) > 0 and level_counts.get(1, {}).get("completed", 0) == level_counts.get(1, {}).get("total", 0):
        achievements.append("year_1_complete")
    
    if level_counts.get(2, {}).get("total", 0) > 0 and level_counts.get(2, {}).get("completed", 0) == level_counts.get(2, {}).get("total", 0):
        achievements.append("year_2_complete")
    
    if level_counts.get(3, {}).get("total", 0) > 0 and level_counts.get(3, {}).get("completed", 0) == level_counts.get(3, {}).get("total", 0):
        achievements.append("year_3_complete")
    
    if summary["weighted_average"] is not None:
        if summary["weighted_average"] >= 70:
            achievements.append("gpa_70")
        if summary["weighted_average"] >= 75:
            achievements.append("gpa_75")
        if summary["weighted_average"] >= 80:
            achievements.append("gpa_80")
    
    if retake_success:
        achievements.append("retake_success")
    
    if perfect_semester:
        achievements.append("perfect_semester")
    
    if _get_all_pass_count(db, student) and len(completed_ids) > 0:
        achievements.append("all_clear")
    
    return set(achievements)


def get_achievement_summary(db: Session, student: models.Student) -> dict:
    """Get a summary of achievements for a student."""
    unlocked_ids = calculate_achievements(db, student)
    
    achievements = []
    for key, defn in ACHIEVEMENT_DEFINITIONS.items():
        unlocked = key in unlocked_ids
        achievements.append({
            "id": defn["id"],
            "title": defn["title"],
            "description": defn["description"],
            "icon": defn["icon"],
            "category": defn["category"],
            "unlocked": unlocked,
            "unlocked_at": datetime.now() if unlocked else None,
            "progress": 100 if unlocked else None,
            "progress_label": None,
        })
    
    unlocked = [a for a in achievements if a["unlocked"]]
    locked = [a for a in achievements if not a["unlocked"]]
    
    total = len(achievements)
    unlocked_count = len(unlocked)
    
    return {
        "total_achievements": total,
        "unlocked_achievements": unlocked_count,
        "completion_percentage": round((unlocked_count / total) * 100, 1) if total > 0 else 0,
        "achievements": unlocked + locked,
        "recent_unlocks": unlocked[-5:],
        "next_milestones": locked[:5],
    }

def notify_grade_released(db: Session, student: models.Student, module: models.Module, grade: float, semester: str) -> None:
    """
    Send notification when a grade is released.
    Only sends if grade is >= pass_mark (i.e., module completed).
    """
    if grade >= settings.pass_mark:
        send_grade_released_email(student, module, grade, semester)


def check_and_notify_achievements(db: Session, student: models.Student) -> None:
    """
    Calculate current achievements, compare with stored ones,
    send notifications for newly unlocked achievements, and update storage.
    """
    # Get currently unlocked achievement IDs
    current_achievements = calculate_achievements(db, student)  # returns a set of achievement IDs

    # Get already stored achievements for this student
    stored = db.query(StudentAchievement).filter(
        StudentAchievement.student_id == student.id
    ).all()
    stored_ids = {sa.achievement_id for sa in stored}

    # Find newly unlocked achievements
    newly_unlocked = current_achievements - stored_ids

    if not newly_unlocked:
        return

    # For each new achievement, send email and store record
    for ach_id in newly_unlocked:
        ach_def = ACHIEVEMENT_DEFINITIONS.get(ach_id)
        if ach_def:
            # Send email
            send_achievement_unlocked_email(student, ach_def)

            # Store the achievement
            db.add(StudentAchievement(
                student_id=student.id,
                achievement_id=ach_id,
                unlocked_at=datetime.utcnow(),
                notified=True,
            ))

    db.commit()