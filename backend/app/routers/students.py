# app/routers/students.py
from fastapi import APIRouter, Depends

from app import models, schemas
from app.dependencies import get_current_student

router = APIRouter(prefix="/students", tags=["Students"])


@router.get("/me", response_model=schemas.StudentOut)
def get_my_profile(current_student: models.Student = Depends(get_current_student)):
    return current_student