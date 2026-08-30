from typing import Literal
from pydantic import BaseModel, ConfigDict


class ShareRequest(BaseModel):
    user_id: int
    access_level: Literal["editor", "viewer"]


class UpdateAccessRequest(BaseModel):
    access_level: Literal["editor", "viewer"]


class CardAccessOut(BaseModel):
    card_id: int
    user_id: int
    access_level: str

    model_config = ConfigDict(from_attributes=True)


class CardAccessWithUserOut(BaseModel):
    card_id: int
    user_id: int
    username: str
    access_level: str

    model_config = ConfigDict(from_attributes=True)