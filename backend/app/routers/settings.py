from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import get_db
from app.models.app_settings import AppSettings
from app.models.user import User
from app.schemas.app_settings import AppSettingsOut, AppSettingsUpdate
from app.deps import require_role

router = APIRouter()


@router.get("/settings/", response_model=AppSettingsOut)
async def get_settings(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AppSettings).where(AppSettings.id == 1))
    return result.scalar_one()


@router.patch("/settings/", response_model=AppSettingsOut)
async def update_settings(
    update: AppSettingsUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin")),
):
    result = await db.execute(select(AppSettings).where(AppSettings.id == 1))
    settings = result.scalar_one()
    settings.registration_enabled = update.registration_enabled
    await db.commit()
    await db.refresh(settings)
    return settings