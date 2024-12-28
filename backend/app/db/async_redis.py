from redis.asyncio import Redis
import json
from typing import List
import os

class AsyncRedisClient:
    def __init__(self):
        self.redis = Redis.from_url(
            url=os.getenv("REDIS_URL"),
            decode_responses=True
        )

    async def append_chat_message(self, case_id: str, message: dict):
        """Append a chat message to the case's chat history"""
        key = f"chat:{case_id}"
        await self.redis.rpush(key, json.dumps(message))

    async def get_chat_messages(self, case_id: str) -> List[dict]:
        """Get all chat messages for a case"""
        key = f"chat:{case_id}"
        messages = await self.redis.lrange(key, 0, -1)
        return [json.loads(msg) for msg in messages]

    async def get_case(self, case_id: str):
        """Get case details"""
        data = await self.redis.get(f"case:{case_id}")
        return json.loads(data) if data else None

async_redis_client = AsyncRedisClient() 