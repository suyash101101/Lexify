import json
import os
from redis import Redis
from ..config import settings
from typing import List

class RedisClient:
    def __init__(self):
        self.redis = Redis.from_url(
            url="redis://localhost:6379",
            decode_responses=True
        )
    #cases
    def get_case(self, case_id: str):
        data = self.redis.get(f"case:{case_id}")
        return json.loads(data) if data else None

    def create_case(self, case_id: str, case_data: dict):
        self.redis.set(f"case:{case_id}", json.dumps(case_data))
        self.redis.sadd("cases", case_id)
        return case_data

    def update_case(self, case_id: str, case_data: dict):
        self.redis.set(f"case:{case_id}", json.dumps(case_data))
        return case_data

    def delete_case(self, case_id: str):
        """Deletes a case from Redis"""
        # Remove case data
        self.redis.delete(f"case:{case_id}")
        # Remove case ID from the set of cases
        self.redis.srem("cases", case_id)
        return True

    def list_cases(self):
        case_ids = self.redis.smembers("cases")
        cases = []
        for case_id in case_ids:
            case_data = self.get_case(case_id)
            if case_data:
                cases.append(case_data)
        return cases
    
    #consulting
    def create_consulting(self, consulting_id: str, consulting_data: dict):
        """Store consulting data with given ID"""
        self.redis.set(f"consulting:{consulting_id}", json.dumps(consulting_data))
        # Add to user's consulting set
        self.redis.sadd(f"user_consultings:{consulting_data['lawyer1_address']}", consulting_id)
        # Add to global consulting set
        self.redis.sadd("consultings", consulting_id)
        
        return consulting_data
    
    def get_consulting(self, consulting_id: str):
        data = self.redis.get(f"consulting:{consulting_id}")
        return json.loads(data) if data else None
    
    def list_consulting(self, auth_id: str):
        # Get consulting IDs for the specific user
        consulting_ids = self.redis.smembers(f"user_consultings:{auth_id}")
        consulting = []
        for consulting_id in consulting_ids:
            consulting_data = self.get_consulting(consulting_id)
            if consulting_data:
                consulting.append(consulting_data)
        return consulting
    
    
redis_client = RedisClient() 