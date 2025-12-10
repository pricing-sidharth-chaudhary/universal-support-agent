"""Pydantic schemas for request/response models"""

from pydantic import BaseModel, Field
from typing import Optional


class SupportTicket(BaseModel):
    """Schema for a support ticket from uploaded file"""
    id: str = Field(..., description="Unique ticket identifier")
    query: str = Field(..., description="Customer question/issue")
    resolution: str = Field(..., description="How the issue was resolved")
    category: Optional[str] = Field(None, description="Ticket category")


class AgentConfig(BaseModel):
    """Schema for agent configuration"""
    id: str = Field(..., description="Unique agent identifier")
    name: str = Field(..., description="Display name of the agent")
    description: str = Field(..., description="Brief description of the agent's expertise")
    icon: str = Field(..., description="Icon name for the agent")
    collection_name: str = Field(..., description="ChromaDB collection name")
    data_source: str = Field(..., description="Path to the agent's data file")
    system_prompt: str = Field(..., description="System prompt for the agent")


class ChatRequest(BaseModel):
    """Request schema for chat endpoint"""
    question: str = Field(..., min_length=1, description="User's question")
    agent_id: str = Field(..., description="ID of the agent to use")


class RetrievedContext(BaseModel):
    """Context retrieved from vector store"""
    ticket_id: str
    original_query: str
    resolution: str
    similarity_score: float
    category: Optional[str] = None


class ChatResponse(BaseModel):
    """Response schema for chat endpoint"""
    answer: str = Field(..., description="AI-generated response")
    requires_human: bool = Field(
        default=False, 
        description="Whether query should be redirected to human agent"
    )
    sources: list[RetrievedContext] = Field(
        default_factory=list,
        description="Source tickets used to generate response"
    )
    confidence: float = Field(
        default=0.0,
        description="Confidence score of the response"
    )


class UploadResponse(BaseModel):
    """Response schema for file upload endpoint"""
    success: bool
    message: str
    tickets_processed: int = 0


class HealthResponse(BaseModel):
    """Response schema for health check"""
    status: str
    vector_store_ready: bool
    tickets_count: int


class AgentStatusResponse(BaseModel):
    """Response schema for agent status"""
    id: str
    name: str
    description: str
    icon: str
    tickets_count: int
    is_ready: bool


class AgentListResponse(BaseModel):
    """Response schema for listing agents"""
    agents: list[dict]
    total: int
