import json
from typing import List, Optional
import redis.asyncio as redis
from app.models.rule import RateLimitRule

class RuleService:
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
        self.rules_key = "rate_limit:rules"

    def _get_field_key(self, path: str, method: str) -> str:
        return f"{method.upper()}:{path}"

    async def create_rule(self, rule: RateLimitRule) -> RateLimitRule:
        field = self._get_field_key(rule.path, rule.method)
        await self.redis.hset(self.rules_key, field, rule.model_dump_json())
        return rule

    async def get_rule(self, path: str, method: str) -> Optional[RateLimitRule]:
        field = self._get_field_key(path, method)
        data = await self.redis.hget(self.rules_key, field)
        if data:
            return RateLimitRule.model_validate_json(data)
        return None

    async def get_all_rules(self) -> List[RateLimitRule]:
        data = await self.redis.hgetall(self.rules_key)
        rules = []
        for _, value in data.items():
            rules.append(RateLimitRule.model_validate_json(value))
        return rules

    async def delete_rule(self, path: str, method: str) -> bool:
        field = self._get_field_key(path, method)
        count = await self.redis.hdel(self.rules_key, field)
        return count > 0

    async def find_matching_rule(self, path: str, method: str) -> Optional[RateLimitRule]:
        # Simple exact match for now.
        # In a production system, this would handle glob matching or regex.
        # Ideally, we load all rules into memory periodically or check specific cache.
        # For simplicity in this kit, we fetch from Redis (HGET is fast) or cached in memory.

        # Checking exact match
        return await self.get_rule(path, method)

