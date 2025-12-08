"""ChromaDB Vector Store Service - Local Persistent Storage"""

import chromadb
from chromadb.config import Settings as ChromaSettings
from typing import Optional
import os

from app.config import get_settings
from app.models.schemas import SupportTicket, RetrievedContext


class VectorStoreService:
    """Service for managing ChromaDB vector store operations"""
    
    _instance: Optional["VectorStoreService"] = None
    
    def __init__(self):
        settings = get_settings()
        
        # Ensure the directory exists
        os.makedirs(settings.chroma_db_path, exist_ok=True)
        
        # Initialize persistent ChromaDB client
        self.client = chromadb.PersistentClient(
            path=settings.chroma_db_path,
            settings=ChromaSettings(
                anonymized_telemetry=False,
                allow_reset=True
            )
        )
        
        self.collection_name = settings.chroma_collection_name
        self._collection = None
    
    @classmethod
    def get_instance(cls) -> "VectorStoreService":
        """Get singleton instance of VectorStoreService"""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance
    
    @property
    def collection(self):
        """Get or create the collection"""
        if self._collection is None:
            self._collection = self.client.get_or_create_collection(
                name=self.collection_name,
                metadata={"hnsw:space": "cosine"}
            )
        return self._collection
    
    def add_tickets(
        self, 
        tickets: list[SupportTicket], 
        embeddings: list[list[float]]
    ) -> int:
        """
        Add support tickets to the vector store.
        Embeds only the query, stores resolution in metadata.
        
        Args:
            tickets: List of support tickets
            embeddings: Pre-computed embeddings for ticket queries
            
        Returns:
            Number of tickets added
        """
        if not tickets:
            return 0
        
        ids = [f"ticket_{t.id}" for t in tickets]
        documents = [t.query for t in tickets]  # Only embed queries
        metadatas = [
            {
                "ticket_id": t.id,
                "resolution": t.resolution,
                "category": t.category or "general"
            }
            for t in tickets
        ]
        
        self.collection.add(
            ids=ids,
            documents=documents,
            embeddings=embeddings,
            metadatas=metadatas
        )
        
        return len(tickets)
    
    def search_similar(
        self, 
        query_embedding: list[float], 
        top_k: int = 3
    ) -> list[RetrievedContext]:
        """
        Search for similar queries in the vector store.
        
        Args:
            query_embedding: Embedding of the user's query
            top_k: Number of results to return
            
        Returns:
            List of retrieved contexts with similarity scores
        """
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            include=["documents", "metadatas", "distances"]
        )
        
        retrieved = []
        
        if results and results["documents"] and results["documents"][0]:
            for i, doc in enumerate(results["documents"][0]):
                metadata = results["metadatas"][0][i]
                # ChromaDB returns distance, convert to similarity
                # For cosine distance: similarity = 1 - distance
                distance = results["distances"][0][i]
                similarity = 1 - distance
                
                retrieved.append(RetrievedContext(
                    ticket_id=metadata["ticket_id"],
                    original_query=doc,
                    resolution=metadata["resolution"],
                    similarity_score=round(similarity, 4),
                    category=metadata.get("category")
                ))
        
        return retrieved
    
    def clear_collection(self) -> bool:
        """
        Clear all data from the collection (for reindexing).
        
        Returns:
            True if successful
        """
        try:
            self.client.delete_collection(self.collection_name)
            self._collection = None  # Reset cached collection
            return True
        except Exception:
            return False
    
    def get_ticket_count(self) -> int:
        """Get the number of tickets in the collection"""
        try:
            return self.collection.count()
        except Exception:
            return 0
    
    def is_ready(self) -> bool:
        """Check if the vector store is ready"""
        try:
            _ = self.collection.count()
            return True
        except Exception:
            return False


# Dependency injection helper
def get_vector_store() -> VectorStoreService:
    """FastAPI dependency for vector store"""
    return VectorStoreService.get_instance()

