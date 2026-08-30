import shutil
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db, engine, Base
from app.routers import auth, cards, sharing, presets, users, settings

from app.models.user import User  # noqa: F401
from app.models.role import Role  # noqa: F401
from app.models.card import Card  # noqa: F401
from app.models.card_access import CardAccess  # noqa: F401
from app.models.barcode_type import BarcodeType  # noqa: F401
from app.models.company_preset import CompanyPreset  # noqa: F401
from app.models.app_settings import AppSettings  # noqa: F401


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(lifespan=lifespan)


@app.get("/health", tags=["health"])
async def health_check(db: AsyncSession = Depends(get_db)):
    health_status = {
        "status": "healthy",
        "database": "unknown",
        "disk_space": "unknown",
    }
    is_healthy = True

    try:
        await db.execute(text("SELECT 1"))
        health_status["database"] = "connected"
    except Exception as exc:
        health_status["database"] = f"unhealthy: {str(exc)}"
        is_healthy = False

    try:
        _, _, free = shutil.disk_usage("/")
        free_mb = free // (1024 * 1024)
        if free_mb < 500:
            health_status["disk_space"] = f"low ({free_mb}MB free)"
            is_healthy = False
        else:
            health_status["disk_space"] = f"ok ({free_mb}MB free)"
    except Exception as exc:
        health_status["disk_space"] = f"check failed: {str(exc)}"

    if not is_healthy:
        health_status["status"] = "unhealthy"
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content=health_status,
        )

    return health_status


app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(users.router, tags=["users"])
app.include_router(settings.router, tags=["settings"])
app.include_router(cards.router, tags=["cards"])
app.include_router(sharing.router, tags=["sharing"])
app.include_router(presets.router, tags=["presets"])