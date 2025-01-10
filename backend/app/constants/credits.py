# Credit costs for different operations
CREDIT_COSTS = {
    # Main services
    'case_creation': 450,      # Initial case creation
    'case_response': 50,       # Each AI response in the case
    'chat_consulting': 85,     # Each consulting chat response
    'courtroom_session': 33,  # Each courtroom session
    
    # Default monthly credits
    'monthly_free_credits': 1000
}

__all__ = ['CREDIT_COSTS']
