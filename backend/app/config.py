"""Application configuration using Pydantic Settings"""

from pydantic_settings import BaseSettings
from functools import lru_cache
import os


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # OpenAI
    openai_api_key: str
    
    # ChromaDB
    chroma_db_path: str = "./data/chroma_db"
    chroma_collection_name: str = "support_tickets"
    
    # Models
    embedding_model: str = "text-embedding-3-small"
    llm_model: str = "gpt-4o"
    
    # App settings
    debug: bool = False
    similarity_threshold: float = 0.75
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()

