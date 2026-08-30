from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, model_validator


class CardCreate(BaseModel):
    card_name: str
    code: str
    company_preset_id: Optional[int] = None
    barcode_type_id: Optional[int] = None
    color_scheme: Optional[str] = None


class CardUpdate(BaseModel):
    card_name: Optional[str] = None
    code: Optional[str] = None
    company_preset_id: Optional[int] = None
    barcode_type_id: Optional[int] = None
    color_scheme: Optional[str] = None


class CardOut(BaseModel):
    id: int
    created_by: int
    card_name: str
    code: str
    company_preset_id: Optional[int]
    barcode_type_id: Optional[int]
    color_scheme: Optional[str]
    added_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="before")
    @classmethod
    def resolve_preset_inheritance(cls, data):
        preset = getattr(data, "company_preset", None)
        if preset is not None:
            return {
                "id": data.id,
                "created_by": data.created_by,
                "card_name": data.card_name,
                "code": data.code,
                "company_preset_id": data.company_preset_id,
                "barcode_type_id": preset.barcode_type_id,
                "color_scheme": preset.color_scheme,
                "added_at": data.added_at,
            }
        return data


class SharedCardOut(CardOut):
    access_level: str
    shared_by_username: Optional[str] = None
    shared_at: Optional[datetime] = None