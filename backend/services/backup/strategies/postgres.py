import io
import logging
import os
import subprocess
from typing import BinaryIO

from backend.services.backup.interfaces import IBackupStrategy

logger = logging.getLogger(__name__)


class PostgresBackupStrategy(IBackupStrategy):
    def __init__(self, db_url: str = None):
        """
        Initialize with database connection URL.
        Defaults to POSTGRES_URL env var.
        """
        self.db_url = db_url or os.getenv("POSTGRES_URL")
        if not self.db_url:
            # Construct from individual env vars if full URL not available
            user = os.getenv("POSTGRES_USER", "postgres")
            password = os.getenv("POSTGRES_PASSWORD", "postgres")
            host = os.getenv("POSTGRES_HOST", "localhost")
            port = os.getenv("POSTGRES_PORT", "5432")
            db = os.getenv("POSTGRES_DB", "agencyos")
            self.db_url = f"postgresql://{user}:{password}@{host}:{port}/{db}"

    async def backup(self) -> BinaryIO:
        """
        Perform pg_dump and return stream.
        """
        # Using subprocess to call pg_dump
        # Requires pg_dump installed in the environment
        cmd = ["pg_dump", "--format=custom", "--no-password", self.db_url]

        try:
            process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            stdout, stderr = process.communicate()

            if process.returncode != 0:
                raise Exception(f"pg_dump failed: {stderr.decode()}")

            return io.BytesIO(stdout)
        except Exception as e:
            logger.error(f"Postgres backup failed: {e}")
            raise

    async def restore(self, source: BinaryIO) -> bool:
        """
        Restore from pg_restore stream.
        """
        # pg_restore expects file or stdin
        cmd = ["pg_restore", "--clean", "--if-exists", "--no-password", "--dbname", self.db_url]

        try:
            process = subprocess.Popen(
                cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE
            )
            stdout, stderr = process.communicate(input=source.read())

            if process.returncode != 0:
                # pg_restore often returns warnings as non-zero, check stderr
                logger.warning(
                    f"pg_restore finished with code {process.returncode}: {stderr.decode()}"
                )
                if "error" in stderr.decode().lower():
                    return False

            return True
        except Exception as e:
            logger.error(f"Postgres restore failed: {e}")
            return False

    async def verify(self, source: BinaryIO) -> bool:
        """
        Verify backup integrity using pg_restore --list
        """
        cmd = ["pg_restore", "--list"]

        try:
            process = subprocess.Popen(
                cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE
            )
            stdout, stderr = process.communicate(input=source.read())

            source.seek(0)  # Reset stream position

            if process.returncode != 0:
                logger.error(f"Backup verification failed: {stderr.decode()}")
                return False

            return True
        except Exception as e:
            logger.error(f"Verification process failed: {e}")
            return False
