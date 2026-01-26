from sqlalchemy import Column, Integer, String, Text, DateTime, func, Index, Computed
from sqlalchemy.dialects.postgresql import TSVECTOR
from sqlalchemy.types import TypeDecorator
from .database import Base

class TSVector(TypeDecorator):
    impl = TSVECTOR
    cache_ok = True

class SearchDocument(Base):
    __tablename__ = "search_documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    url = Column(String, nullable=False)
    category = Column(String, index=True)
    tags = Column(String) # Comma-separated tags
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # PostgreSQL Full Text Search Vector
    # We combine title and content, giving title more weight (A) than content (B)
    search_vector = Column(TSVector, Computed("setweight(to_tsvector('english', title), 'A') || setweight(to_tsvector('english', content), 'B')", persisted=True))

    __table_args__ = (
        Index('ix_search_documents_search_vector', search_vector, postgresql_using='gin'),
    )

class SearchEvent(Base):
    __tablename__ = "search_events"

    id = Column(Integer, primary_key=True, index=True)
    query = Column(String, nullable=False)
    user_id = Column(String, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    result_count = Column(Integer, default=0)
    clicked_url = Column(String, nullable=True)
