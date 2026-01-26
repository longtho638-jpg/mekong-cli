from pydantic import BaseModel, Field
from typing import List, Optional
import time

class DocumentMetadata(BaseModel):
    source: str
    created_at: float = Field(default_factory=time.time)
    author: Optional[str] = None

class Document(BaseModel):
    id: Optional[str] = None
    content: str
    metadata: DocumentMetadata

class DocumentUploadResponse(BaseModel):
    ids: List[str]
    message: str

class SearchRequest(BaseModel):
    query: str
    k: int = 3
