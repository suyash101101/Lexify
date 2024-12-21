from fastapi import APIRouter, HTTPException
from datetime import datetime
import uuid


from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, 
    Spacer, 
    Table, 
    TableStyle,
    KeepTogether
)
from reportlab.platypus.para import Paragraph
from reportlab.platypus.flowables import KeepTogether
import os



file_path = r'../content-verification/case.txt'
reference_path = r'../content-verification/references'



from ...schema.schemas import (
    CaseCreateSchema, 
    EvidenceSubmissionSchema, 
    LawyerType,
    CaseStatus
)
from ...db.redis_db import redis_client

router = APIRouter()

@router.get("/{case_id}")
async def get_case(case_id: str):
    """Retrieves full case details"""
    case = redis_client.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case

@router.get("/")
async def list_cases():
    """Lists all cases"""
    return redis_client.list_cases()

@router.post("/create")
async def create_case(case_data: CaseCreateSchema):
    """Creates a new case with initial evidence"""
    try:
        os.makedirs('content-verification', exist_ok=True)
        file_path = os.path.join('content-verification', 'case.txt')
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(case_data.description)
        
        for file in case_data.files:
            os.makedirs('content-verification/references', exist_ok=True)
            reference_file_path = os.path.join('content-verification/references', f"{file.original_name.split('.')[0]}.txt")
            with open(reference_file_path, 'w', encoding='utf-8') as f:
                f.write(file.description)

        case_id = str(uuid.uuid4())
        case_obj = {
            "case_id": case_id,
            "title": case_data.title,
            "description": case_data.description,
            "lawyer1_address": case_data.lawyer1_address, # this is going to be gotten form the auth id from google or somethign like that 
            "lawyer1_evidences": [
                {
                    "ipfs_hash": file.ipfs_hash, # this will be changed later once we swtich to buckets or somethign like that 
                    "description": file.description,
                    "original_name": file.original_name,
                    "submitted_at": datetime.now().strftime("%d-%m-%Y %H:%M:%S")
                } for file in case_data.files
            ],
            "lawyer2_evidences": [],#this will be given to the lawyer itself 
            "case_status": case_data.case_status,
            "created_at": datetime.now().strftime("%d-%m-%Y %H:%M:%S"),
            "updated_at": datetime.now().strftime("%d-%m-%Y %H:%M:%S")
        }
        
        #here add the thing in order to put the particular case into the database 
        saved_case = redis_client.create_case(case_id, case_obj)
        print(saved_case)
        
        return saved_case
        
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Error creating case: {str(e)}"
        )

@router.post("/{case_id}/evidence")
async def submit_evidence(case_id: str, evidence_data: EvidenceSubmissionSchema):
    """Submits additional evidence to an existing case"""
    case = redis_client.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    for file in evidence_data.evidences:
        os.makedirs('content-verification/references', exist_ok=True)
        reference_file_path = os.path.join('content-verification/references', f"{file.original_name.split('.')[0]}.txt")
        with open(reference_file_path, 'w', encoding='utf-8') as f:
            f.write(file.description)

    evidence_with_timestamp = [
        {
            "ipfs_hash": evidence.ipfs_hash,
            "description": evidence.description,
            "original_name": evidence.original_name,
            "submitted_at": datetime.now().strftime("%d-%m-%Y %H:%M:%S")
        } for evidence in evidence_data.evidences
    ]


    if evidence_data.lawyer_type == LawyerType.AI:
        # AI evidence goes to lawyer2
        case["lawyer2_evidences"].extend(evidence_with_timestamp)
    else:
        # Human evidence goes to lawyer1
        if evidence_data.lawyer_address == case["lawyer1_address"]:
            case["lawyer1_evidences"].extend(evidence_with_timestamp)
        else:
            raise HTTPException(
                status_code=403,
                detail="Only registered lawyers can submit evidence"
            )

    
    case["updated_at"] = datetime.now().strftime("%d-%m-%Y %H:%M:%S")
    
    updated_case = redis_client.update_case(case_id, case)




    # here the only change would be how the whole thing is being stored atm and like how it is working atm 
    
    return updated_case

@router.patch("/{case_id}/status")
async def update_case_status(case_id: str, status: dict):
    """Updates the status of a case"""
    case = redis_client.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    case["case_status"] = status["status"]
    case["updated_at"] = datetime.now().strftime("%d-%m-%Y %H:%M:%S")
    
    updated_case = redis_client.update_case(case_id, case)

    
    return updated_case