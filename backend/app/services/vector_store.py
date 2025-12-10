"""ChromaDB Vector Store Service - Multi-Collection Support"""

import chromadb
from chromadb.config import Settings as ChromaSettings
from typing import Optional
import os

from app.config import get_settings
from app.models.schemas import SupportTicket, RetrievedContext


class VectorStoreService:
    """Service for managing ChromaDB vector store operations with multiple collections"""
    
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
        
        # Cache for collections
        self._collections: dict = {}
    
    @classmethod
    def get_instance(cls) -> "VectorStoreService":
        """Get singleton instance of VectorStoreService"""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance
    
    def get_collection(self, collection_name: str):
        """Get or create a collection by name"""
        if collection_name not in self._collections:
            self._collections[collection_name] = self.client.get_or_create_collection(
                name=collection_name,
                metadata={"hnsw:space": "cosine"}
            )
        return self._collections[collection_name]
    
    def add_tickets_to_collection(
        self,
        collection_name: str,
        tickets: list[SupportTicket], 
        embeddings: list[list[float]]
    ) -> int:
        """
        Add support tickets to a specific collection.
        
        Args:
            collection_name: Name of the ChromaDB collection
            tickets: List of support tickets
            embeddings: Pre-computed embeddings for ticket queries
            
        Returns:
            Number of tickets added
        """
        if not tickets:
            return 0
        
        collection = self.get_collection(collection_name)
        
        ids = [f"ticket_{t.id}" for t in tickets]
        documents = [t.query for t in tickets]
        metadatas = [
            {
                "ticket_id": t.id,
                "resolution": t.resolution,
                "category": t.category or "general"
            }
            for t in tickets
        ]
        
        collection.add(
            ids=ids,
            documents=documents,
            embeddings=embeddings,
            metadatas=metadatas
        )
        
        return len(tickets)
    
    def search_similar_in_collection(
        self,
        collection_name: str,
        query_embedding: list[float], 
        top_k: int = 3
    ) -> list[RetrievedContext]:
        """
        Search for similar queries in a specific collection.
        
        Args:
            collection_name: Name of the ChromaDB collection
            query_embedding: Embedding of the user's query
            top_k: Number of results to return
            
        Returns:
            List of retrieved contexts with similarity scores
        """
        collection = self.get_collection(collection_name)
        
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            include=["documents", "metadatas", "distances"]
        )
        
        retrieved = []
        
        if results and results["documents"] and results["documents"][0]:
            for i, doc in enumerate(results["documents"][0]):
                metadata = results["metadatas"][0][i]
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
    
    def clear_collection(self, collection_name: str) -> bool:
        """
        Clear all data from a specific collection.
        
        Returns:
            True if successful
        """
        try:
            self.client.delete_collection(collection_name)
            if collection_name in self._collections:
                del self._collections[collection_name]
            return True
        except Exception:
            return False
    
    def get_collection_count(self, collection_name: str) -> int:
        """Get the number of documents in a specific collection"""
        try:
            collection = self.get_collection(collection_name)
            return collection.count()
        except Exception:
            return 0
    
    def is_collection_ready(self, collection_name: str) -> bool:
        """Check if a specific collection is ready"""
        try:
            collection = self.get_collection(collection_name)
            _ = collection.count()
            return True
        except Exception:
            return False


# Dependency injection helper
def get_vector_store() -> VectorStoreService:
    """FastAPI dependency for vector store"""
    return VectorStoreService.get_instance()
