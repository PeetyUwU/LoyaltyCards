from pydantic import BaseModel, ConfigDict

class AppSettingsOut(BaseModel):
    registration_enabled: bool
    model_config = ConfigDict(from_attributes=True)

class AppSettingsUpdate(BaseModel):
    registration_enabled: bool