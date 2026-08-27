from sqlalchemy import ForeignKey, Enum, String
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base

class UserSettings(Base):
    __tablename__ = "user_settings"
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    locale: Mapped[str] = mapped_column(String(10), default="cs")
    font_size: Mapped[str] = mapped_column(Enum("small", "medium", "large"), default="medium")
    theme: Mapped[str] = mapped_column(Enum("light", "dark", "system"), default="system")