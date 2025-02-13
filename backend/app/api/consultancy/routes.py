from ...consultancy.consultancy import RAG, VectorDatabase
from fastapi import APIRouter, Body
from pydantic import BaseModel

router = APIRouter()

# Request model
class PromptRequest(BaseModel):
    prompt: str

vector_database = VectorDatabase()
consultancyAgent = RAG(vector_database.retriever)

@router.post("/ask", response_model=str)
async def ask(request: PromptRequest):
    """Ask a question to the consultancy agent"""
    return consultancyAgent.ask(request.prompt)