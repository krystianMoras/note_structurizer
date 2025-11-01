from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv

load_dotenv()
class Settings(BaseSettings):
    openai_api_key: str | None = None
    openai_api_base: str | None = None
    langfuse_secret_key: str | None = None
    langfuse_public_key: str | None = None
    langfuse_base_url: str | None = None

    model_config: SettingsConfigDict = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
        extra="ignore",
    )


