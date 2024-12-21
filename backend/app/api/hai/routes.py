from fastapi import APIRouter
from ...human_ai.hai import Judge, ProcessInputRequest, TurnResponse, ConversationList

router = APIRouter()

# Create a single judge instance to be used across all routes
judge = Judge()

@router.post("/start-simulation", response_model=TurnResponse)
async def start_simulation():
    """Start a new HAI simulation"""
    return await judge.start_simulation()

@router.post("/process-input", response_model=TurnResponse)
async def process_input(request: ProcessInputRequest):
    """Process input from either human or AI"""
    return await judge.process_input(request)

@router.get("/conversation-history", response_model=ConversationList)
async def get_conversation_history():
    """Get the conversation history"""
    return ConversationList(conversations=judge.conversations) 