from sqlalchemy.orm import Session
from sqlalchemy import func, text
from . import models, schemas
from typing import List, Optional

def get_search_results(db: Session, query: str, page: int = 1, page_size: int = 10, category: Optional[str] = None):
    offset = (page - 1) * page_size

    # Prepare the TSQuery
    # Simple plainto_tsquery for basic matching, or websearch_to_tsquery for advanced operators
    ts_query = func.websearch_to_tsquery('english', query)

    # Base query
    stmt = db.query(
        models.SearchDocument,
        func.ts_rank_cd(models.SearchDocument.search_vector, ts_query).label('rank'),
        func.ts_headline('english', models.SearchDocument.content, ts_query, 'StartSel=<b>, StopSel=</b>, MaxWords=35, MinWords=15, ShortWord=3, HighlightAll=FALSE, MaxFragments=2, FragmentDelimiter=...').label('snippet')
    ).filter(
        models.SearchDocument.search_vector.op('@@')(ts_query)
    )

    if category:
        stmt = stmt.filter(models.SearchDocument.category == category)

    # Order by rank
    stmt = stmt.order_by(text('rank DESC'))

    total = stmt.count()
    results = stmt.offset(offset).limit(page_size).all()

    mapped_results = []
    for doc, rank, snippet in results:
        mapped_results.append(schemas.SearchResult(
            id=doc.id,
            title=doc.title,
            url=doc.url,
            snippet=snippet,
            category=doc.category,
            score=rank
        ))

    return mapped_results, total

def get_autocomplete_suggestions(db: Session, query: str, limit: int = 5):
    # This is a simple implementation using ILIKE on title
    # For robust autocomplete, consider pg_trgm extension or a separate autocomplete index
    # Or strict prefix matching on title
    return db.query(models.SearchDocument.title)\
        .filter(models.SearchDocument.title.ilike(f"%{query}%"))\
        .limit(limit)\
        .all()

def get_facets(db: Session):
    categories = db.query(
        models.SearchDocument.category,
        func.count(models.SearchDocument.id)
    ).group_by(models.SearchDocument.category).all()

    # Simple tag parsing (assuming comma separated) - for more complex tags, normalization is needed
    # This is a simplified approach for the kit
    return {
        "categories": [{"value": c[0], "count": c[1]} for c in categories if c[0]],
        "tags": [] # Tags implementation would require normalization table or array column for best performance
    }

def create_search_event(db: Session, event: schemas.SearchAnalyticsCreate):
    db_event = models.SearchEvent(**event.dict())
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

def create_document(db: Session, doc: schemas.DocumentCreate):
    db_doc = models.SearchDocument(**doc.dict())
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)
    return db_doc

def reindex_all(db: Session):
    # In a real app this might trigger a background task
    # Here we just ensure the vector column is updated (which is automatic via Computed column)
    # But if we were doing external indexing, this is where it goes.
    pass
