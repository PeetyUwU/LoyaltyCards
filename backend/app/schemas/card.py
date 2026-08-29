from pydantic import BaseModel, ConfigDict
from typing import Optional

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
    card_name: str
    code: str
    barcode_type_id: Optional[int] = None
    company_preset_id: Optional[int] = None
    color_scheme: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)