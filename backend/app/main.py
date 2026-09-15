# app/main.py
import logging
import time

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.routers import admin, admin_management, auth, email, modules, planning, programmes, progress, students
from app.config import settings
from app.database import Base, engine
from app.rate_limit import limiter
from app.routers import admin, admin_management, auth, modules, planning, programmes, progress, students

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("credit_tracker")

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Graduation Credit Tracker API",
    version="2.0.0",
    description="Admin-managed academic records with passwordless student login.",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    duration_ms = round((time.perf_counter() - start) * 1000, 1)
    logger.info("%s %s -> %s (%sms)", request.method, request.url.path, response.status_code, duration_ms)
    return response


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An unexpected error occurred. Please try again."},
    )


app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(admin_management.router)
app.include_router(students.router)
app.include_router(modules.router)
app.include_router(programmes.router)
app.include_router(progress.router)
app.include_router(planning.router)
app.include_router(email.router)


@app.get("/")
def root():
    return {"message": "Graduation Credit Tracker API is running", "docs": "/docs"}


@app.get("/health")
def health_check():
    return {"status": "ok"}