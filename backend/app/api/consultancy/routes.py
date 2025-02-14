from ...consultancy.consultancy import ConsultancyManager, VectorDatabase
from fastapi import APIRouter, Body, HTTPException, Depends
from pydantic import BaseModel
from ...db.redis_db import redis_client
import uuid
from typing import List

router = APIRouter()
consultancy_manager = ConsultancyManager()

# Request models
class StartConsultingRequest(BaseModel):
    auth_id: str

class PromptRequest(BaseModel):
    auth_id: str
    consulting_id: str  # Added to identify the session
    prompt: str

vector_database = VectorDatabase()
consultancyAgent = RAG(vector_database.retriever)

@router.post("/ask", response_model=dict)
async def ask(request: PromptRequest):
    """Ask a question within an existing consulting session"""
    try:
        # Get the session
        session = consultancy_manager.get_session(request.consulting_id)
        if not session:
            raise HTTPException(status_code=404, detail="Consulting session not found")
        
        # Get response from the session's RAG agent
        response = session.ask(request.prompt)
        
        # Get existing consulting data
        consulting_data = redis_client.get_consulting(request.consulting_id)
        if not consulting_data:
            raise HTTPException(status_code=404, detail="Consulting data not found")
        
        # Update messages history
        message = {
            "prompt": request.prompt,
            "response": response
        }
        consulting_data["messages"].append(message)
        
        # Update in Redis
        updated_data = redis_client.create_consulting(
            consulting_id=request.consulting_id,
            consulting_data=consulting_data
        )
        
        return {
            "consulting_id": request.consulting_id,
            "response": response,
            "consulting_data": updated_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/consulting/{consulting_id}", response_model=dict)
async def get_consulting(consulting_id: str):
    """Get a specific consulting by ID"""
    consulting = redis_client.get_consulting(consulting_id)
    if not consulting:
        raise HTTPException(status_code=404, detail="Consulting not found")
    return consulting

@router.get("/user_consultings/{auth_id}", response_model=List[dict])
async def get_user_consultings(auth_id: str):
    """Get all consultings for a specific user"""
    consultings = redis_client.list_consulting(auth_id)
    return consultings

@router.get("/old_prompts", response_model=OldPromptsResponse)
async def get_old_prompts(request: OldPromptsRequest):
    """Get the old prompts for a user"""
    prompts = redis_client.get_consulting(request.auth_id)
    return OldPromptsResponse(prompts=prompts)
