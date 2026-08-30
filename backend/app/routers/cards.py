from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.card import Card
from app.models.card_access import CardAccess
from app.models.preset import CompanyPreset
from app.models.user import User
from app.schemas.card import CardCreate, CardUpdate, CardOut, SharedCardOut
from app.schemas.card_access import CardAccessWithUserOut
from app.deps import get_current_user
from app.services.card_access import require_card_access, AccessLevel
from app.services.barcode_validation import resolve_barcode_type, validate_card_code

router = APIRouter()


@router.post("/cards/", response_model=CardOut)
async def create_card(
    card: CardCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if card.company_preset_id is not None:
        preset_res = await db.execute(
            select(CompanyPreset).where(CompanyPreset.id == card.company_preset_id)
        )
        preset = preset_res.scalar_one_or_none()
        if not preset:
            raise HTTPException(status_code=400, detail="Invalid company preset")

        barcode_type = await resolve_barcode_type(db, None, card.company_preset_id)
        validate_card_code(barcode_type, card.code)

        db_card = Card(
            card_name=card.card_name,
            code=card.code,
            company_preset_id=card.company_preset_id,
            color_scheme=None,
            barcode_type_id=None,
            created_by=current_user.id,
        )
    else:
        if not card.barcode_type_id:
            raise HTTPException(status_code=400, detail="Barcode type is required for custom cards")
        if not card.color_scheme:
            raise HTTPException(status_code=400, detail="Color scheme is required for custom cards")

        barcode_type = await resolve_barcode_type(db, card.barcode_type_id, None)
        validate_card_code(barcode_type, card.code)

        db_card = Card(
            card_name=card.card_name,
            code=card.code,
            company_preset_id=None,
            color_scheme=card.color_scheme,
            barcode_type_id=card.barcode_type_id,
            created_by=current_user.id,
        )

    db.add(db_card)
    await db.flush()

    db_access = CardAccess(
        card_id=db_card.id,
        user_id=current_user.id,
        access_level=AccessLevel.owner.name,
    )
    db.add(db_access)
    await db.commit()

    result = await db.execute(
        select(Card)
        .options(selectinload(Card.company_preset))
        .where(Card.id == db_card.id)
    )
    return result.scalar_one()


@router.get("/cards/mine", response_model=list[CardOut])
async def get_my_cards(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        select(Card)
        .options(selectinload(Card.company_preset))
        .join(CardAccess, CardAccess.card_id == Card.id)
        .where(
            CardAccess.user_id == current_user.id,
            CardAccess.access_level == AccessLevel.owner.name,
        )
    )
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/cards/shared", response_model=list[SharedCardOut])
async def get_shared_cards(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        select(Card, CardAccess.access_level, CardAccess.shared_at, CardAccess.shared_by)
        .options(selectinload(Card.company_preset))
        .join(CardAccess, CardAccess.card_id == Card.id)
        .where(
            CardAccess.user_id == current_user.id,
            CardAccess.access_level != AccessLevel.owner.name,
        )
    )
    result = await db.execute(query)
    rows = result.all()

    shared_cards = []
    for card, access_level, shared_at, shared_by_id in rows:
        shared_by_username = None
        if shared_by_id is not None:
            sharer_result = await db.execute(select(User.username).where(User.id == shared_by_id))
            shared_by_username = sharer_result.scalar_one_or_none()

        effective_color = card.company_preset.color_scheme if card.company_preset else card.color_scheme
        effective_barcode_type_id = card.company_preset.barcode_type_id if card.company_preset else card.barcode_type_id

        shared_cards.append(
            SharedCardOut(
                id=card.id,
                created_by=card.created_by,
                card_name=card.card_name,
                code=card.code,
                barcode_type_id=effective_barcode_type_id,
                company_preset_id=card.company_preset_id,
                color_scheme=effective_color,
                added_at=card.added_at,
                access_level=access_level,
                shared_by_username=shared_by_username,
                shared_at=shared_at,
            )
        )
    return shared_cards


@router.get("/cards/{card_id}", response_model=CardOut)
async def get_card(
    card_id: int,
    db: AsyncSession = Depends(get_db),
    access: CardAccess = Depends(require_card_access(AccessLevel.viewer)),
):
    query = (
        select(Card)
        .options(selectinload(Card.company_preset))
        .where(Card.id == card_id)
    )
    result = await db.execute(query)
    card = result.scalar_one_or_none()
    if not card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Card not found")
    return card


@router.put("/cards/{card_id}", response_model=CardOut)
async def update_card(
    card_id: int,
    card: CardUpdate,
    db: AsyncSession = Depends(get_db),
    access: CardAccess = Depends(require_card_access(AccessLevel.editor)),
):
    query = (
        select(Card)
        .options(selectinload(Card.company_preset))
        .where(Card.id == card_id)
    )
    result = await db.execute(query)
    db_card = result.scalar_one_or_none()
    if not db_card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Card not found")

    update_data = card.model_dump(exclude_unset=True)

    target_preset_id = update_data.get("company_preset_id", db_card.company_preset_id)
    target_code = update_data.get("code", db_card.code)
    target_barcode_type_id = update_data.get("barcode_type_id", db_card.barcode_type_id)
    target_color = update_data.get("color_scheme", db_card.color_scheme)

    if target_preset_id is not None:
        barcode_type = await resolve_barcode_type(db, None, target_preset_id)
        validate_card_code(barcode_type, target_code)

        db_card.company_preset_id = target_preset_id
        db_card.barcode_type_id = None
        db_card.color_scheme = None
    else:
        if not target_barcode_type_id:
            raise HTTPException(status_code=400, detail="Barcode type is required for custom cards")
        if not target_color:
            raise HTTPException(status_code=400, detail="Color scheme is required for custom cards")

        barcode_type = await resolve_barcode_type(db, target_barcode_type_id, None)
        validate_card_code(barcode_type, target_code)

        db_card.company_preset_id = None
        db_card.barcode_type_id = target_barcode_type_id
        db_card.color_scheme = target_color

    if "card_name" in update_data:
        db_card.card_name = update_data["card_name"]
    if "code" in update_data:
        db_card.code = update_data["code"]

    await db.commit()

    refreshed = await db.execute(
        select(Card)
        .options(selectinload(Card.company_preset))
        .where(Card.id == card_id)
    )
    return refreshed.scalar_one()


@router.delete("/cards/{card_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_card(
    card_id: int,
    db: AsyncSession = Depends(get_db),
    access: CardAccess = Depends(require_card_access(AccessLevel.owner)),
):
    query = select(Card).where(Card.id == card_id)
    result = await db.execute(query)
    db_card = result.scalar_one_or_none()
    if not db_card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Card not found")
    await db.delete(db_card)
    await db.commit()


@router.get("/cards/{card_id}/access", response_model=list[CardAccessWithUserOut])
async def list_card_access(
    card_id: int,
    db: AsyncSession = Depends(get_db),
    access: CardAccess = Depends(require_card_access(AccessLevel.owner)),
):
    query = (
        select(CardAccess, User.username)
        .join(User, User.id == CardAccess.user_id)
        .where(CardAccess.card_id == card_id)
    )
    result = await db.execute(query)
    rows = result.all()
    return [
        {
            "card_id": ca.card_id,
            "user_id": ca.user_id,
            "username": username,
            "access_level": ca.access_level,
        }
        for ca, username in rows
    ]