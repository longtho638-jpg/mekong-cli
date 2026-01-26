from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

class SearchResult(BaseModel):
    id: int
    title: str
    url: str
    snippet: Optional[str] = None
    category: Optional[str] = None
    score: float

    class Config:
        orm_mode = True

class SearchResponse(BaseModel):
    results: List[SearchResult]
    total: int
    page: int
    page_size: int

class AutocompleteResponse(BaseModel):
    suggestions: List[str]

class FacetItem(BaseModel):
    value: str
    count: int

class FacetResponse(BaseModel):
    categories: List[FacetItem]
    tags: List[FacetItem]

class SearchAnalyticsCreate(BaseModel):
    query: str
    user_id: Optional[str] = None
    result_count: int
    clicked_url: Optional[str] = None

class DocumentCreate(BaseModel):
    title: str
    content: str
    url: str
    category: Optional[str] = "general"
    tags: Optional[str] = ""

class Document(DocumentCreate):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True
