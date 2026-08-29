from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload
from app.database import get_db
from app.models.card import Card
from app.models.card_access import CardAccess
from app.models.user import User
from app.schemas.card import CardCreate, CardUpdate, CardOut
from app.schemas.card_access import ShareRequest, CardAccessOut
from app.deps import get_current_user
from app.services.card_access import require_card_access, AccessLevel

router = APIRouter()

@router.post("/cards/", response_model=CardOut)
async def create_card(card: CardCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_card = Card(**card.model_dump(), created_by=current_user.id)
    db.add(db_card)
    await db.flush()  

    db_access = CardAccess(
        card_id=db_card.id,
        user_id=current_user.id,
        access_level=AccessLevel.owner.name
    )
    db.add(db_access)
    await db.commit()
    await db.refresh(db_card)
    return db_card

@router.get("/cards/", response_model=list[CardOut])
async def get_cards(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = select(Card).join(CardAccess).where(CardAccess.user_id == current_user.id)
    result = await db.execute(query)
    cards = result.scalars().all()
    return cards

@router.get("/cards/{card_id}", response_model=CardOut)
async def get_card(card_id: int, db: AsyncSession = Depends(get_db), access: CardAccess = Depends(require_card_access(AccessLevel.viewer.name))):
    query = select(Card).where(Card.id == card_id)
    result = await db.execute(query)
    card = result.scalar_one_or_none()
    if not card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Card not found")
    return card

@router.put("/cards/{card_id}", response_model=CardOut)
async def update_card(card_id: int, card: CardUpdate, db: AsyncSession = Depends(get_db), access: CardAccess = Depends(require_card_access(AccessLevel.editor.name))):
    query = select(Card).where(Card.id == card_id)
    result = await db.execute(query)
    db_card = result.scalar_one_or_none()
    if not db_card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Card not found")
    for key, value in card.model_dump(exclude_unset=True).items():
        setattr(db_card, key, value)
    await db.commit()
    await db.refresh(db_card)
    return db_card

@router.delete("/cards/{card_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_card(card_id: int, db: AsyncSession = Depends(get_db), access: CardAccess = Depends(require_card_access(AccessLevel.owner.name))):
    query = select(Card).where(Card.id == card_id)
    result = await db.execute(query)
    db_card = result.scalar_one_or_none()
    if not db_card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Card not found")
    await db.delete(db_card)
    await db.commit()