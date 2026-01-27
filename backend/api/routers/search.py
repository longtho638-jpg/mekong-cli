from fastapi import APIRouter, Depends, Query, HTTPException
from typing import List, Optional, Dict, Any
from backend.services.search_service import SearchService
import json

router = APIRouter(prefix='/search', tags=['Search'])

@router.get('/')
async def search(
    q: str = Query(..., min_length=1),
    indexes: List[str] = Query(['users', 'transactions', 'audit']),
    filters: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
):
    """
    Full-text search across multiple indexes.

    Query params:
    - q: Search query string
    - indexes: Comma-separated list of indexes to search
    - filters: JSON string of filters (e.g., '{"status": "active"}')
    - limit: Max results per index
    - offset: Pagination offset
    """
    filter_dict = None
    if filters:
        try:
            filter_dict = json.loads(filters)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid JSON in filters")

    search_service = SearchService()
    results = await search_service.search(q, indexes, filter_dict, limit, offset)
    return results

@router.get('/autocomplete')
async def autocomplete(
    q: str = Query(..., min_length=2),
    index: str = 'users',
    limit: int = 5,
):
    """
    Instant autocomplete suggestions (<100ms).
    """
    search_service = SearchService()
    suggestions = await search_service.autocomplete(q, index, limit)
    return {'suggestions': [{'title': s, 'type': index} for s in suggestions]}

@router.post('/reindex/{index}')
async def reindex(index: str):
    """
    Admin: Trigger full reindex of an index.
    """
    # Placeholder for reindexing logic.
    # In a real implementation, this would trigger a background job to fetch all data
    # from the database for the given entity/index and send it to the search engine.

    return {'success': True, 'message': f'Reindexing triggered for {index} (mock)', 'index': index}

@router.get('/stats/{index}')
async def index_stats(index: str):
    """
    Get index statistics.
    """
    search_service = SearchService()
    stats = await search_service.get_index_stats(index)
    return stats
