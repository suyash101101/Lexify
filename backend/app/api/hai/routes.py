from fastapi import APIRouter, HTTPException
from ...human_ai.hai import Judge, ProcessInputRequest, TurnResponse
from typing import Dict
import asyncio
from pydantic import BaseModel
import os
import gc

# Force CPU usage and disable MPS
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"
os.environ["TORCH_DEVICE"] = "cpu"
os.environ["TOKENIZERS_PARALLELISM"] = "false"
os.environ["MPS_AVAILABLE"] = "0"
os.environ["TRANSFORMERS_OFFLINE"] = "1"  # Prevent downloading models

router = APIRouter()
active_judges: Dict[str, Judge] = {}

class StartSimulationRequest(BaseModel):
    case_id: str

def cleanup_judge(case_id: str):
    """Safely cleanup judge instance"""
    try:
        if case_id in active_judges:
            judge = active_judges[case_id]
            del active_judges[case_id]
            gc.collect()
    except Exception as e:
        print(f"Error cleaning up judge: {e}")

def initialize_judge(case_id: str) -> Judge:
    """Initialize a new judge instance"""
    try:
        judge = Judge()
        return judge
    except Exception as e:
        print(f"Error initializing judge: {e}")
        raise

async def handle_ai_turn(judge: Judge, case_id: str, previous_response: str = None) -> TurnResponse:
    """Handle AI's turn automatically"""
    try:
        ai_request = ProcessInputRequest(
            turn_type="ai",
            input_text=previous_response,
            case_id=case_id
        )
        return await judge.process_input(ai_request)
    except Exception as e:
        print(f"Error in AI turn: {e}")
        raise

@router.post("/start-simulation")
async def start_simulation(request: StartSimulationRequest):
    """Start a new simulation session"""
    try:
        cleanup_judge(request.case_id)  # Cleanup any existing judge
        judge = initialize_judge(request.case_id)
        active_judges[request.case_id] = judge
        initial_state = await judge.start_simulation()
        
        # If AI goes first, generate its response
        if initial_state.next_turn == "ai":
            await asyncio.sleep(1)  # Small delay for natural feel
            return await handle_ai_turn(judge, request.case_id)
            
        return initial_state
    except Exception as e:
        print(f"Error starting simulation: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error starting simulation: {str(e)}"
        )

@router.post("/process-input")
async def process_input(request: ProcessInputRequest):
    """Process input from either human or AI"""
    try:
        if request.case_id not in active_judges:
            raise HTTPException(status_code=404, detail="Session not found")
        
        judge = active_judges[request.case_id]
        
        # Process the current turn
        response = await judge.process_input(request)
        
        # If case is still open and it's AI's turn, automatically process AI's response
        if response.case_status == "open" and response.next_turn == "ai":
            await asyncio.sleep(1)  # Small delay for natural feel
            return await handle_ai_turn(judge, request.case_id, response.current_response.input)
        
        # If case is closed, cleanup
        if response.case_status == "closed":
            cleanup_judge(request.case_id)
            
        return response
    except Exception as e:
        print(f"Error processing input: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing input: {str(e)}"
        )

@router.get("/case-state/{case_id}")
async def get_case_state(case_id: str):
    """Get current state of a case"""
    if case_id not in active_judges:
        raise HTTPException(status_code=404, detail="Case not found")
        
    judge = active_judges[case_id]
    return {
        "case_status": judge.case_status if hasattr(judge, 'case_status') else "unknown",
        "current_turn": judge.current_turn if hasattr(judge, 'current_turn') else None,
        "human_score": judge.human_score,
        "ai_score": judge.ai_score
    }

@router.delete("/end-case/{case_id}")
async def end_case(case_id: str):
    """End a case and cleanup resources"""
    cleanup_judge(case_id)
    return {"status": "success"}

    