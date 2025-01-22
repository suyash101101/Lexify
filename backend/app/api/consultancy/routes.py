from ...consultancy.consultancy import RAG
from fastapi import APIRouter, Body, HTTPException
from pydantic import BaseModel
from ...db.redis_db import redis_client
import uuid
from typing import List

router = APIRouter()

# Request model
class PromptRequest(BaseModel):
    auth_id: str
    prompt: str

class OldPromptsRequest(BaseModel):
    auth_id: str

class OldPromptsResponse(BaseModel):
    prompts: list[str]

consultancyAgent = RAG()

@router.post("/ask", response_model=dict)
async def ask(request: PromptRequest):
    """Ask a question to the consultancy agent"""
    try:
        # Generate UUID for new consulting
        consulting_id = str(uuid.uuid4())
        
        # Get response from consultancy agent
        response = consultancyAgent.ask(request.prompt)
        
        # Create consulting object
        consulting_obj = {
            "consulting_id": consulting_id,
            "lawyer1_address": request.auth_id,
            "prompt": request.prompt,
            "response": response
        }
        
        # Store in Redis
        consulting_data = redis_client.create_consulting(
            consulting_id=consulting_id,
            consulting_data=consulting_obj
        )
        
        return consulting_data
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
