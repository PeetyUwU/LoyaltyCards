from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base

class BarcodeType(Base):
    __tablename__ = "barcode_types"
    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(20), unique=True)
    numeric_only: Mapped[bool] = mapped_column(default=False)
    fixed_length: Mapped[int | None]
    min_length: Mapped[int | None]
    max_length: Mapped[int | None]