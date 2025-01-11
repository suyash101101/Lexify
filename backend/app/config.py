from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    # Redis settings (can be removed later if not needed)
    redis_url: str
    redis_host: str
    redis_port: int

    # PostgreSQL settings
    next_public_supabase_url: str
    next_public_supabase_anon_key: str
    postgres_url: str
    postgres_prisma_url: str
    postgres_url_non_pooling: str
    postgres_user: str
    postgres_password: str
    postgres_database: str
    postgres_host: str

    # Supabase settings
    supabase_url: str
    supabase_jwt_secret: str
    supabase_anon_key: str
    supabase_service_role_key: str

    # Other existing settings
    llm_model_name: str
    galadriel_api_key: str
    galadriel_base_url: str
    openai_api_key: str
    pinata_api_key: str
    pinata_secret_api_key: str
    google_api_key: str
    data_dir: str
    razorpay_key_id: str
    razorpay_key_secret: str

    class Config:
        env_file = ".env"
        case_sensitive = False
        env_prefix = ""

settings = Settings()
