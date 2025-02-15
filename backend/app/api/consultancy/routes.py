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
from typing import List, Optional, Dict, TypeVar
from phi.utils.log import logger

router = APIRouter()

# Initialize retriever once for all requests
retriever = initialize_database()

#-----------------------------------------------------------------------------
# Pydantic Models
#-----------------------------------------------------------------------------

# Base Models
class BaseRequest(BaseModel):
    query: str
    context: Optional[str] = ""
    context_answers: Optional[List[str]] = None

class BaseSessionData(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    query: str
    context_history: List[str] = []
    is_complete: bool = False
    needs_context: bool = Field(default=False, description="Whether additional context is needed")
    context_requirements: List[ContextRequirement] = Field(
        default=[],
        description="Structured questions to ask the client"
    )
    response: Optional[str] = Field(None, description="The response")

# Consultation Models
class ConsultRequest(BaseRequest):
    pass

class ConsultSessionData(BaseSessionData):
    needs_research: bool = Field(default=False, description="Whether research is needed")
    research_query: Optional[str] = Field(
        None,
        description="Query for the research agent if research is needed"
    )

# Research Models
class ResearchRequest(BaseRequest):
    pass

class ResearchSessionData(BaseSessionData):
    context_requirements: List[str] = Field(
        default=[],
        description="List of specific information needed if needs_context is True"
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

def create_consult_session(query: str) -> ConsultSessionData:
    """Create a new consultation session"""
    return ConsultSessionData(
        query=query,
        is_complete=False,
        needs_context=False,
        context_history=[],
        context_requirements=[]
    )

def create_research_session(query: str) -> ResearchSessionData:
    """Create a new research session"""
    return ResearchSessionData(
        query=query,
        is_complete=False,
        needs_context=False,
        context_history=[],
        context_requirements=[]
    )

#-----------------------------------------------------------------------------
# Consultation Routes
#-----------------------------------------------------------------------------

@router.post("/{session_id}/consult", response_model=ConsultSessionData)
async def consult(session_id: str, request: ConsultRequest):
    """Process a consultation request within a session"""
    try:
        logger.info(f"Processing consultation request for session {session_id}")
        
        # Initialize new session if it doesn't exist
        if session_id not in active_sessions:
            active_sessions[session_id] = create_consult_session(request.query)
        
        session_data = active_sessions[session_id]
        
        # If we received context answers, add them to history
        if request.context_answers:
            session_data.context_history.extend(request.context_answers)
        
        # Combine all context
        combined_context = "\n".join([
            request.context,
            *session_data.context_history
        ]).strip()
        
        # Process the query
        response = consultant.process_query(session_data.query, combined_context)
        
        # Check if more context is needed
        if "To better understand your situation" in response:
            logger.info("Additional context needed from client")
            session_data.needs_context = True
            
            # Extract questions from response
            context_requirements = []
            for line in response.split('\n'):
                if line.startswith('- '):
                    # Create ContextRequirement object
                    question = line[2:].split('(')[0].strip()
                    reason = None
                    if '(' in line and ')' in line:
                        reason = line.split('(')[1].split(')')[0].strip()
                    context_requirements.append(ContextRequirement(
                        question=question,
                        reason=reason if reason else "",
                        is_critical=True
                    ))
            
            session_data.context_requirements = context_requirements
            session_data.response = response
            
        else:
            logger.info("Consultation complete")
            session_data.needs_context = False
            session_data.is_complete = True
            session_data.response = response
            # Only remove from active sessions if complete
            if session_data.is_complete:
                active_sessions.pop(session_id, None)
            
        return session_data

    except Exception as e:
        logger.error("Error during consultation", exc_info=True)
        # Only remove session on error
        active_sessions.pop(session_id, None)
        raise HTTPException(
            status_code=500,
            detail=f"Error processing consultation: {str(e)}"
        )

@router.get("/{session_id}/consult/status", response_model=ConsultSessionData)
async def get_consult_status(session_id: str):
    """Get the status of a consultation session"""
    session_data = active_sessions.get(session_id)
    if not session_data:
        raise HTTPException(status_code=404, detail="Consultation session not found")
    return session_data

#-----------------------------------------------------------------------------
# Research Routes
#-----------------------------------------------------------------------------

@router.post("/{session_id}/research", response_model=ResearchSessionData)
async def research(session_id: str, request: ResearchRequest):
    """Process a research request within a session"""
    try:
        logger.info(f"Processing research request for session {session_id}")
        
        # Initialize new session if it doesn't exist
        if session_id not in active_research_sessions:
            active_research_sessions[session_id] = create_research_session(request.query)
        
        session_data = active_research_sessions[session_id]
        
        # If we received context answers, add them to history
        if request.context_answers:
            session_data.context_history.extend(request.context_answers)
        
        # Combine all context
        combined_context = "\n".join([
            request.context,
            *session_data.context_history
        ]).strip()
        
        # Process the query
        response = legal_agent.process_query(session_data.query, combined_context)
        
        # Check if more context is needed
        if "To better research this topic" in response:
            logger.info("Additional context needed from client")
            session_data.needs_context = True
            
            # Extract questions from response
            context_requirements = []
            for line in response.split('\n'):
                if line.startswith('- '):
                    # Remove the "- " prefix
                    question = line[2:].strip()
                    context_requirements.append(question)
            
            session_data.context_requirements = context_requirements
            session_data.response = response
            
        else:
            logger.info("Research complete")
            session_data.needs_context = False
            session_data.is_complete = True
            session_data.response = response
            
            # Since this is a complete response, we can try to extract specialist findings
            # This would need to be adapted based on the actual response format
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
            
            session_data = active_research_sessions.pop(session_id)
            
        return session_data

    except Exception as e:
        logger.error("Error during research", exc_info=True)
        active_research_sessions.pop(session_id, None)
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

# #-----------------------------------------------------------------------------
# # Redis Storage Routes
# #-----------------------------------------------------------------------------

# @router.post("/ask", response_model=dict)
# async def ask(request: PromptRequest):
#     """Ask a question within an existing consulting session"""
#     try:
#         session = consultancy_manager.get_session(request.consulting_id)
#         if not session:
#             raise HTTPException(status_code=404, detail="Consulting session not found")
        
#         response = session.ask(request.prompt)
#         consulting_data = redis_client.get_consulting(request.consulting_id)
#         if not consulting_data:
#             raise HTTPException(status_code=404, detail="Consulting data not found")
        
#         message = {
#             "prompt": request.prompt,
#             "response": response
#         }
#         consulting_data["messages"].append(message)
        
#         updated_data = redis_client.create_consulting(
#             consulting_id=request.consulting_id,
#             consulting_data=consulting_data
#         )
        
#         return {
#             "consulting_id": request.consulting_id,
#             "response": response,
#             "consulting_data": updated_data
#         }
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

# @router.get("/consulting/{consulting_id}", response_model=dict)
# async def get_consulting(consulting_id: str):
#     """Get a specific consulting by ID"""
#     consulting = redis_client.get_consulting(consulting_id)
#     if not consulting:
#         raise HTTPException(status_code=404, detail="Consulting not found")
#     return consulting

# @router.get("/user_consultings/{auth_id}", response_model=List[dict])
# async def get_user_consultings(auth_id: str):
#     """Get all consultings for a specific user"""
#     return redis_client.list_consulting(auth_id)

@router.post("/initialize/consultant", status_code=200)
async def initialize_consultant():
    """Initialize or reinitialize the consultant agent"""
    try:
        global consultant
        consultant = Consultant(retriever)  # Use existing retriever
        return {"status": "success", "message": "Consultant initialized successfully"}
    except Exception as e:
        logger.error("Error initializing consultant", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error initializing consultant: {str(e)}"
        )

@router.post("/initialize/legal-agent", status_code=200)
async def initialize_legal_agent():
    """Initialize or reinitialize the legal agent"""
    try:
        global legal_agent
        legal_agent = LegalAgent(retriever)  # Use existing retriever
        return {"status": "success", "message": "Legal agent initialized successfully"}
    except Exception as e:
        logger.error("Error initializing legal agent", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error initializing legal agent: {str(e)}"
        )
