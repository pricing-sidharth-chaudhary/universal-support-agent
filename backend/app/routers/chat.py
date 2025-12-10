"""Chat Router - Agent-aware chat endpoint"""

from fastapi import APIRouter, Depends, HTTPException

from app.models.schemas import ChatRequest, ChatResponse
from app.services.rag_chain import RAGChainService, get_rag_chain
from app.services.auto_indexer import AutoIndexerService, get_auto_indexer


router = APIRouter(prefix="/api", tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    rag_chain: RAGChainService = Depends(get_rag_chain),
    auto_indexer: AutoIndexerService = Depends(get_auto_indexer)
):
    """
    Send a message to a specific AI support agent.
    
    The agent will:
    1. Search for similar questions in its indexed knowledge base
    2. Use the relevant resolutions to generate a helpful response
    3. If no relevant information is found, indicate that a human agent is needed
    """
    # Get agent configuration
    agent = auto_indexer.get_agent(request.agent_id)
    
    if not agent:
        raise HTTPException(
            status_code=404,
            detail=f"Agent '{request.agent_id}' not found"
        )
    
    # Check if agent's knowledge base has data
    status = auto_indexer.get_agent_status(request.agent_id)
    
    if not status.get("is_ready"):
        raise HTTPException(
            status_code=400,
            detail=f"Agent '{request.agent_id}' is not ready. Knowledge base is empty."
        )
    
    try:
        response = await rag_chain.generate_response(
            question=request.question,
            agent_config=agent
        )
        return response
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating response: {str(e)}"
        )
