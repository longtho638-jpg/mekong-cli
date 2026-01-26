from pydantic import BaseModel
from typing import Optional
from datetime import date

class ChangelogEntry(BaseModel):
    title: str
    date: date
    type: str  # new, fix, improvement, security
    author: Optional[str] = None
    content: str  # Markdown content
    content_html: str # HTML content
    slug: str

class ChangelogList(BaseModel):
    entries: list[ChangelogEntry]
    total: int
