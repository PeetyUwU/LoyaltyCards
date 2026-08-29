from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.database import get_db
from app.models.card import Card
from app.models.card_access import CardAccess
from app.models.user import User
from app.schemas.card import CardCreate, CardUpdate, CardOut
from app.schemas.card_access import ShareRequest, CardAccessOut
from app.deps import get_current_user
from app.services.card_access import require_card_access, AccessLevel

router = APIRouter()

@router.post("/cards/{card_id}/share", status_code=status.HTTP_204_NO_CONTENT)
async def share_card(card_id: int, share_request: ShareRequest, db: AsyncSession = Depends(get_db), access: CardAccess = Depends(require_card_access(AccessLevel.owner))):
    if share_request.user_id == access.user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot share with yourself")
    query = select(CardAccess).where(CardAccess.card_id == card_id).where(CardAccess.user_id == share_request.user_id)
    result = await db.execute(query)
    if result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User already has access to this card")
    db_access = CardAccess(
        card_id=card_id,
        user_id=share_request.user_id,
        access_level=share_request.access_level
    )
    db.add(db_access)
    await db.commit()

@router.delete("/cards/{card_id}/share/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def unshare_card(card_id: int, user_id: int, db: AsyncSession = Depends(get_db), access: CardAccess = Depends(require_card_access(AccessLevel.owner))):
    if user_id == access.user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot remove yourself as owner")
    query = select(CardAccess).where(CardAccess.card_id == card_id).where(CardAccess.user_id == user_id).where(CardAccess.access_level == AccessLevel.owner)
    result = await db.execute(query)
    if result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot remove the last owner")
    query = select(CardAccess).where(CardAccess.card_id == card_id).where(CardAccess.user_id == user_id)
    result = await db.execute(query)
    db_access = result.scalar_one_or_none()
    if not db_access:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Access not found")
    await db.delete(db_access)
    await db.commit()