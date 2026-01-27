import logging
from typing import BinaryIO, Optional

from backend.api.config import settings

logger = logging.getLogger(__name__)

try:
    import boto3
    from botocore.exceptions import ClientError
except ImportError:
    boto3 = None
    ClientError = None
    logger.warning("boto3 not installed. StorageService will not function.")

class StorageService:
    def __init__(self):
        if not boto3:
            # Only log error if we actually try to use it, or just warn once
            # logger.error("Attempting to initialize StorageService without boto3")
            self.s3_client = None
            self.bucket_name = None
            return

        # Check if settings has the required attributes
        if not hasattr(settings, 'aws_access_key_id') or not settings.aws_access_key_id:
            logger.warning("AWS settings not found or empty in configuration.")
            self.s3_client = None
            return

        try:
            self.s3_client = boto3.client(
                's3',
                aws_access_key_id=settings.aws_access_key_id,
                aws_secret_access_key=settings.aws_secret_access_key,
                region_name=settings.aws_region
            )
            self.bucket_name = settings.s3_bucket_name
        except Exception as e:
            logger.error(f"Failed to create boto3 client: {e}")
            self.s3_client = None

    def upload(self, file_name: str, file_obj: BinaryIO, content_type: str = None) -> Optional[str]:
        """Upload a file to S3 and return the URL"""
        if not self.s3_client:
            logger.warning("S3 client not initialized, skipping upload")
            return None

        try:
            extra_args = {}
            if content_type:
                extra_args['ContentType'] = content_type

            self.s3_client.upload_fileobj(
                file_obj,
                self.bucket_name,
                file_name,
                ExtraArgs=extra_args
            )
            return file_name
        except ClientError as e:
            logger.error(f"Error uploading file to S3: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error uploading to S3: {e}")
            return None

    def generate_presigned_url(self, file_name: str, expiration: int = 3600) -> Optional[str]:
        """Generate a presigned URL for a file"""
        if not self.s3_client:
            return None

        try:
            response = self.s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket_name, 'Key': file_name},
                ExpiresIn=expiration
            )
            return response
        except ClientError as e:
            logger.error(f"Error generating presigned URL: {e}")
            return None

    def delete(self, file_name: str) -> bool:
        """Delete a file from S3"""
        if not self.s3_client:
            return False

        try:
            self.s3_client.delete_object(Bucket=self.bucket_name, Key=file_name)
            return True
        except ClientError as e:
            logger.error(f"Error deleting file from S3: {e}")
            return False
