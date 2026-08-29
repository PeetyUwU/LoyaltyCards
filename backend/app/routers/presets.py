from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.database import get_db
from app.models.company_preset import CompanyPreset
from app.models.user import User
from app.schemas.preset import PresetOut
from app.deps import get_current_user

router = APIRouter()

@router.get("/presets/", response_model=list[PresetOut])
async def get_presets(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = select(CompanyPreset)
    result = await db.execute(query)
    presets = result.scalars().all()
    return presets

@router.get("/presets/{id}", response_model=PresetOut)
async def get_preset(id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = select(CompanyPreset).where(CompanyPreset.id == id)
    result = await db.execute(query)
    preset = result.scalar_one_or_none()
    if not preset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Preset not found")
    return preset