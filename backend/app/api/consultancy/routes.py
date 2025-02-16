from ...consultancy.vector_db import VectorDatabase
from ...consultancy.consultancy import (
    Consultant, 
    initialize_database, 
    ConsultationResponse, 
    ContextRequirement
)
from ...consultancy.agent import (
    LegalAgent,
    SynthesisResponse,
    ConsultationResponse as AgentConsultationResponse,
    TaskAssignment
)
from fastapi import APIRouter, Body, HTTPException, Depends
from pydantic import BaseModel, Field, ConfigDict
from ...db.redis_db import redis_client
import uuid
from typing import List, Optional, Dict, TypeVar, Union
from phi.utils.log import logger
import json
from datetime import datetime

router = APIRouter()

# Initialize retriever once for all requests
retriever = initialize_database() # this will get initialized in the start during deployment 
#-----------------------------------------------------------------------------
# Pydantic Models
#-----------------------------------------------------------------------------

# Base Models
class BaseRequest(BaseModel):
    query: str
    context: Optional[str] = ""
    context_answers: Optional[List[str]] = None

# Add new response model for initialization endpoints
class InitializeResponse(BaseModel):
    status: str
    message: str
    session_id: str

# Update BaseSessionData to match ConsultationResponse
class BaseSessionData(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    query: str
    context_history: List[str] = []
    needs_context: bool = Field(default=False, description="Whether additional context is needed")
    context_requirements: List[ContextRequirement] = Field(
        default=[],
        description="Structured questions to ask the client"
    )
    response: Optional[str] = Field(None, description="The response")

# Consultation Models
class ConsultRequest(BaseRequest):
    auth_id: Optional[str] = None

class ConsultSessionData(BaseModel):
    session_id: str
    auth_id: str
    context_history: List[str] = []
    conversations: Dict[str, List[Dict[str, str]]] = Field(
        default_factory=dict,
        description="Conversations with the consultant, keyed by query ID"
    )

# Research Models
class ResearchRequest(BaseRequest):
    auth_id: Optional[str] = None

class ResearchSessionData(BaseModel):
    session_id: str
    auth_id: str
    context_history: List[str] = []
    conversations: Dict[str, List[Dict[str, str]]] = Field(
        default_factory=dict,
        description="Conversations with the legal agent, keyed by query ID"
    )
    specialist_findings: Optional[List[AgentConsultationResponse]] = None
    task_assignment: Optional[TaskAssignment] = None

# Redis-related Models
class StartConsultingRequest(BaseModel):
    auth_id: str

class PromptRequest(BaseModel):
    auth_id: str
    consulting_id: str
    prompt: str

#-----------------------------------------------------------------------------
# Session Storage
#-----------------------------------------------------------------------------

# Create type aliases for the session dictionaries
ConsultSessionStorage = Dict[str, ConsultSessionData]
ResearchSessionStorage = Dict[str, ResearchSessionData]

# Initialize session storage with proper typing
active_sessions: ConsultSessionStorage = {}
active_research_sessions: ResearchSessionStorage = {}

#-----------------------------------------------------------------------------
# Helper Functions
#-----------------------------------------------------------------------------

def create_consult_session(session_id: str, auth_id: str) -> ConsultSessionData:
    """Create a new consultation session"""
    return ConsultSessionData(
        session_id=session_id,
        auth_id = auth_id,
        conversations={},
        context_history=[],
    )

def create_research_session(session_id: str, auth_id: str) -> ResearchSessionData:
    """Create a new research session"""
    return ResearchSessionData(
        session_id=session_id,
        auth_id = auth_id,
        context_history=[],
        conversations={},
        specialist_findings=None,
        task_assignment=None
    )

#-----------------------------------------------------------------------------
# Consultation Routes
#-----------------------------------------------------------------------------

@router.post("/{session_id}/consult", response_model=BaseSessionData)
async def consult(session_id: str, request: ConsultRequest):
    """Process a consultation request within a session"""
    try:
        if not request.query.strip():
            raise HTTPException(
                status_code=400,
                detail="Query cannot be empty"
            )
            
        logger.info(f"Processing consultation request for session {session_id}")
        
        # Check if session exists
        if session_id not in active_sessions:
            raise HTTPException(status_code=404, detail="Session not found")
            
        session_data = active_sessions[session_id]
        auth_id = session_data.auth_id
        if(auth_id != request.auth_id):
            raise HTTPException(status_code=401, detail="Unauthorized")
        
        query_id = str(uuid.uuid4())
        
        # Get existing consulting data
        consulting_data = redis_client.get_consulting(session_id)
        if not consulting_data:
            raise HTTPException(status_code=404, detail="Consulting session not found")
        
        # Update context history if needed
        if request.context_answers:
            session_data.context_history.extend(request.context_answers)
            consulting_data["context_history"].extend(request.context_answers)
        
        # Combine all context
        combined_context = "\n".join(
            request.context_answers if request.context_answers else []
        ).strip()
        
        # Process query
        response = consultant.process_query(request.query, combined_context)
        
        # Add conversation with query_id
        if query_id not in consulting_data["conversations"]:
            consulting_data["conversations"][query_id] = []
            
        consulting_data["conversations"][query_id].append({
            "query": request.query,
            "response": response,
            "context": request.context_answers
        })
        
        consulting_data["updated_at"] = datetime.utcnow().isoformat()
        
        # Update Redis
        redis_client.create_consulting(session_id, consulting_data)
        
        # Store conversation
        if query_id not in session_data.conversations:
            session_data.conversations[query_id] = []
        
        session_data.conversations[query_id].append({
            "query": request.query,
            "response": response,
            "context": combined_context
        })
        
        # Prepare response
        consultation_response = BaseSessionData(
            query=request.query,
            context_history=session_data.context_history,
            needs_context=False,
            context_requirements=[],
            response=response
        )
        
        # Check if more context is needed
        if "To better understand your situation" in response:
            logger.info("Additional context needed from client")
            consultation_response.needs_context = True
            
            # Extract questions from response
            context_requirements = []
            for line in response.split('\n'):
                if line.startswith('- '):
                    question = line[2:].split('(')[0].strip()
                    reason = None
                    if '(' in line and ')' in line:
                        reason = line.split('(')[1].split(')')[0].strip()
                    context_requirements.append(ContextRequirement(
                        question=question,
                        reason=reason if reason else "",
                        is_critical=True
                    ))
            
            consultation_response.context_requirements = context_requirements
            
        return consultation_response

    except ValueError as e:
        logger.error("Validation error", exc_info=True)
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
    except Exception as e:
        logger.error("Error during consultation", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error processing consultation: {str(e)}"
        )

@router.get("/{session_id}/consult/status", response_model=ConsultSessionData)
async def get_consult_status(session_id: str, auth_id: str):
    """Get the status of a consultation session"""
    try:
        session_data = active_sessions.get(session_id)
        # consulting_data = redis_client.get_consulting(session_id)
        if(session_data.auth_id != auth_id):
            raise HTTPException(status_code=401, detail="Unauthorized")
    except:
        raise HTTPException(status_code=404, detail="Consultation session not found")
    return session_data

#-----------------------------------------------------------------------------
# Research Routes
#-----------------------------------------------------------------------------

@router.post("/{session_id}/research", response_model=BaseSessionData)
async def research(session_id: str, request: ResearchRequest):
    """Process a research request within a session"""
    try:
        logger.info(f"Processing research request for session {session_id}")
        
        # Check if session exists
        if session_id not in active_research_sessions:
            raise HTTPException(status_code=404, detail="Research session not found")
            
        session_data = active_research_sessions[session_id]
        auth_id = session_data.auth_id
        if(auth_id != request.auth_id):
            raise HTTPException(status_code=401, detail="Unauthorized")
        
        query_id = str(uuid.uuid4())
        
        # Get existing research data from Redis
        research_data = redis_client.get_research(session_id)
        if not research_data:
            raise HTTPException(status_code=404, detail="Research session not found")
        
        # Update context history if needed
        if request.context_answers:
            session_data.context_history.extend(request.context_answers)
            research_data["context_history"].extend(request.context_answers)
        
        # Combine all context
        combined_context = "\n".join(
            request.context_answers if request.context_answers else []
        ).strip()
        
        # Process the query
        response = legal_agent.process_query(request.query, combined_context)
        
        # Store conversation in Redis
        if query_id not in research_data["conversations"]:
            research_data["conversations"][query_id] = []
        
        research_data["conversations"][query_id].append({
            "query": request.query,
            "response": response,
            "context": request.context_answers
        })
        
        research_data["updated_at"] = datetime.utcnow().isoformat()
        
        # Update Redis
        redis_client.update_research(session_id, research_data)
        
        # Store conversation in memory
        if query_id not in session_data.conversations:
            session_data.conversations[query_id] = []
        
        session_data.conversations[query_id].append({
            "query": request.query,
            "response": response,
            "context": combined_context
        })
        
        # Prepare response
        research_response = BaseSessionData(
            query=request.query,
            context_history=session_data.context_history,
            needs_context=False,
            context_requirements=[],
            response=response
        )
        
        # Check if more context is needed
        if "To better research this topic" in response:
            logger.info("Additional context needed from client")
            research_response.needs_context = True
            
            # Extract questions from response
            context_requirements = []
            for line in response.split('\n'):
                if line.startswith('- '):
                    question = line[2:].strip()
                    context_requirements.append(ContextRequirement(
                        question=question,
                        reason="",  # Legal agent doesn't provide reasons
                        is_critical=True
                    ))
            
            research_response.context_requirements = context_requirements
            
            # Try to extract specialist findings if present
            if "Expert:" in response:
                findings = []
                current_expert = None
                current_findings = []
                
                for line in response.split('\n'):
                    if line.startswith('Expert:'):
                        if current_expert:
                            findings.append(AgentConsultationResponse(
                                agent_name=current_expert,
                                response='\n'.join(current_findings)
                            ))
                        current_expert = line.replace('Expert:', '').strip()
                        current_findings = []
                    elif current_expert and line.strip():
                        current_findings.append(line)
                
                if current_expert and current_findings:
                    findings.append(AgentConsultationResponse(
                        agent_name=current_expert,
                        response='\n'.join(current_findings)
                    ))
                    
                session_data.specialist_findings = findings
            
        return research_response

    except Exception as e:
        logger.error("Error during research", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error processing research: {str(e)}"
        )

@router.get("/{session_id}/research/status", response_model=ResearchSessionData)
async def get_research_status(session_id: str):
    """Get the status of a research session"""
    session_data = active_research_sessions.get(session_id)
    if not session_data:
        raise HTTPException(status_code=404, detail="Research session not found")
    return session_data

@router.get("/research/{session_id}", response_model=dict)
async def get_research(session_id: str):
    """Get a specific research session"""
    try:
        research = redis_client.get_research(session_id)
        if not research:
            raise HTTPException(status_code=404, detail="Research session not found")
        return research
    except Exception as e:
        logger.error(f"Error fetching research: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching research: {str(e)}"
        )

@router.get("/research-sessions/{auth_id}", response_model=List[dict])
async def get_user_research(auth_id: str):
    """Get all research sessions for a user"""
    try:
        research = redis_client.list_research(auth_id)
        return research
    except Exception as e:
        logger.error(f"Error fetching research sessions: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching research sessions: {str(e)}"
        )

@router.get("/consultings/{auth_id}", response_model=List[dict])
async def get_user_consultings(auth_id: str):
    """Get all consultations for a user"""
    try:
        consultings = redis_client.list_consulting(auth_id)
        return consultings
    except Exception as e:
        logger.error(f"Error fetching consultings: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching consultings: {str(e)}"
        )

@router.get("/consulting/{session_id}", response_model=dict)
async def get_consulting(session_id: str):
    """Get a specific consulting session"""
    try:
        consulting = redis_client.get_consulting(session_id)
        if not consulting:
            raise HTTPException(status_code=404, detail="Consulting session not found")
        return consulting
    except Exception as e:
        logger.error(f"Error fetching consulting: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching consulting: {str(e)}"
        )

@router.post("/initialize/consultant", response_model=InitializeResponse)
async def initialize_consultant(auth_id: str):
    """Initialize or reinitialize the consultant agent"""
    try:
        global consultant
        consultant = Consultant(retriever)
        session_id = str(uuid.uuid4())
        
        # Initialize new session in memory
        if session_id not in active_sessions:
            active_sessions[session_id] = create_consult_session(session_id, auth_id)
        
        # Initialize in Redis with the same structure
        consulting_data = {
            "session_id": session_id,
            "auth_id": auth_id,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "context_history": [],
            "conversations": {}
        }
        
        # Store in Redis
        redis_client.create_consulting(session_id, consulting_data)
        
        return InitializeResponse(
            status="success", 
            message="Consultant initialized successfully",
            session_id=session_id
        )
    except Exception as e:
        logger.error("Error initializing consultant", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error initializing consultant: {str(e)}"
        )

@router.post("/initialize/legal-agent", response_model=InitializeResponse)
async def initialize_legal_agent(auth_id: str):
    """Initialize or reinitialize the legal agent"""
    try:
        global legal_agent
        legal_agent = LegalAgent(retriever) 
        session_id = str(uuid.uuid4())
        
        # Initialize new session in memory
        if session_id not in active_research_sessions:
            active_research_sessions[session_id] = create_research_session(session_id, auth_id)
        
        # Initialize in Redis with the same structure
        research_data = {
            "session_id": session_id,
            "auth_id": auth_id,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "context_history": [],
            "conversations": {}
        }
        
        # Store in Redis
        redis_client.create_research(session_id, research_data)
        
        return InitializeResponse(
            status="success", 
            message="Legal agent initialized successfully",
            session_id=session_id
        )
    except Exception as e:
        logger.error("Error initializing legal agent", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error initializing legal agent: {str(e)}"
        )
