"""RAG Chain Service - Agent-Aware Retrieval Augmented Generation with Tool Calling Support"""

import re
from openai import OpenAI
from typing import Optional

from app.config import get_settings
from app.models.schemas import ChatResponse, RetrievedContext, AgentConfig, ActionLink
from app.services.vector_store import VectorStoreService
from app.services.embedding_service import EmbeddingService


# Default system prompt fallback
DEFAULT_SYSTEM_PROMPT = """You are a helpful AI customer support agent. Your role is to assist users by providing accurate answers based on historical support ticket resolutions.

INSTRUCTIONS:
1. Use ONLY the provided context from past support tickets to answer questions
2. If the context contains relevant information, provide a clear, helpful response
3. Adapt the resolution to fit the user's specific question naturally
4. Be conversational, friendly, and professional
5. If the provided context is NOT relevant or does NOT answer the user's question, you MUST respond with exactly: "HUMAN_REDIRECT"
6. Do not make up information that isn't in the provided context
7. Keep responses concise but complete
8. If the resolution contains [ACTION_LINK:...] patterns, preserve them exactly in your response

Remember: Only use information from the provided context. If unsure, redirect to human agent."""


USER_PROMPT_TEMPLATE = """Based on the following resolved support tickets, answer the user's question.

RELEVANT PAST SUPPORT TICKETS:
{context}

USER'S QUESTION: {question}

Provide a helpful response based on the above tickets. Preserve any [ACTION_LINK:...] patterns exactly as they appear in the resolution. If none of the tickets are relevant to answering this question, respond with exactly "HUMAN_REDIRECT"."""


# ServiceNow ticket creation link
SERVICENOW_CREATE_TICKET_URL = "https://bain.service-now.com/sp?id=sc_cat_item&sys_id=create_ticket"


class RAGChainService:
    """Service for agent-aware RAG-based question answering with tool calling support"""
    
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
    
    def _parse_action_links(self, text: str) -> dict:
        """
        Parse action links from response text.
        Format: [ACTION_LINK:Label|URL] or [ACTION_LINK:Label|URL|TOOL_CALL:toolName]
        
        Returns dict with:
        - processed_text: Text with action links converted to readable format
        - action_links: List of action link objects
        """
        action_links = []
        
        # Pattern to match [ACTION_LINK:Label|URL] or [ACTION_LINK:Label|URL|TOOL_CALL:toolName]
        pattern = r'\[ACTION_LINK:([^|]+)\|([^|\]]+)(?:\|TOOL_CALL:([^\]]+))?\]'
        
        def replace_action_link(match):
            label = match.group(1)
            url = match.group(2)
            tool_call = match.group(3) if match.group(3) else None
            
            action_links.append(ActionLink(
                label=label,
                url=url,
                tool_call=tool_call,
                is_tool_action=tool_call is not None
            ))
            
            # Return empty string - links will be rendered separately in frontend
            return ""
        
        processed_text = re.sub(pattern, replace_action_link, text)
        # Clean up any extra newlines from removed links
        processed_text = re.sub(r'\n{3,}', '\n\n', processed_text).strip()
        
        return {
            "processed_text": processed_text,
            "action_links": action_links
        }
    
    def _should_redirect_to_human(
        self, 
        retrieved: list[RetrievedContext],
        llm_response: str
    ) -> bool:
        """Determine if the query should be redirected to a human agent"""
        
        if "HUMAN_REDIRECT" in llm_response.upper():
            return True
        
        if not retrieved:
            return True
        
        best_score = max(ctx.similarity_score for ctx in retrieved)
        if best_score < self.similarity_threshold:
            return True
        
        return False
    
    def _create_servicenow_response(self, question: str) -> dict:
        """Create a response with ServiceNow ticket creation link"""
        return {
            "processed_text": "I couldn't find a relevant solution in our knowledge base for your query. You can create a ServiceNow ticket for further assistance from our support team.",
            "action_links": [
                ActionLink(
                    label="Create ServiceNow Ticket",
                    url=f"{SERVICENOW_CREATE_TICKET_URL}&description={question}",
                    tool_call="createServiceNowTicket",
                    is_tool_action=True
                )
            ]
        }
    
    async def generate_response(
        self, 
        question: str, 
        agent_config: AgentConfig
    ) -> ChatResponse:
        """
        Generate a response for the user's question using agent-specific RAG.
        
        Args:
            question: User's question
            agent_config: Configuration for the selected agent
            
        Returns:
            ChatResponse with answer, sources, action links, and human redirect flag
        """
        # Step 1: Embed the question
        query_embedding = self.embedding_service.embed_text(question)
        
        # Step 2: Retrieve similar tickets from agent's collection
        retrieved = self.vector_store.search_similar_in_collection(
            collection_name=agent_config.collection_name,
            query_embedding=query_embedding,
            top_k=3
        )
        
        # Step 3: Check if we have any relevant context
        if not retrieved:
            # No results - provide ServiceNow ticket option
            servicenow_response = self._create_servicenow_response(question)
            return ChatResponse(
                answer=servicenow_response["processed_text"],
                requires_human=True,
                sources=[],
                confidence=0.0,
                action_links=servicenow_response["action_links"]
            )
        
        # Step 4: Format context for LLM
        context = self._format_context(retrieved)
        
        # Step 5: Generate response using agent-specific system prompt
        system_prompt = agent_config.system_prompt or DEFAULT_SYSTEM_PROMPT
        
        messages = [
            {"role": "system", "content": system_prompt},
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
            # Low confidence - provide ServiceNow ticket option
            servicenow_response = self._create_servicenow_response(question)
            return ChatResponse(
                answer=servicenow_response["processed_text"],
                requires_human=True,
                sources=retrieved,
                confidence=max(ctx.similarity_score for ctx in retrieved) if retrieved else 0.0,
                action_links=servicenow_response["action_links"]
            )
        
        # Step 7: Parse action links from response
        parsed_response = self._parse_action_links(llm_response)
        
        # Step 8: Return successful response
        best_score = max(ctx.similarity_score for ctx in retrieved)
        
        return ChatResponse(
            answer=parsed_response["processed_text"],
            requires_human=False,
            sources=retrieved,
            confidence=best_score,
            action_links=parsed_response["action_links"]
        )


# Dependency injection helper
def get_rag_chain() -> RAGChainService:
    """FastAPI dependency for RAG chain service"""
    return RAGChainService.get_instance()
