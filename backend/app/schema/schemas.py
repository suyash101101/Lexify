from pydantic import BaseModel
from typing import List, Optional
from enum import Enum
from datetime import datetime

class CaseStatus(str, Enum):
    OPEN = "Open"
    CLOSED = "Closed"

class LawyerType(str, Enum):
    HUMAN = "Human"
    AI = "AI"

#class CaseMode(str, Enum):
    #HUMAN_HUMAN = "human-human"
    #HUMAN_AI = "human-ai"

class FileDescription(BaseModel):
    ipfs_hash: str
    description: str
    original_name: str

class EvidenceDescription(BaseModel):
    ipfs_hash: str
    description: str
    original_name: str

class EvidenceSubmissionSchema(BaseModel):
    lawyer_type: LawyerType
    lawyer_address: Optional[str] = None
    evidences: List[EvidenceDescription]
    additional_notes: Optional[str] = None

class CaseCreateSchema(BaseModel):
    title: str
    description: str
    files: List[FileDescription]    
    lawyer1_address: str # this is going to be gotten form the auth id from google or somethign like that and that will be stored initially in cookies once the user logs in 
    case_status: CaseStatus = CaseStatus.OPEN

class ChatMessageSchema(BaseModel):
    type: str
    content: str
    user_address: str
    case_id: str
