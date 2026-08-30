from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import get_db
from app.models.company_preset import CompanyPreset
from app.models.barcode_type import BarcodeType
from app.models.card import Card
from app.models.user import User
from app.schemas.preset import PresetOut, BarcodeTypeOut, PresetCreate, PresetUpdate
from app.deps import get_current_user, require_role

router = APIRouter()


@router.get("/presets/", response_model=list[PresetOut])
async def get_presets(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = select(CompanyPreset)
    result = await db.execute(query)
    presets = result.scalars().all()
    return presets

@router.post("/presets/", response_model=PresetOut, status_code=status.HTTP_201_CREATED)
async def create_preset(
    preset_in: PresetCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin")),
):
    existing = await db.execute(
        select(CompanyPreset).where(CompanyPreset.name == preset_in.name)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A preset with this name already exists",
        )

    barcode_type = await db.get(BarcodeType, preset_in.barcode_type_id)
    if not barcode_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid barcode type selected",
        )

    db_preset = CompanyPreset(**preset_in.model_dump())
    db.add(db_preset)
    await db.commit()
    await db.refresh(db_preset)
    return db_preset


@router.get("/presets/{id}", response_model=PresetOut)
async def get_preset(id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = select(CompanyPreset).where(CompanyPreset.id == id)
    result = await db.execute(query)
    preset = result.scalar_one_or_none()
    if not preset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Preset not found")
    return preset

@router.patch("/presets/{id}", response_model=PresetOut)
async def update_preset(
    id: int,
    preset_in: PresetUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin")),
):
    result = await db.execute(select(CompanyPreset).where(CompanyPreset.id == id))
    preset = result.scalar_one_or_none()
    if not preset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Preset not found",
        )

    update_data = preset_in.model_dump(exclude_unset=True)

    if "name" in update_data and update_data["name"] != preset.name:
        existing = await db.execute(
            select(CompanyPreset).where(
                CompanyPreset.id != id,
                CompanyPreset.name == update_data["name"],
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A preset with this name already exists",
            )

    if "barcode_type_id" in update_data:
        bt = await db.get(BarcodeType, update_data["barcode_type_id"])
        if not bt:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid barcode type selected",
            )

    for key, value in update_data.items():
        setattr(preset, key, value)

    await db.commit()
    await db.refresh(preset)
    return preset

@router.delete("/presets/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_preset(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin")),
):
    result = await db.execute(select(CompanyPreset).where(CompanyPreset.id == id))
    preset = result.scalar_one_or_none()
    if not preset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Preset not found")

    referencing = await db.execute(select(Card).where(Card.company_preset_id == id))
    if referencing.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete preset: cards still reference it",
        )

    await db.delete(preset)
    await db.commit()


@router.get("/barcode-types/", response_model=list[BarcodeTypeOut])
async def get_barcode_types(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = select(BarcodeType)
    result = await db.execute(query)
    barcode_types = result.scalars().all()
    return barcode_types


@router.get("/barcode-types/{id}", response_model=BarcodeTypeOut)
async def get_barcode_type(id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = select(BarcodeType).where(BarcodeType.id == id)
    result = await db.execute(query)
    barcode_type = result.scalar_one_or_none()
    if not barcode_type:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Barcode type not found")
    return barcode_type


@router.delete("/barcode-types/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_barcode_type(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin")),
):
    result = await db.execute(select(BarcodeType).where(BarcodeType.id == id))
    barcode_type = result.scalar_one_or_none()
    if not barcode_type:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Barcode type not found")

    referencing_cards = await db.execute(select(Card).where(Card.barcode_type_id == id))
    referencing_presets = await db.execute(select(CompanyPreset).where(CompanyPreset.barcode_type_id == id))
    if referencing_cards.scalars().first() or referencing_presets.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete barcode type: still referenced by cards or presets",
        )

    await db.delete(barcode_type)
    await db.commit()