from fastapi import APIRouter, HTTPException
import razorpay
from datetime import datetime, timedelta
import os
from pydantic import BaseModel
from typing import List
from ...constants.credits import CREDIT_COSTS
from ...db.postgres_db import postgres_client

router = APIRouter()

# Initialize Razorpay client
razorpay_client = razorpay.Client(
    auth=(os.getenv('RAZORPAY_KEY_ID'), os.getenv('RAZORPAY_KEY_SECRET'))
)

class UseCreditsRequest(BaseModel):
    user_id: str
    service: str

class CreateOrderRequest(BaseModel):
    amount: int
    credits: int
    package_name: str
    user_id: str

class VerifyPaymentRequest(BaseModel):
    payment_id: str
    order_id: str
    signature: str

class GetUserCreditsResponse(BaseModel):
    credits: int
    next_reset: str

class UseCreditsResponse(BaseModel):
    success: bool
    message: str
    remaining_credits: int
    deducted_credits: int   

class CreditDeduction(BaseModel):
    service: str
    cost: int
    timestamp: float

class BatchCreditUpdate(BaseModel):
    user_id: str
    deductions: List[CreditDeduction]

async def get_or_create_user_credits(user_id: str) -> GetUserCreditsResponse:
    """Get or create user credits with monthly reset."""
    credits = postgres_client.get_user_credits(user_id)
    
    if credits is None:
        # New user - initialize with free credits
        postgres_client.update_user_credits(user_id, CREDIT_COSTS['monthly_free_credits'])
        postgres_client.update_credits_last_reset(user_id)
        return GetUserCreditsResponse(
            credits=CREDIT_COSTS['monthly_free_credits'],
            next_reset=(datetime.now() + timedelta(days=30)).isoformat()
        )
    
    return GetUserCreditsResponse(
        credits=credits,
        next_reset=(datetime.now() + timedelta(days=30)).isoformat()
    )

@router.get("/user/credits/{user_id}")
async def get_user_credits(user_id: str) -> GetUserCreditsResponse:
    """Get user's credit information."""
    return await get_or_create_user_credits(user_id)

@router.post("/use-credits")
async def use_credits(request: UseCreditsRequest) -> UseCreditsResponse:
    """Use credits for a service."""
    if request.service not in CREDIT_COSTS:
        raise HTTPException(status_code=400, detail="Invalid service")
    
    cost = CREDIT_COSTS[request.service]
    current_credits = postgres_client.get_user_credits(request.user_id) or 0
    
    if current_credits < cost:
        return UseCreditsResponse(
            success=False,
            message="Not enough credits",
            remaining_credits=current_credits,
            deducted_credits=0
        )
    
    # Deduct credits
    new_balance = current_credits - cost
    postgres_client.update_user_credits(request.user_id, new_balance)
    
    # Log transaction
    postgres_client.add_transaction(
        user_id=request.user_id,
        transaction_type="DEBIT",
        amount=cost,
        description=f"Used credits for {request.service}"
    )
    
    # Log activity
    postgres_client.log_activity(
        user_id=request.user_id,
        activity_type="USE_CREDITS",
        description=f"Used {cost} credits for {request.service}",
        metadata={"service": request.service, "cost": cost}
    )
    
    return UseCreditsResponse(
        success=True,
        message=f"Credits deducted for {request.service}",
        remaining_credits=new_balance,
        deducted_credits=cost
    )

@router.post("/create-order")
async def create_order(request: CreateOrderRequest) -> dict:
    """Create a Razorpay order."""
    try:
        order_data = {
            'amount': request.amount * 100,  # Convert to paise
            'currency': 'INR',
            'notes': {
                'credits': request.credits,
                'package_name': request.package_name,
                'user_id': request.user_id
            }
        }
        order = razorpay_client.order.create(data=order_data)
        return {"order_id": order['id']}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/verify-payment")
async def verify_payment(request: VerifyPaymentRequest) -> dict:
    """Verify Razorpay payment and add credits to user account."""
    try:
        # Verify payment signature
        params_dict = {
            'razorpay_payment_id': request.payment_id,
            'razorpay_order_id': request.order_id,
            'razorpay_signature': request.signature
        }
        razorpay_client.utility.verify_payment_signature(params_dict)
        
        # Get order details
        order = razorpay_client.order.fetch(request.order_id)
        user_id = order['notes']['user_id']
        credits = int(order['notes']['credits'])
        
        # Add credits to user account
        current_credits = postgres_client.get_user_credits(user_id) or 0
        new_balance = current_credits + credits
        postgres_client.update_user_credits(user_id, new_balance)
        
        # Log transaction
        postgres_client.add_transaction(
            user_id=user_id,
            transaction_type="CREDIT",
            amount=credits,
            description=f"Purchased {credits} credits",
            reference_id=request.payment_id
        )
        
        # Log activity
        postgres_client.log_activity(
            user_id=user_id,
            activity_type="PURCHASE_CREDITS",
            description=f"Purchased {credits} credits via Razorpay",
            metadata={
                "payment_id": request.payment_id,
                "order_id": request.order_id,
                "credits": credits
            }
        )
        
        return {
            "success": True,
            "message": "Payment verified and credits added",
            "new_balance": new_balance
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/use-credits/batch")
async def batch_use_credits(data: BatchCreditUpdate):
    """
    Batch process credit deductions.
    This endpoint handles multiple credit deductions in a single request.
    """
    # Get current credits
    current_credits = postgres_client.get_user_credits(data.user_id) or 0

    # Calculate total cost
    total_cost = sum(deduction.cost for deduction in data.deductions)

    # Check if user has enough credits
    if current_credits < total_cost:
        raise HTTPException(
            status_code=400,
            detail="Insufficient credits for batch operation"
        )

    # Deduct credits
    new_credits = current_credits - total_cost
    postgres_client.update_user_credits(data.user_id, new_credits)

    return {
        "success": True,
        "remaining_credits": new_credits,
        "total_deducted": total_cost
    } 

# Add new endpoint to get transaction history
@router.get("/transactions/{user_id}")
async def get_transactions(user_id: str, limit: int = 50):
    """Get user's transaction history"""
    return postgres_client.get_user_transactions(user_id, limit) 