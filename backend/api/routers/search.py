import json
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from backend.services.search.analytics import SearchAnalyticsService, get_search_analytics
from backend.services.search.config import INDEXES
from backend.services.search.indexer import SearchIndexer, get_search_indexer
from backend.services.search.service import SearchService, get_search_service

router = APIRouter(prefix='/search', tags=['Search'])

@router.get('/')
async def search(
    q: str = Query(..., min_length=1),
    indexes: Optional[List[str]] = Query(None),
    filters: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
    search_service: SearchService = Depends(get_search_service),
    analytics_service: SearchAnalyticsService = Depends(get_search_analytics)
):
    """
    Full-text search across multiple indexes.

    Query params:
    - q: Search query string
    - indexes: List of indexes to search (default: all)
    - filters: Filter expression (e.g., 'status = active')
    - limit: Max results per index
    - offset: Pagination offset
    """
    target_indexes = indexes if indexes else list(INDEXES.keys())

    results = search_service.search(
        query=q,
        indexes=target_indexes,
        filters=filters,
        limit=limit,
        offset=offset
    )

    # Log analytics (async)
    # Note: For strict performance, this should be a background task
    # But for simplicity in implementation we call it here.
    # The service method itself can spawn a task if needed, but it's currently just an await call.
    # Ideally: background_tasks.add_task(analytics_service.log_search, q, results['total'])
    # Since we depend on async execution, let's just await it quickly as it is Redis op.
    await analytics_service.log_search(q, results.get('total', 0))

    return results

@router.get('/autocomplete')
async def autocomplete(
    q: str = Query(..., min_length=1),
    index: str = 'users',
    limit: int = 5,
    search_service: SearchService = Depends(get_search_service)
):
    """
    Instant autocomplete suggestions (<100ms).
    """
    suggestions = search_service.autocomplete(q, index, limit)
    return {'suggestions': suggestions}

@router.get('/analytics/top-queries')
async def top_queries(
    limit: int = 10,
    analytics_service: SearchAnalyticsService = Depends(get_search_analytics)
):
    """
    Get top popular search queries.
    """
    return await analytics_service.get_top_queries(limit)

@router.get('/analytics/no-results')
async def no_results(
    limit: int = 10,
    analytics_service: SearchAnalyticsService = Depends(get_search_analytics)
):
    """
    Get top queries that returned no results.
    """
    return await analytics_service.get_no_result_queries(limit)

@router.post('/reindex/{index}')
async def reindex(
    index: str,
    indexer: SearchIndexer = Depends(get_search_indexer)
):
    """
    Admin: Trigger full reindex/initialization of an index.
    """
    if index not in INDEXES:
        raise HTTPException(status_code=404, detail=f"Index '{index}' not defined")

    try:
        # Create/Update index settings
        indexer.create_index(index)
        # Note: Actual data population would happen here or trigger a background task.
        # For now, we just ensure the index exists and has correct settings.
        return {'success': True, 'message': f'Index {index} configured successfully'}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get('/stats/{index}')
async def index_stats(
    index: str,
    search_service: SearchService = Depends(get_search_service)
):
    """
    Get index statistics.
    """
    try:
        stats = search_service.client.index(index).get_stats()
        return {
            "numberOfDocuments": stats.number_of_documents,
            "isIndexing": stats.is_indexing,
            "fieldDistribution": stats.field_distribution
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Stats not available: {str(e)}")
