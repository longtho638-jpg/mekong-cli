import gzip
import io
import shutil
from typing import BinaryIO

from backend.services.backup.interfaces import ICompressionService


class GzipCompressionService(ICompressionService):
    def compress(self, data: BinaryIO) -> BinaryIO:
        """Compress data using gzip"""
        output = io.BytesIO()
        with gzip.GzipFile(fileobj=output, mode='wb') as gz:
            shutil.copyfileobj(data, gz)
        output.seek(0)
        return output

    def decompress(self, data: BinaryIO) -> BinaryIO:
        """Decompress data using gzip"""
        output = io.BytesIO()
        with gzip.GzipFile(fileobj=data, mode='rb') as gz:
            shutil.copyfileobj(gz, output)
        output.seek(0)
        return output
