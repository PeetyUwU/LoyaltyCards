from enum import IntEnum
from fastapi import Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.models.card_access import CardAccess


class AccessLevel(IntEnum):
    viewer = 0
    editor = 1
    owner = 2


def require_card_access(min_level: AccessLevel):
    async def checker(
        card_id: int,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
    ) -> CardAccess:
        result = await db.execute(
            select(CardAccess).where(
                CardAccess.card_id == card_id,
                CardAccess.user_id == current_user.id,
            )
        )
        access = result.scalar_one_or_none()

        if access is None or AccessLevel[access.access_level] < min_level:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient access to this card",
            )

        return access

    return checker