from datetime import datetime, timezone
from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base

class Card(Base):
    __tablename__ = "cards"
    id: Mapped[int] = mapped_column(primary_key=True)
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"))
    company_preset_id: Mapped[int | None] = mapped_column(ForeignKey("company_preset.id"))
    card_name: Mapped[str] = mapped_column(String(100))
    code: Mapped[str] = mapped_column(String(255))
    color_scheme: Mapped[str | None] = mapped_column(String(50))
    barcode_type_id: Mapped[int | None] = mapped_column(ForeignKey("barcode_types.id"))
    added_at: Mapped[datetime] = mapped_column(default=lambda: datetime.now(timezone.utc))