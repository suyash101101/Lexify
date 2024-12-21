from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from .connection_manager import manager
from ..schema.schemas import ChatMessageSchema
from ..human_ai.hai import Judge, ProcessInputRequest
import json
from pydantic import ValidationError
import asyncio

router = APIRouter()

@router.websocket("/ws/{case_id}/{user_address}")
async def websocket_endpoint(websocket: WebSocket, case_id: str, user_address: str):    
    """
    WebSocket endpoint for case chat rooms.
    Each case_id represents a unique chat room.
    Only lawyers involved in the case can join.
    """
    try:
        await manager.connect(websocket, case_id, user_address)
        
        # Send chat history to new connection
        chat_history = manager.get_room_messages(case_id)
        for message in chat_history:
            await websocket.send_json(message)
        
        # Notify others about new user
        await manager.broadcast_to_room(
            {
                "type": "system",
                "content": f"User {user_address} joined the chat",
                "user_address": "system",
                "case_id": case_id
            },
            case_id
        )
        
        try:
            while True:
                # Receive and validate messages
                data = await websocket.receive_text()
                try:
                    message_data = json.loads(data)
                    message = ChatMessageSchema(
                        type="chat",
                        content=message_data["content"],
                        user_address=user_address,
                        case_id=case_id
                    )
                    
                    await manager.broadcast_to_room(message.dict(), case_id)
                    
                except (ValidationError, KeyError) as e:
                    await websocket.send_json({
                        "type": "error",
                        "content": "Invalid message format"
                    })
                    continue
                
        except WebSocketDisconnect:
            manager.disconnect(websocket, case_id)
            await manager.broadcast_to_room(
                {
                    "type": "system",
                    "content": f"User {user_address} left the chat",
                    "user_address": "system",
                    "case_id": case_id
                },
                case_id
            )
            
    except HTTPException as he:
        await websocket.close(code=1000, reason=str(he.detail))
    except Exception as e:
        manager.disconnect(websocket, case_id)
        await websocket.close(code=1000, reason="Internal server error") 

@router.websocket("/ws/hai/{case_id}/{user_address}")
async def hai_websocket_endpoint(websocket: WebSocket, case_id: str, user_address: str):
    try:
        await manager.connect(websocket, case_id, user_address)
        judge = Judge()
        
        try:
            # Start simulation
            print("Starting simulation...")
            initial_state = await judge.start_simulation()
            print("Initial state:", initial_state.dict())
            
            # Send initial judge statement
            await websocket.send_json({
                "type": "state_update",
                "data": initial_state.dict()
            })
            
            # If AI goes first, generate its response after a delay
            if initial_state.next_turn == "ai":
                print("AI goes first")
                await asyncio.sleep(2)
                ai_response = await judge.process_input(ProcessInputRequest(
                    turn_type="ai",
                    case_id = case_id
                ))
                print("AI response:", ai_response.dict())
                
                # Send AI's response
                await websocket.send_json({
                    "type": "turn_update",
                    "data": ai_response.dict()
                })
                
                # Get and send judge's comment
                judge_comment = await judge.process_input(ProcessInputRequest(
                    turn_type="judge",
                    case_id = case_id
                ))
                await websocket.send_json({
                    "type": "turn_update",
                    "data": judge_comment.dict()
                })
            else:
                print("Human goes first")
            
            while True:
                try:
                    data = await websocket.receive_json()
                    
                    if data["type"] == "human_input":
                        # Process human input and get response
                        human_response = await judge.process_input(ProcessInputRequest(
                            turn_type="human",
                            input_text=data["content"],
                            case_id=case_id
                        ))
                        
                        # Send human's response
                        await websocket.send_json({
                            "type": "turn_update",
                            "data": human_response.dict()
                        })
                        
                        # If it's AI's turn and case is open, generate AI response
                        if human_response.case_status == "open" and human_response.next_turn == "ai":
                            await asyncio.sleep(2)
                            ai_response = await judge.process_input(ProcessInputRequest(
                                turn_type="ai",
                                case_id=case_id
                            ))
                            
                            # Send AI's response
                            await websocket.send_json({
                                "type": "turn_update",
                                "data": ai_response.dict()
                            })
                    
                except WebSocketDisconnect:
                    manager.disconnect(websocket, case_id)
                    break
                    
        except WebSocketDisconnect:
            manager.disconnect(websocket, case_id)
            
    except HTTPException as he:
        await websocket.close(code=he.status_code, reason=str(he.detail)) 