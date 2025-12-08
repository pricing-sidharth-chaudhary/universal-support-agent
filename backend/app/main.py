"""FastAPI Application Entry Point"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import chat_router, ingest_router
from app.models.schemas import HealthResponse
from app.services.vector_store import get_vector_store


# Initialize FastAPI app
app = FastAPI(
    title="Universal AI Support Agent",
    description="AI-powered support agent using RAG with ChromaDB and GPT-4o",
    version="1.0.0"
)

# Configure CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chat_router)
app.include_router(ingest_router)


@app.get("/", response_model=HealthResponse, tags=["health"])
async def health_check():
    """Health check endpoint"""
    vector_store = get_vector_store()
    
    return HealthResponse(
        status="healthy",
        vector_store_ready=vector_store.is_ready(),
        tickets_count=vector_store.get_ticket_count()
    )


@app.get("/api/status", response_model=HealthResponse, tags=["health"])
async def get_status():
    """Get detailed status of the support agent"""
    vector_store = get_vector_store()
    
    return HealthResponse(
        status="ready" if vector_store.get_ticket_count() > 0 else "awaiting_data",
        vector_store_ready=vector_store.is_ready(),
        tickets_count=vector_store.get_ticket_count()
    )


if __name__ == "__main__":
    import uvicorn
    settings = get_settings()
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=5000,
        reload=settings.debug
    )

