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
from ..content_verification.main import ContentVerification





def generate_case_pdf(case: dict) -> str:
    """
    Generate a minimal PDF report for a case
    """
    os.makedirs(f'app/case_reports/{case["case_id"]}', exist_ok=True)
    pdf_filename = f'app/case_reports/{case["case_id"]}/case_{case["case_id"]}.pdf'
    
    doc = SimpleDocTemplate(pdf_filename, pagesize=letter)
    styles = getSampleStyleSheet()
    elements = []
    
    # Title
    elements.append(Paragraph(f"Case Report: {case['title']}", styles['Title']))
    elements.append(Spacer(1, 20))
    
    # Case Details
    elements.append(Paragraph("Case Details", styles['Heading1']))
    elements.append(Spacer(1, 10))
    elements.append(Paragraph(f"Case ID: {case['case_id']}", styles['Normal']))
    elements.append(Paragraph(f"Status: {case['case_status']}", styles['Normal']))
    elements.append(Paragraph(f"Created: {case['created_at']}", styles['Normal']))
    elements.append(Paragraph(f"Last Updated: {case['updated_at']}", styles['Normal']))
    elements.append(Spacer(1, 10))
    
    # Description
    elements.append(Paragraph("Case Description", styles['Heading2']))
    elements.append(Paragraph(case['description'], styles['Normal']))
    elements.append(Spacer(1, 20))
    
    # Lawyer 1 Evidence
    elements.append(Paragraph("Lawyer 1 Evidence", styles['Heading2']))
    elements.append(Spacer(1, 5))
    elements.append(Paragraph(f"Lawyer Address: {case['lawyer1_address']}", styles['Normal']))
    elements.append(Spacer(1, 10))
    
    for idx, evidence in enumerate(case['lawyer1_evidences'], 1):
        elements.append(Paragraph(f"Evidence {idx}:", styles['Heading3']))
        elements.append(Paragraph(f"Description: {evidence['description']}", styles['Normal']))
        elements.append(Paragraph(f"File Name: {evidence['original_name']}", styles['Normal']))
        elements.append(Paragraph(f"Submitted: {evidence['submitted_at']}", styles['Normal']))
        elements.append(Spacer(1, 10))
    
    # Lawyer 2 Evidence
    elements.append(Paragraph("AI Evidence", styles['Heading2']))
    elements.append(Spacer(1, 10))
    
    for idx, evidence in enumerate(case['lawyer2_evidences'], 1):
        elements.append(Paragraph(f"Evidence {idx}:", styles['Heading3']))
        elements.append(Paragraph(f"Description: {evidence['description']}", styles['Normal']))
        elements.append(Paragraph(f"File Name: {evidence['original_name']}", styles['Normal']))
        elements.append(Paragraph(f"Submitted: {evidence['submitted_at']}", styles['Normal']))
        elements.append(Spacer(1, 10))
    
    doc.build(elements)
    return pdf_filename


from ...schema.schemas import (
    CaseCreateSchema, 
    EvidenceSubmissionSchema, 
    LawyerType,
    CaseStatus
)
from ...db.redis_db import redis_client

router = APIRouter()
# In-memory cache with expiration time
cases_cache = {}
CACHE_EXPIRY = 600  # 10 minutes in seconds

@router.get("/{case_id}")
async def get_case(case_id: str):
    """Retrieves full case details"""
    redis_cases = redis_client.list_cases()
    if case_id in redis_cases:
        return redis_cases[case_id]
    else:
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
        case_id = str(uuid.uuid4())
        
        os.makedirs(f'app/case_reports/{case_id}', exist_ok=True)
        os.makedirs(f'app/case_reports/{case_id}/content_verification', exist_ok=True)
        os.makedirs(f'app/case_reports/{case_id}/content_verification/references', exist_ok=True)
        file_path = os.path.join(f'app/case_reports/{case_id}/content_verification', 'case.txt')
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(case_data.description)
        
        for file in case_data.files:
            os.makedirs(f'app/case_reports/{case_id}/content_verification/references', exist_ok=True)
            reference_file_path = os.path.join(f'app/case_reports/{case_id}/content_verification/references', f"{file.original_name.split('.')[0]}.txt")
            with open(reference_file_path, 'w', encoding='utf-8') as f:
                f.write(file.description)

        for file in case_data.lawyer2_files:
            os.makedirs(f'app/case_reports/{case_id}/content_verification/references', exist_ok=True)
            reference_file_path = os.path.join(f'app/case_reports/{case_id}/content_verification/references', f"{file.original_name.split('.')[0]}.txt")
            with open(reference_file_path, 'w', encoding='utf-8') as f:
                f.write(file.description)

        file_path = f'app/case_reports/{case_id}/content_verification/case.txt'
        reference_path = f'app/case_reports/{case_id}/content_verification/references'

        content_verifier = ContentVerification(file_path, reference_path)
        verification_results = content_verifier.verify_content(file_path, reference_path)
        print(verification_results)


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
            "lawyer2_evidences": [
                {
                    "ipfs_hash": file.ipfs_hash, # this will be changed later once we swtich to buckets or somethign like that 
                    "description": file.description,
                    "original_name": file.original_name,
                    "submitted_at": datetime.now().strftime("%d-%m-%Y %H:%M:%S")
                } for file in case_data.lawyer2_files
            ],#this will be given to the lawyer itself 
            "case_status": case_data.case_status,
            "created_at": datetime.now().strftime("%d-%m-%Y %H:%M:%S"),
            "updated_at": datetime.now().strftime("%d-%m-%Y %H:%M:%S")
        }
        
        #here add the thing in order to put the particular case into the database 
        saved_case = redis_client.create_case(case_id, case_obj)
        generate_case_pdf(case_obj)
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
        os.makedirs('content_verification/references', exist_ok=True)
        reference_file_path = os.path.join('content_verification/references', f"{file.original_name.split('.')[0]}.txt")
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
    generate_case_pdf(case)



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
    generate_case_pdf(case)

    
    return updated_case

@router.delete("/{case_id}")
async def delete_case(case_id: str):
    """Deletes a case and all associated data"""
    case = redis_client.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    try:
        # Delete case from Redis
        redis_client.delete_case(case_id)
        
        # Delete case files and directories
        case_dir = f'app/case_reports/{case_id}'
        if os.path.exists(case_dir):
            import shutil
            shutil.rmtree(case_dir)
        
        return {"message": "Case deleted successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting case: {str(e)}"
        )

@router.patch("/{case_id}")
async def update_case(case_id: str, case_data: dict):
    """Updates case details"""
    case = redis_client.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    try:
        # Update allowed fields
        if "title" in case_data:
            case["title"] = case_data["title"]
        if "description" in case_data:
            case["description"] = case_data["description"]
        if "case_status" in case_data:
            case["case_status"] = case_data["case_status"]
        
        case["updated_at"] = datetime.now().strftime("%d-%m-%Y %H:%M:%S")
        
        # Update case in Redis
        updated_case = redis_client.update_case(case_id, case)
        
        # Regenerate PDF with updated information
        generate_case_pdf(case)
        
        return updated_case
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error updating case: {str(e)}"
        )