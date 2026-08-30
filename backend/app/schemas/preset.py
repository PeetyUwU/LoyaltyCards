from typing import Optional
from pydantic import BaseModel, ConfigDict, model_validator


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


class BarcodeTypeBase(BaseModel):
    code: str
    numeric_only: bool = False
    fixed_length: Optional[int] = None
    min_length: Optional[int] = None
    max_length: Optional[int] = None


class BarcodeTypeCreate(BarcodeTypeBase):
    @model_validator(mode="after")
    def validate_lengths(self):
        has_fixed = self.fixed_length is not None
        has_range = self.min_length is not None or self.max_length is not None
        if has_fixed and has_range:
            raise ValueError(
                "Barcode type cannot have both a fixed length and a min/max length range."
            )
        if self.min_length is not None and self.max_length is not None:
            if self.min_length > self.max_length:
                raise ValueError("min_length cannot be greater than max_length.")
        return self


class BarcodeTypeUpdate(BaseModel):
    code: Optional[str] = None
    numeric_only: Optional[bool] = None
    fixed_length: Optional[int] = None
    min_length: Optional[int] = None
    max_length: Optional[int] = None

    @model_validator(mode="after")
    def validate_lengths(self):
        has_fixed = self.fixed_length is not None
        has_range = self.min_length is not None or self.max_length is not None
        if has_fixed and has_range:
            raise ValueError(
                "Barcode type cannot have both a fixed length and a min/max length range."
            )
        if self.min_length is not None and self.max_length is not None:
            if self.min_length > self.max_length:
                raise ValueError("min_length cannot be greater than max_length.")
        return self


class BarcodeTypeOut(BarcodeTypeBase):
    id: int

    model_config = ConfigDict(from_attributes=True)