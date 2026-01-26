from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import crud, models, schemas
from ..database import get_db

router = APIRouter()

@router.post("/search", response_model=schemas.SearchResponse)
def search(
    query: str = Query(..., min_length=1),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    results, total = crud.get_search_results(db, query, page, page_size, category)

    # Log the search event asynchronously in production, strictly synchronous here for simplicity
    crud.create_search_event(db, schemas.SearchAnalyticsCreate(
        query=query,
        result_count=total
    ))

    return schemas.SearchResponse(
        results=results,
        total=total,
        page=page,
        page_size=page_size
    )

@router.get("/search/autocomplete", response_model=schemas.AutocompleteResponse)
def autocomplete(
    query: str = Query(..., min_length=1),
    limit: int = Query(5, ge=1, le=10),
    db: Session = Depends(get_db)
):
    suggestions = crud.get_autocomplete_suggestions(db, query, limit)
    return schemas.AutocompleteResponse(
        suggestions=[s[0] for s in suggestions]
    )

@router.get("/search/facets", response_model=schemas.FacetResponse)
def facets(db: Session = Depends(get_db)):
    return crud.get_facets(db)

@router.post("/search/analytics")
def track_analytics(
    event: schemas.SearchAnalyticsCreate,
    db: Session = Depends(get_db)
):
    crud.create_search_event(db, event)
    return {"status": "ok"}

@router.post("/documents", response_model=schemas.Document)
def create_document(
    doc: schemas.DocumentCreate,
    db: Session = Depends(get_db)
):
    return crud.create_document(db, doc)

@router.post("/index/rebuild")
def rebuild_index(db: Session = Depends(get_db)):
    crud.reindex_all(db)
    return {"status": "index rebuilt"}
