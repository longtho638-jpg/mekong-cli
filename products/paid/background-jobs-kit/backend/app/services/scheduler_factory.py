from app.services.scheduler import RedisScheduler

def get_scheduler() -> RedisScheduler:
    # In a real app we might support MongoScheduler too
    return RedisScheduler()
