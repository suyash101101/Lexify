from fastapi import APIRouter,HTTPException
from ...human_ai.hai import Judge, ProcessInputRequest, TurnResponse, ConversationList
from ...db.redis_db import redis_client

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

@router.get("/get-case-details/{case_id}")
async def get_conversations(case_id: str):
    """Get the case details from the db"""
    case = redis_client.get_case(case_id)
    if(not case):
        raise HTTPException(status_code=404, detail="Case not found")
    elif(case["case_status"] == "Open"):
        raise HTTPException(status_code=400, detail="Case is still open")
    elif(case["case_status"] == "closed"):
        return case
    elif(case["case_status"] == "Closed"):
        return case
    else:
        raise HTTPException(status_code=500, detail="Server error")

    