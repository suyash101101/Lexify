from ...consultancy.consultancy import RAG
from fastapi import APIRouter, Body
from pydantic import BaseModel

router = APIRouter()

# Request model
class PromptRequest(BaseModel):
    prompt: str

consultancyAgent = RAG()

@router.post("/ask", response_model=str)
async def ask(request: PromptRequest):
    """Ask a question to the consultancy agent"""
    return consultancyAgent.ask(request.prompt)