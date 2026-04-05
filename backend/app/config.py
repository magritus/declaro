from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    database_url: str = "postgresql+asyncpg://declaro:declaro_secret@postgres:5432/declaro_db"
    secret_key: str = "change_me_in_production"
    environment: str = "development"


settings = Settings()
