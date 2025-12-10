"""FastAPI Application Entry Point"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import chat_router, ingest_router
from app.routers.agents import router as agents_router
from app.services.auto_indexer import AutoIndexerService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle events"""
    # Startup: Auto-index all agents
    logger.info("Starting auto-indexer...")
    auto_indexer = AutoIndexerService.get_instance()
    results = auto_indexer.index_all_agents(force=False)
    
    for agent_id, count in results.items():
        logger.info(f"Agent '{agent_id}': {count} tickets indexed")
    
    yield
    
    # Shutdown: Cleanup if needed
    logger.info("Shutting down...")


# Initialize FastAPI app
app = FastAPI(
    title="Bain AI Support Hub",
    description="Modular AI Support Agent Platform with specialized agents for Pricing, Cortex CRM, and Integrations",
    version="2.0.0",
    lifespan=lifespan
)

# Configure CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chat_router)
app.include_router(agents_router)
app.include_router(ingest_router)  # Keep for backwards compatibility


@app.get("/", tags=["health"])
async def root():
    """Root endpoint"""
    return {
        "name": "Bain AI Support Hub",
        "version": "2.0.0",
        "status": "running"
    }


@app.get("/api/status", tags=["health"])
async def get_status():
    """Get detailed status of all agents"""
    auto_indexer = AutoIndexerService.get_instance()
    agents_status = auto_indexer.get_all_agents_status()
    
    total_tickets = sum(a["tickets_count"] for a in agents_status)
    all_ready = all(a["is_ready"] for a in agents_status)
    
    return {
        "status": "ready" if all_ready else "partial",
        "total_agents": len(agents_status),
        "total_tickets": total_tickets,
        "agents": agents_status
    }


if __name__ == "__main__":
    import uvicorn
    settings = get_settings()
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=5000,
        reload=settings.debug
    )
