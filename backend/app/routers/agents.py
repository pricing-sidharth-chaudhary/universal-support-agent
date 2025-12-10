"""Agents Router - Endpoints for managing AI agents"""

from fastapi import APIRouter, Depends, HTTPException

from app.models.schemas import AgentStatusResponse, AgentListResponse
from app.services.auto_indexer import AutoIndexerService, get_auto_indexer


router = APIRouter(prefix="/api/agents", tags=["agents"])


@router.get("", response_model=AgentListResponse)
async def list_agents(
    auto_indexer: AutoIndexerService = Depends(get_auto_indexer)
):
    """
    Get list of all available AI agents with their status.
    """
    agents_status = auto_indexer.get_all_agents_status()
    
    return AgentListResponse(
        agents=agents_status,
        total=len(agents_status)
    )


@router.get("/{agent_id}", response_model=AgentStatusResponse)
async def get_agent(
    agent_id: str,
    auto_indexer: AutoIndexerService = Depends(get_auto_indexer)
):
    """
    Get status of a specific agent.
    """
    agent = auto_indexer.get_agent(agent_id)
    
    if not agent:
        raise HTTPException(status_code=404, detail=f"Agent '{agent_id}' not found")
    
    status = auto_indexer.get_agent_status(agent_id)
    return AgentStatusResponse(**status)


@router.post("/{agent_id}/reindex")
async def reindex_agent(
    agent_id: str,
    auto_indexer: AutoIndexerService = Depends(get_auto_indexer)
):
    """
    Force reindex a specific agent's knowledge base.
    """
    agent = auto_indexer.get_agent(agent_id)
    
    if not agent:
        raise HTTPException(status_code=404, detail=f"Agent '{agent_id}' not found")
    
    count = auto_indexer.index_agent(agent, force=True)
    
    return {
        "success": True,
        "message": f"Reindexed {count} tickets for agent '{agent_id}'",
        "tickets_indexed": count
    }


@router.post("/reindex-all")
async def reindex_all_agents(
    auto_indexer: AutoIndexerService = Depends(get_auto_indexer)
):
    """
    Force reindex all agents' knowledge bases.
    """
    results = auto_indexer.index_all_agents(force=True)
    
    total = sum(results.values())
    
    return {
        "success": True,
        "message": f"Reindexed {total} total tickets across {len(results)} agents",
        "results": results
    }

