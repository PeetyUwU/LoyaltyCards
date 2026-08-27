from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    db_host: str
    db_user: str
    db_password: str
    db_name: str

    jwt_secret: str
    jwt_algorithm: str
    access_token_expire_minutes: int
    
    model_config = {"env_file": ".env"}

    @property
    def database_url(self) -> str:
        return f"mariadb+asyncmy://{self.db_user}:{self.db_password}@{self.db_host}/{self.db_name}"
    
settings = Settings()