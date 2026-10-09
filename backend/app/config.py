import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Smart Threat Response Assistant (SOP + LLM)"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-soc-analyst-key-change-in-prod-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours

    # LLM Settings
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "gpt-4o-mini")

    # NVIDIA NIM Settings
    NIM_API_KEY: str = os.getenv("NIM_API_KEY", "")
    NIM_BASE_URL: str = os.getenv("NIM_BASE_URL", "https://integrate.api.nvidia.com/v1")
    NIM_MODEL: str = os.getenv("NIM_MODEL", "meta/llama-4-scout-17b-16e-instruct")
    
    # Storage Paths
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    DATA_DIR: str = os.path.join(BASE_DIR, "data")
    SOPS_DIR: str = os.path.join(DATA_DIR, "sops")
    INDEX_FILE: str = os.path.join(DATA_DIR, "vector_index.json")
    ALERTS_FILE: str = os.path.join(DATA_DIR, "alerts.json")
    AUDIT_FILE: str = os.path.join(DATA_DIR, "audit_chain.json")

    class Config:
        case_sensitive = True

settings = Settings()
os.makedirs(settings.DATA_DIR, exist_ok=True)
os.makedirs(settings.SOPS_DIR, exist_ok=True)
