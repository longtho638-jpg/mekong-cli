"""Allow running: python3 -m src.daemon.heartbeat_scheduler"""
from src.daemon.heartbeat_scheduler import main
import asyncio

asyncio.run(main())
