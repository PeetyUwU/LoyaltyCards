from datetime import datetime, timezone
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base

class CardAccess(Base):
    __tablename__ = "card_access"
    card_id: Mapped[int] = mapped_column(ForeignKey("cards.id", ondelete="CASCADE"), primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    access_level: Mapped[str] = mapped_column(default="viewer")
    shared_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    shared_at: Mapped[datetime] = mapped_column(default=lambda: datetime.now(timezone.utc))