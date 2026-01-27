from abc import ABC, abstractmethod
from datetime import datetime
from typing import Any, BinaryIO, Dict, Optional

from pydantic import BaseModel


class BackupMetadata(BaseModel):
    timestamp: datetime
    backup_id: str
    strategy: str
    size_bytes: int
    checksum: str
    location: str
    encrypted: bool
    compressed: bool
    metadata: Dict[str, Any] = {}

class IEncryptionService(ABC):
    @abstractmethod
    def encrypt(self, data: BinaryIO) -> BinaryIO:
        """Encrypt data stream"""
        pass

    @abstractmethod
    def decrypt(self, data: BinaryIO) -> BinaryIO:
        """Decrypt data stream"""
        pass

class ICompressionService(ABC):
    @abstractmethod
    def compress(self, data: BinaryIO) -> BinaryIO:
        """Compress data stream"""
        pass

    @abstractmethod
    def decompress(self, data: BinaryIO) -> BinaryIO:
        """Decompress data stream"""
        pass

class IStorageAdapter(ABC):
    @abstractmethod
    async def upload(self, file_obj: BinaryIO, destination: str) -> str:
        """Upload file to storage. Returns the location/path."""
        pass

    @abstractmethod
    async def download(self, location: str) -> BinaryIO:
        """Download file from storage."""
        pass

    @abstractmethod
    async def list_backups(self, prefix: str) -> list[str]:
        """List backup files."""
        pass

    @abstractmethod
    async def delete(self, location: str) -> bool:
        """Delete backup file."""
        pass

class IBackupStrategy(ABC):
    @abstractmethod
    async def backup(self) -> BinaryIO:
        """Perform backup and return data stream"""
        pass

    @abstractmethod
    async def restore(self, source: BinaryIO) -> bool:
        """Restore from data stream"""
        pass

    @abstractmethod
    async def verify(self, source: BinaryIO) -> bool:
        """Verify backup integrity"""
        pass
