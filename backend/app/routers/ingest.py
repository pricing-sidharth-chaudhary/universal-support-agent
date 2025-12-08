"""Ingest Router - File upload and indexing endpoints"""

import json
import csv
import io
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends

from app.models.schemas import SupportTicket, UploadResponse
from app.services.vector_store import VectorStoreService, get_vector_store
from app.services.embedding_service import EmbeddingService, get_embedding_service


router = APIRouter(prefix="/api", tags=["ingest"])


def parse_json_file(content: str) -> list[SupportTicket]:
    """Parse JSON file content into support tickets"""
    try:
        data = json.loads(content)
        
        # Handle both array and object with tickets key
        if isinstance(data, dict):
            data = data.get("tickets", [])
        
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
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON format: {str(e)}")


def parse_csv_file(content: str) -> list[SupportTicket]:
    """Parse CSV file content into support tickets"""
    try:
        reader = csv.DictReader(io.StringIO(content))
        tickets = []
        
        for i, row in enumerate(reader):
            # Support multiple column naming conventions
            ticket_id = row.get("id", row.get("ticket_id", str(i + 1)))
            query = row.get("query", row.get("question", ""))
            resolution = row.get("resolution", row.get("answer", ""))
            category = row.get("category")
            
            if query and resolution:
                tickets.append(SupportTicket(
                    id=str(ticket_id),
                    query=query,
                    resolution=resolution,
                    category=category
                ))
        
        return tickets
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid CSV format: {str(e)}")


@router.post("/upload", response_model=UploadResponse)
async def upload_tickets(
    file: UploadFile = File(...),
    vector_store: VectorStoreService = Depends(get_vector_store),
    embedding_service: EmbeddingService = Depends(get_embedding_service)
):
    """
    Upload a CSV or JSON file of support tickets for indexing.
    
    The file should contain tickets with:
    - id: Unique identifier
    - query (or question): The customer's question/issue
    - resolution (or answer): How the issue was resolved
    - category (optional): Ticket category
    """
    # Validate file type
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    filename = file.filename.lower()
    if not (filename.endswith(".json") or filename.endswith(".csv")):
        raise HTTPException(
            status_code=400, 
            detail="Only JSON and CSV files are supported"
        )
    
    # Read file content
    try:
        content = await file.read()
        content_str = content.decode("utf-8")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading file: {str(e)}")
    
    # Parse tickets based on file type
    if filename.endswith(".json"):
        tickets = parse_json_file(content_str)
    else:
        tickets = parse_csv_file(content_str)
    
    if not tickets:
        raise HTTPException(
            status_code=400, 
            detail="No valid tickets found in the file"
        )
    
    # Clear existing data (reindex)
    vector_store.clear_collection()
    
    # Generate embeddings for queries only
    queries = [ticket.query for ticket in tickets]
    
    try:
        embeddings = embedding_service.embed_texts(queries)
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error generating embeddings: {str(e)}"
        )
    
    # Store in vector database
    try:
        count = vector_store.add_tickets(tickets, embeddings)
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error storing tickets: {str(e)}"
        )
    
    return UploadResponse(
        success=True,
        message=f"Successfully indexed {count} support tickets",
        tickets_processed=count
    )


@router.delete("/clear", response_model=UploadResponse)
async def clear_tickets(
    vector_store: VectorStoreService = Depends(get_vector_store)
):
    """Clear all indexed tickets from the vector store"""
    success = vector_store.clear_collection()
    
    if success:
        return UploadResponse(
            success=True,
            message="All tickets cleared successfully",
            tickets_processed=0
        )
    else:
        raise HTTPException(status_code=500, detail="Failed to clear tickets")

