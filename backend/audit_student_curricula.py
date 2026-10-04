"""Read-only student curriculum audit. Does not delete marks or enrolments.

Run from backend: python audit_student_curricula.py
The bundled curriculum must first be checked against the official 2026 prospectus.
Students following earlier curriculum years require a separate reference.
"""
import json
from pathlib import Path
from app import models
from app.database import SessionLocal
from seed import PROGRAMME_MODULES, ALIAS_CODES

def audit():
    # Do not infer entry year from current year or student number.
    mapping_path = Path(__file__).with_name("student_registration_years.json")
    registration_years = json.loads(mapping_path.read_text()) if mapping_path.exists() else {}
    db = SessionLocal()
    try:
        report = []
        students = db.query(models.Student).all()
        for student in students:
            programme = db.query(models.Programme).filter_by(id=student.programme_id).first()
            if programme is None:
                report.append({"student_id": student.id, "issue": "missing_programme"})
                continue
            entry_year = registration_years.get(student.student_number)
            if entry_year is None:
                report.append({"student_id": student.id, "programme": programme.code,
                               "issue": "registration_year_required", "action": "do_not_modify"})
                continue
            if str(entry_year) != "2026":
                report.append({"student_id": student.id, "programme": programme.code,
                               "registration_year": entry_year,
                               "issue": "cohort_prospectus_required", "action": "do_not_modify"})
                continue
            groups = PROGRAMME_MODULES.get(programme.code)
            if groups is None:
                report.append({"student_id": student.id, "programme": programme.code,
                               "issue": "unverified_programme"})
                continue
            reference_codes = {ALIAS_CODES.get(code, code)
                               for key in ("compulsory", "elective")
                               for code in groups.get(key, [])}
            live_codes = {link.module.code for link in
                          db.query(models.ProgrammeModule).filter_by(programme_id=programme.id)
                          if link.module}
            enrolments = db.query(models.Enrolment).filter_by(student_id=student.id).all()
            historical_codes = {row.module.code for row in enrolments if row.module}
            report.append({
                "student_id": student.id,
                "programme": programme.code,
                "registration_year": entry_year,
                "missing_reference_links": sorted(reference_codes - live_codes),
                "extra_live_links": sorted(live_codes - reference_codes),
                "enrolments_outside_reference": sorted(historical_codes - reference_codes),
                "enrolments_to_review": len([row for row in enrolments
                                              if row.module and row.module.code not in reference_codes]),
                "action": "manual_review_only",
            })
        print(json.dumps({"warning": "Bundled reference is not yet fully prospectus-certified; historical cohorts need their own reference. No database changes performed.",
                          "students_checked": len(students), "results": report}, indent=2))
    finally:
        db.close()

if __name__ == "__main__":
    audit()
