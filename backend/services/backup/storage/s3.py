import os

try:
    import boto3
    from botocore.exceptions import ClientError

    BOTO3_AVAILABLE = True
except ImportError:
    BOTO3_AVAILABLE = False
    ClientError = Exception  # fallback

import io
import logging
from typing import BinaryIO, List

from backend.services.backup.interfaces import IStorageAdapter

logger = logging.getLogger(__name__)


class S3StorageAdapter(IStorageAdapter):
    def __init__(self, bucket_name: str, region_name: str = "us-east-1"):
        if not BOTO3_AVAILABLE:
            logger.warning("boto3 not installed, S3StorageAdapter disabled")
            self.s3_client = None
            return

        self.bucket_name = bucket_name
        self.s3_client = boto3.client("s3", region_name=region_name)

    async def upload(self, file_obj: BinaryIO, destination: str) -> str:
        """
        Uploads a file-like object to S3.
        """
        if not self.s3_client:
            raise ImportError("boto3 not installed")

        try:
            self.s3_client.upload_fileobj(file_obj, self.bucket_name, destination)
            return f"s3://{self.bucket_name}/{destination}"
        except ClientError as e:
            logger.error(f"Failed to upload to S3: {e}")
            raise

    async def download(self, location: str) -> BinaryIO:
        """
        Downloads a file from S3. Location can be key or s3:// uri
        """
        if not self.s3_client:
            raise ImportError("boto3 not installed")

        key = location.replace(f"s3://{self.bucket_name}/", "")
        file_obj = io.BytesIO()
        try:
            self.s3_client.download_fileobj(self.bucket_name, key, file_obj)
            file_obj.seek(0)
            return file_obj
        except ClientError as e:
            logger.error(f"Failed to download from S3: {e}")
            raise

    async def list_backups(self, prefix: str = "") -> List[str]:
        if not self.s3_client:
            return []

        try:
            response = self.s3_client.list_objects_v2(Bucket=self.bucket_name, Prefix=prefix)
            if "Contents" not in response:
                return []
            return [obj["Key"] for obj in response["Contents"]]
        except ClientError as e:
            logger.error(f"Failed to list S3 objects: {e}")
            raise

    async def delete(self, location: str) -> bool:
        if not self.s3_client:
            return False

        key = location.replace(f"s3://{self.bucket_name}/", "")
        try:
            self.s3_client.delete_object(Bucket=self.bucket_name, Key=key)
            return True
        except ClientError as e:
            logger.error(f"Failed to delete S3 object: {e}")
            return False
