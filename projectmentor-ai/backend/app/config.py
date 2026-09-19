import os
from typing import Optional

try:
    from pydantic_settings import BaseSettings
    class Settings(BaseSettings):
        SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
        SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
        
        LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "openai")
        LLM_API_KEY: str = os.getenv("LLM_API_KEY", "")
        LLM_MODEL: str = os.getenv("LLM_MODEL", "gpt-4o-mini")
        
        EMBEDDING_PROVIDER: str = os.getenv("EMBEDDING_PROVIDER", "openai")
        EMBEDDING_API_KEY: str = os.getenv("EMBEDDING_API_KEY", "")
        EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")
        
        FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
        
        class Config:
            env_file = ".env"
            extra = "ignore"
except ImportError:
    class Settings:
        SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
        SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
        
        LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "openai")
        LLM_API_KEY: str = os.getenv("LLM_API_KEY", "")
        LLM_MODEL: str = os.getenv("LLM_MODEL", "gpt-4o-mini")
        
        EMBEDDING_PROVIDER: str = os.getenv("EMBEDDING_PROVIDER", "openai")
        EMBEDDING_API_KEY: str = os.getenv("EMBEDDING_API_KEY", "")
        EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")
        
        FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")

settings = Settings()
