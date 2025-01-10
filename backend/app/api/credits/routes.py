from fastapi import APIRouter, HTTPException
import redis.asyncio as redis
import razorpay
from datetime import datetime, timedelta
import os
from pydantic import BaseModel
router = APIRouter()

# Initialize Redis client
redis_client = redis.from_url(os.getenv('REDIS_URL', 'redis://localhost:6379'))

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


# Credit costs for different operations
CREDIT_COSTS = {
    # Main services
    'case_creation': 450,      # Initial case creation
    'case_response': 50,       # Each AI response in the case
    'chat_consulting': 85,     # Each consulting chat response
    
    # Default monthly credits
    'monthly_free_credits': 1000
}

async def get_or_create_user_credits(user_id: str) -> GetUserCreditsResponse:
    """Get or create user credits with monthly reset."""
    credits_key = f"user:{user_id}:credits"
    last_reset_key = f"user:{user_id}:last_reset"

    # Get last reset time
    last_reset = await redis_client.get(last_reset_key)
    
    # Check if user exists or needs monthly reset
    if not last_reset or (
        datetime.now() - datetime.fromisoformat(last_reset.decode('utf-8')) > timedelta(days=30)
    ):
        # New user or monthly reset needed
        await redis_client.set(credits_key, CREDIT_COSTS['monthly_free_credits'])
        await redis_client.set(last_reset_key, datetime.now().isoformat())
        return GetUserCreditsResponse(
            credits=CREDIT_COSTS['monthly_free_credits'],
            next_reset=(datetime.now() + timedelta(days=30)).isoformat()
        )
    
    # Get current credits
    credits = int(await redis_client.get(credits_key) or 0)
    next_reset = datetime.fromisoformat(last_reset.decode('utf-8')) + timedelta(days=30)
    
    return GetUserCreditsResponse(
        credits=credits,
        next_reset=next_reset.isoformat()
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
    credits_key = f"user:{request.user_id}:credits"
    
    # Get current credits
    current_credits = int(await redis_client.get(credits_key) or 0)
    
    if current_credits < cost:
        return UseCreditsResponse(
            success=False,
            message="Not enough credits",
            remaining_credits=current_credits
        )
    
    # Deduct credits
    new_balance = await redis_client.decrby(credits_key, cost)
    
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
        credits_key = f"user:{user_id}:credits"
        new_balance = await redis_client.incrby(credits_key, credits)
        
        return {
            "success": True,
            "message": "Payment verified and credits added",
            "new_balance": new_balance
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) 