import asyncio
import io
import logging
import os
import subprocess
from typing import BinaryIO

from backend.services.backup.interfaces import IBackupStrategy

logger = logging.getLogger(__name__)


class RedisBackupStrategy(IBackupStrategy):
    def __init__(self, host: str = None, port: int = 6379, password: str = None):
        self.host = host or os.getenv("REDIS_HOST", "localhost")
        self.port = port or int(os.getenv("REDIS_PORT", 6379))
        self.password = password or os.getenv("REDIS_PASSWORD")

    async def backup(self) -> BinaryIO:
        """
        Perform Redis dump via redis-cli --rdb
        """
        cmd = ["redis-cli", "-h", self.host, "-p", str(self.port)]
        if self.password:
            cmd.extend(["-a", self.password])

        cmd.extend(["--rdb", "-"])  # Output to stdout

        try:
            process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            stdout, stderr = process.communicate()

            if process.returncode != 0:
                raise Exception(f"Redis backup failed: {stderr.decode()}")

            return io.BytesIO(stdout)
        except Exception as e:
            logger.error(f"Redis backup failed: {e}")
            raise

    async def restore(self, source: BinaryIO) -> bool:
        """
        Restore Redis RDB.
        WARNING: This is complex as Redis needs to be stopped or use specific restore commands.
        For active Redis, RESTORE command key by key is safer but RDB restore usually means replacing dump.rdb file and restarting.

        For this implementation, we will use the RESTORE command approach via redis-cli --pipe if possible,
        or just note that manual intervention might be preferred for Redis full restores to avoid data loss.

        However, `redis-cli --rdb` produces a file. To restore, we typically place it in /data/dump.rdb and restart redis.
        """
        logger.warning(
            "Redis restore via API is risky. Please stop Redis, place dump.rdb in data directory, and restart."
        )
        return False

    async def verify(self, source: BinaryIO) -> bool:
        """
        Verify RDB file integrity.
        redis-check-rdb is the tool.
        """
        # We need to write to a temp file to check
        import tempfile

        with tempfile.NamedTemporaryFile() as tmp:
            tmp.write(source.read())
            tmp.flush()
            source.seek(0)  # Reset stream

            cmd = ["redis-check-rdb", tmp.name]
            process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            stdout, stderr = process.communicate()

            if process.returncode != 0:
                logger.error(f"Redis verification failed: {stdout.decode()}")
                return False

            return True
