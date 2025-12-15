"""Auto-Indexer Service - Indexes agent knowledge bases on startup"""

import json
import logging
from pathlib import Path
from typing import Optional

from app.config import get_settings
from app.models.schemas import SupportTicket, AgentConfig
from app.services.vector_store import VectorStoreService
from app.services.embedding_service import EmbeddingService

logger = logging.getLogger(__name__)


class AutoIndexerService:
    """Service for automatically indexing agent knowledge bases on startup"""
    
    _instance: Optional["AutoIndexerService"] = None
    
    def __init__(self):
        self.settings = get_settings()
        self.vector_store = VectorStoreService.get_instance()
        self.embedding_service = EmbeddingService.get_instance()
        self.agents_config: list[AgentConfig] = []
        self._load_agents_config()
    
    @classmethod
    def get_instance(cls) -> "AutoIndexerService":
        """Get singleton instance"""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance
    
    def _load_agents_config(self):
        """Load agents configuration from JSON file"""
        config_path = Path(__file__).parent.parent / "agents_config.json"
        
        try:
            with open(config_path, "r", encoding="utf-8") as f:
                config_data = json.load(f)
                self.agents_config = [
                    AgentConfig(**agent) for agent in config_data.get("agents", [])
                ]
            logger.info(f"Loaded {len(self.agents_config)} agent configurations")
        except Exception as e:
            logger.error(f"Failed to load agents config: {e}")
            self.agents_config = []
    
    def get_agents(self) -> list[AgentConfig]:
        """Get all configured agents"""
        return self.agents_config
    
    def get_agent(self, agent_id: str) -> Optional[AgentConfig]:
        """Get a specific agent by ID"""
        for agent in self.agents_config:
            if agent.id == agent_id:
                return agent
        return None
    
    def _load_tickets_from_file(self, data_source: str) -> list[SupportTicket]:
        """Load tickets from a JSON file"""
        # Resolve path relative to backend directory
        base_path = Path(__file__).parent.parent.parent
        file_path = base_path / data_source
        
        if not file_path.exists():
            logger.warning(f"Data file not found: {file_path}")
            return []
        
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            
            tickets = []
            for item in data:
                ticket = SupportTicket(
                    id=str(item.get("id", "")),
                    query=item.get("query", item.get("question", "")),
                    resolution=item.get("resolution", item.get("answer", "")),
                    category=item.get("category")
                )
                if ticket.query and ticket.resolution:
                    tickets.append(ticket)
            
            return tickets
        except Exception as e:
            logger.error(f"Failed to load tickets from {file_path}: {e}")
            return []
    
    def index_agent(self, agent: AgentConfig, force: bool = False) -> int:
        """
        Index a single agent's knowledge base.
        
        Args:
            agent: Agent configuration
            force: If True, reindex even if data exists
            
        Returns:
            Number of tickets indexed
        """
        collection_name = agent.collection_name
        
        # Check if collection already has data
        current_count = self.vector_store.get_collection_count(collection_name)
        
        if current_count > 0 and not force:
            logger.info(f"Agent '{agent.id}' already indexed with {current_count} tickets. Skipping.")
            return current_count
        
        # Clear existing data if reindexing
        if force and current_count > 0:
            self.vector_store.clear_collection(collection_name)
            logger.info(f"Cleared existing data for agent '{agent.id}'")
        
        # Load tickets from data source
        tickets = self._load_tickets_from_file(agent.data_source)
        
        if not tickets:
            logger.warning(f"No tickets found for agent '{agent.id}'")
            return 0
        
        # Generate embeddings for queries only
        queries = [ticket.query for ticket in tickets]
        
        try:
            embeddings = self.embedding_service.embed_texts(queries)
        except Exception as e:
            logger.error(f"Failed to generate embeddings for agent '{agent.id}': {e}")
            return 0
        
        # Store in vector database
        try:
            count = self.vector_store.add_tickets_to_collection(
                collection_name=collection_name,
                tickets=tickets,
                embeddings=embeddings
            )
            logger.info(f"Indexed {count} tickets for agent '{agent.id}'")
            return count
        except Exception as e:
            logger.error(f"Failed to store tickets for agent '{agent.id}': {e}")
            return 0
    
    def reload_config(self):
        """Reload agents configuration from JSON file"""
        self._load_agents_config()
    
    def index_all_agents(self, force: bool = False) -> dict[str, int]:
        """
        Index all configured agents.
        
        Args:
            force: If True, reindex all agents even if data exists
            
        Returns:
            Dictionary of agent_id -> tickets indexed
        """
        # Reload config to pick up any changes
        self.reload_config()
        
        results = {}
        
        for agent in self.agents_config:
            count = self.index_agent(agent, force=force)
            results[agent.id] = count
        
        return results
    
    def get_agent_status(self, agent_id: str) -> dict:
        """Get status of a specific agent"""
        agent = self.get_agent(agent_id)
        if not agent:
            return {"error": "Agent not found"}
        
        count = self.vector_store.get_collection_count(agent.collection_name)
        
        return {
            "id": agent.id,
            "name": agent.name,
            "description": agent.description,
            "icon": agent.icon,
            "tickets_count": count,
            "is_ready": count > 0
        }
    
    def get_all_agents_status(self) -> list[dict]:
        """Get status of all agents"""
        return [self.get_agent_status(agent.id) for agent in self.agents_config]


def get_auto_indexer() -> AutoIndexerService:
    """FastAPI dependency for auto-indexer service"""
    return AutoIndexerService.get_instance()

