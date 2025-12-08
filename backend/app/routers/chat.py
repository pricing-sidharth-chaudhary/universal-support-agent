"""Chat Router - Chat endpoint for AI support"""

from fastapi import APIRouter, Depends, HTTPException

from app.models.schemas import ChatRequest, ChatResponse
from app.services.rag_chain import RAGChainService, get_rag_chain
from app.services.vector_store import VectorStoreService, get_vector_store


router = APIRouter(prefix="/api", tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    rag_chain: RAGChainService = Depends(get_rag_chain),
    vector_store: VectorStoreService = Depends(get_vector_store)
):
    """
    Send a message to the AI support agent.
    
    The agent will:
    1. Search for similar questions in the indexed support tickets
    2. Use the relevant resolutions to generate a helpful response
    3. If no relevant information is found, indicate that a human agent is needed
    """
    # Check if vector store has data
    ticket_count = vector_store.get_ticket_count()
    if ticket_count == 0:
        raise HTTPException(
            status_code=400,
            detail="No support tickets indexed. Please upload a tickets file first."
        )
    
    try:
        response = await rag_chain.generate_response(request.question)
        return response
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating response: {str(e)}"
        )

