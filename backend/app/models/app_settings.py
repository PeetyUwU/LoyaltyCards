from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base

class AppSettings(Base):
    __tablename__ = "app_settings"
    id: Mapped[int] = mapped_column(primary_key=True)
    registration_enabled: Mapped[bool] = mapped_column(default=True)