from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base

class CompanyPreset(Base):
    __tablename__ = "company_preset"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True)
    image_url: Mapped[str] = mapped_column(Text)  
    color_scheme: Mapped[str | None] = mapped_column(String(50))
    barcode_type_id: Mapped[int] = mapped_column(ForeignKey("barcode_types.id"))
