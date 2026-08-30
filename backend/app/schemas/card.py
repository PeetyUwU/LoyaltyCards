from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class CardCreate(BaseModel):
    card_name: str
    code: str
    barcode_type_id: Optional[int] = None
    company_preset_id: Optional[int] = None
    color_scheme: Optional[str] = None


class CardUpdate(BaseModel):
    card_name: Optional[str] = None
    code: Optional[str] = None
    barcode_type_id: Optional[int] = None
    company_preset_id: Optional[int] = None
    color_scheme: Optional[str] = None


class CardOut(BaseModel):
    id: int
    created_by: int
    card_name: str
    code: str
    barcode_type_id: Optional[int] = None
    company_preset_id: Optional[int] = None
    color_scheme: Optional[str] = None
    added_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SharedCardOut(CardOut):
    access_level: str
    shared_by_username: Optional[str] = None
    shared_at: Optional[datetime] = None