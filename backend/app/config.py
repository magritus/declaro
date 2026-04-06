from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    database_url: str
    secret_key: str
    environment: str = "development"

    access_token_expire_minutes: int = 30
    algorithm: str = "HS256"
    frontend_url: str = "http://localhost:5173"

    @model_validator(mode="after")
    def validate_secret_key(self) -> "Settings":
        if self.secret_key == "change_me_in_production" and self.environment != "development":
            raise ValueError("secret_key must be changed in non-development environments")
        return self


settings = Settings()
