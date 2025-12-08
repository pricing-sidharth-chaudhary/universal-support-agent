"""Pydantic schemas for request/response models"""

from pydantic import BaseModel, Field
from typing import Optional


class SupportTicket(BaseModel):
    """Schema for a support ticket from uploaded file"""
    id: str = Field(..., description="Unique ticket identifier")
    query: str = Field(..., description="Customer question/issue")
    resolution: str = Field(..., description="How the issue was resolved")
    category: Optional[str] = Field(None, description="Ticket category")


class ChatRequest(BaseModel):
    """Request schema for chat endpoint"""
    question: str = Field(..., min_length=1, description="User's question")


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

