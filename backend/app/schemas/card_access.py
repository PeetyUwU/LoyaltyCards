from pydantic import BaseModel, ConfigDict
from typing import Literal


class ShareRequest(BaseModel):
    user_id: int
    access_level: Literal["editor", "viewer"]


class CardAccessOut(BaseModel):
    card_id: int
    user_id: int
    access_level: str

    model_config = ConfigDict(from_attributes=True)