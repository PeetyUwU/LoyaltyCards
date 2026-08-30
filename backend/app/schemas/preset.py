from typing import Optional
from pydantic import BaseModel, ConfigDict

class PresetCreate(BaseModel):
    name: str
    image_url: str = ""
    color_scheme: Optional[str] = None
    barcode_type_id: int

class PresetUpdate(BaseModel):
    name: Optional[str] = None
    image_url: Optional[str] = None
    color_scheme: Optional[str] = None
    barcode_type_id: Optional[int] = None

class PresetOut(BaseModel):
    id: int
    name: str
    image_url: str
    color_scheme: str | None
    barcode_type_id: int

    model_config = ConfigDict(from_attributes=True)


class BarcodeTypeOut(BaseModel):
    id: int
    code: str
    numeric_only: bool
    fixed_length: int | None
    min_length: int | None
    max_length: int | None

    model_config = ConfigDict(from_attributes=True)