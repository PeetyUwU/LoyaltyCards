from pydantic import BaseModel, ConfigDict

class PresetOut(BaseModel):
    id: int
    name: str
    image_url: str
    color_scheme: str | None
    barcode_type_id: int

    model_config = ConfigDict(from_attributes=True)