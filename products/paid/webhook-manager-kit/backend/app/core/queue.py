from typing import Optional
from arq import create_pool
from arq.connections import ArqRedis, RedisSettings
from app.core.config import settings

class QueueManager:
    redis: Optional[ArqRedis] = None

    @classmethod
    async def get_redis(cls) -> ArqRedis:
        if cls.redis is None:
            # Parse REDIS_URL for settings
            # Simplest is to let arq handle it or parse manually if needed
            # arq RedisSettings takes separate args.
            # We assume standard redis url format: redis://host:port/db
            # For this kit, we'll try to use from_dsn if available in newer arq/redis,
            # or manual parsing.
            cls.redis = await create_pool(RedisSettings.from_dsn(settings.REDIS_URL))
        return cls.redis

    @classmethod
    async def close(cls):
        if cls.redis:
            await cls.redis.close()
            cls.redis = None

queue_manager = QueueManager()
