# app/main.py

import logging
import time

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.database import Base, engine
from app.rate_limit import limiter
from app.routers import (
    admin,
    admin_management,
    assistant,
    auth,
    community,
    email,
    facilitators,
    modules,
    planning,
    programmes,
    progress,
    students,
    support_services,
    
)


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
)

logger = logging.getLogger("credit_tracker")


# Create database tables
Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="Graduation Credit Tracker API",
    version="2.0.0",
    description="Admin-managed academic records with student login and AI assistance.",
)


# ---------------------------------------------------------
# Rate limiting
# ---------------------------------------------------------

app.state.limiter = limiter

app.add_exception_handler(
    RateLimitExceeded,
    _rate_limit_exceeded_handler,
)


# ---------------------------------------------------------
# CORS
# ---------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------
# Request logging
# ---------------------------------------------------------

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.perf_counter()

    response = await call_next(request)

    duration_ms = round(
        (time.perf_counter() - start) * 1000,
        1,
    )

    logger.info(
        "%s %s -> %s (%sms)",
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
    )

    return response


# ---------------------------------------------------------
# Global error handler
# ---------------------------------------------------------

@app.exception_handler(Exception)
async def unhandled_exception_handler(
    request: Request,
    exc: Exception,
):
    logger.exception(
        "Unhandled error on %s %s",
        request.method,
        request.url.path,
    )

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "An unexpected error occurred. Please try again."
        },
    )


# ---------------------------------------------------------
# API routers
# ---------------------------------------------------------

app.include_router(auth.router)
app.include_router(community.router)
app.include_router(admin.router)
app.include_router(admin_management.router)
app.include_router(students.router)
app.include_router(modules.router)
app.include_router(programmes.router)
app.include_router(progress.router)
app.include_router(planning.router)
app.include_router(email.router)
app.include_router(assistant.router)
app.include_router(facilitators.router)
app.include_router(support_services.router)
# ---------------------------------------------------------
# Root endpoint
# ---------------------------------------------------------

@app.get("/")
def root():
    return {
        "message": "Graduation Credit Tracker API is running",
        "docs": "/docs",
        "assistant": "/assistant/chat",
    }


# ---------------------------------------------------------
# Health check
# ---------------------------------------------------------

@app.get("/health")
def health_check():
    return {
        "status": "ok",
    }

