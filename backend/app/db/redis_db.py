import json
import os
from redis import Redis
from ..config import settings
from typing import List

class RedisClient:
    def __init__(self):
        self.redis = Redis.from_url(
            url=os.getenv("REDIS_URL"),
            decode_responses=True
        )

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

    def list_cases(self):
        case_ids = self.redis.smembers("cases")
        cases = []
        for case_id in case_ids:
            case_data = self.get_case(case_id)
            if case_data:
                cases.append(case_data)
        return cases

redis_client = RedisClient() 