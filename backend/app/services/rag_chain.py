"""RAG Chain Service - Retrieval Augmented Generation"""

from openai import OpenAI
from typing import Optional

from app.config import get_settings
from app.models.schemas import ChatResponse, RetrievedContext
from app.services.vector_store import VectorStoreService
from app.services.embedding_service import EmbeddingService


# System prompt for the AI support agent
SYSTEM_PROMPT = """You are a helpful AI customer support agent. Your role is to assist users by providing accurate answers based on historical support ticket resolutions.

INSTRUCTIONS:
1. Use ONLY the provided context from past support tickets to answer questions
2. If the context contains relevant information, provide a clear, helpful response
3. Adapt the resolution to fit the user's specific question naturally
4. Be conversational, friendly, and professional
5. If the provided context is NOT relevant or does NOT answer the user's question, you MUST respond with exactly: "HUMAN_REDIRECT"
6. Do not make up information that isn't in the provided context
7. Keep responses concise but complete

Remember: Only use information from the provided context. If unsure, redirect to human agent."""


USER_PROMPT_TEMPLATE = """Based on the following resolved support tickets, answer the user's question.

RELEVANT PAST SUPPORT TICKETS:
{context}

USER'S QUESTION: {question}

Provide a helpful response based on the above tickets. If none of the tickets are relevant to answering this question, respond with exactly "HUMAN_REDIRECT"."""


class RAGChainService:
    """Service for RAG-based question answering"""
    
    _instance: Optional["RAGChainService"] = None
    
    def __init__(self):
        settings = get_settings()
        self.client = OpenAI(api_key=settings.openai_api_key)
        self.model = settings.llm_model
        self.similarity_threshold = settings.similarity_threshold
        
        self.vector_store = VectorStoreService.get_instance()
        self.embedding_service = EmbeddingService.get_instance()
    
    @classmethod
    def get_instance(cls) -> "RAGChainService":
        """Get singleton instance of RAGChainService"""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance
    
    def _format_context(self, retrieved: list[RetrievedContext]) -> str:
        """Format retrieved contexts for the prompt"""
        if not retrieved:
            return "No relevant tickets found."
        
        context_parts = []
        for i, ctx in enumerate(retrieved, 1):
            part = f"""
--- Ticket #{i} (Relevance: {ctx.similarity_score:.0%}) ---
Category: {ctx.category or 'General'}
Original Question: {ctx.original_query}
Resolution: {ctx.resolution}
"""
            context_parts.append(part)
        
        return "\n".join(context_parts)
    
    def _should_redirect_to_human(
        self, 
        retrieved: list[RetrievedContext],
        llm_response: str
    ) -> bool:
        """Determine if the query should be redirected to a human agent"""
        
        # Check if LLM explicitly indicates redirect
        if "HUMAN_REDIRECT" in llm_response.upper():
            return True
        
        # Check if no relevant results
        if not retrieved:
            return True
        
        # Check if best match is below threshold
        best_score = max(ctx.similarity_score for ctx in retrieved)
        if best_score < self.similarity_threshold:
            return True
        
        return False
    
    async def generate_response(self, question: str) -> ChatResponse:
        """
        Generate a response for the user's question using RAG.
        
        Args:
            question: User's question
            
        Returns:
            ChatResponse with answer, sources, and human redirect flag
        """
        # Step 1: Embed the question
        query_embedding = self.embedding_service.embed_text(question)
        
        # Step 2: Retrieve similar tickets
        retrieved = self.vector_store.search_similar(
            query_embedding=query_embedding,
            top_k=3
        )
        
        # Step 3: Check if we have any relevant context
        if not retrieved:
            return ChatResponse(
                answer="I don't have enough information to answer your question based on our support history. Let me connect you with a human agent who can assist you better.",
                requires_human=True,
                sources=[],
                confidence=0.0
            )
        
        # Step 4: Format context for LLM
        context = self._format_context(retrieved)
        
        # Step 5: Generate response using GPT-4o
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": USER_PROMPT_TEMPLATE.format(
                context=context,
                question=question
            )}
        ]
        
        response = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=0.7,
            max_tokens=500
        )
        
        llm_response = response.choices[0].message.content.strip()
        
        # Step 6: Check if we should redirect to human
        requires_human = self._should_redirect_to_human(retrieved, llm_response)
        
        if requires_human:
            return ChatResponse(
                answer="I don't have enough information in our support history to properly answer your question. Let me connect you with a human agent who can provide more specific assistance.",
                requires_human=True,
                sources=retrieved,
                confidence=max(ctx.similarity_score for ctx in retrieved) if retrieved else 0.0
            )
        
        # Step 7: Return successful response
        best_score = max(ctx.similarity_score for ctx in retrieved)
        
        return ChatResponse(
            answer=llm_response,
            requires_human=False,
            sources=retrieved,
            confidence=best_score
        )


# Dependency injection helper
def get_rag_chain() -> RAGChainService:
    """FastAPI dependency for RAG chain service"""
    return RAGChainService.get_instance()

