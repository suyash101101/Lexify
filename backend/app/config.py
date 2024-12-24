from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    redis_host: str = "localhost"
    redis_port: int = 6379
    llm_model_name: str
    galadriel_api_key: str
    galadriel_base_url: str
    openai_api_key: str
    pinata_api_key: str
    pinata_secret_api_key: str
    google_api_key: str
    data_dir : str
    data_dir_for_hai : str

    class Config:
        env_file = ".env"
        case_sensitive = False
        env_prefix = ""

settings = Settings()
