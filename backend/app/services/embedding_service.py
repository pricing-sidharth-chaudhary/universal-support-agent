"""OpenAI Embedding Service"""

from openai import OpenAI
from typing import Optional

from app.config import get_settings


class EmbeddingService:
    """Service for generating embeddings using OpenAI"""
    
    _instance: Optional["EmbeddingService"] = None
    
    def __init__(self):
        settings = get_settings()
        self.client = OpenAI(api_key=settings.openai_api_key)
        self.model = settings.embedding_model
    
    @classmethod
    def get_instance(cls) -> "EmbeddingService":
        """Get singleton instance of EmbeddingService"""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance
    
    def embed_text(self, text: str) -> list[float]:
        """
        Generate embedding for a single text.
        
        Args:
            text: Text to embed
            
        Returns:
            Embedding vector
        """
        response = self.client.embeddings.create(
            model=self.model,
            input=text
        )
        return response.data[0].embedding
    
    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        """
        Generate embeddings for multiple texts.
        
        Args:
            texts: List of texts to embed
            
        Returns:
            List of embedding vectors
        """
        if not texts:
            return []
        
        # OpenAI API supports batch embedding
        response = self.client.embeddings.create(
            model=self.model,
            input=texts
        )
        
        # Sort by index to maintain order
        embeddings = sorted(response.data, key=lambda x: x.index)
        return [e.embedding for e in embeddings]


# Dependency injection helper
def get_embedding_service() -> EmbeddingService:
    """FastAPI dependency for embedding service"""
    return EmbeddingService.get_instance()

