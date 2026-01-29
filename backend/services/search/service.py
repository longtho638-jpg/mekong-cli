"""
Search Service Facade
=====================

High-level interface for search operations.
Unifies Indexer, QueryBuilder, and Client.
"""

from typing import Any, Dict, List, Optional

from backend.services.search.config import INDEXES
from backend.services.search.meilisearch_client import get_meilisearch_client
from backend.services.search.query_builder import build_search_params


class SearchService:
    """
    Main entry point for search operations.
    """

    def __init__(self):
        self.client = get_meilisearch_client().client

    def search(
        self,
        query: str,
        indexes: List[str],
        filters: Optional[str] = None,
        limit: int = 20,
        offset: int = 0,
        facets: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Search across multiple indexes.
        """
        results = {}
        total_hits = 0
        processing_time_ms = 0

        # Validate indexes
        valid_indexes = [idx for idx in indexes if idx in INDEXES]
        if not valid_indexes:
            # Fallback to all if none specified or all invalid?
            # Or just return empty? Let's return empty for safety.
            return {"results": {}, "total": 0, "query_time_ms": 0}

        search_params = build_search_params(
            query=query, offset=offset, limit=limit, filters=filters, facets=facets
        )

        # Meilisearch Multi-Search would be better here if supported by the python client easily
        # but iterating is fine for a start.
        # Meilisearch 1.1+ supports multi-search.

        # Let's try to use multi-search if available in the library version,
        # otherwise fallback to loop.
        try:
            # Construct multi-search query
            queries = []
            for index_uid in valid_indexes:
                queries.append({"indexUid": index_uid, "q": query, **search_params})

            response = self.client.multi_search(queries)

            for i, result in enumerate(response["results"]):
                index_name = result["indexUid"]
                results[index_name] = result["hits"]
                total_hits += result.get("estimatedTotalHits", 0)
                processing_time_ms += result.get("processingTimeMs", 0)

        except (AttributeError, Exception):
            # Fallback to sequential search
            for index_name in valid_indexes:
                try:
                    index = self.client.index(index_name)
                    result = index.search(query, search_params)
                    results[index_name] = result["hits"]
                    total_hits += result.get("estimatedTotalHits", 0)
                    processing_time_ms += result.get("processingTimeMs", 0)
                except Exception:
                    results[index_name] = []

        return {"results": results, "total": total_hits, "query_time_ms": processing_time_ms}

    def autocomplete(self, query: str, index: str, limit: int = 5) -> List[str]:
        """
        Get autocomplete suggestions.
        """
        if index not in INDEXES:
            return []

        try:
            index_obj = self.client.index(index)
            # Use search parameters optimized for autocomplete
            params = {
                "limit": limit,
                "attributesToRetrieve": INDEXES[index].searchable_attributes[:2],  # Get top fields
                "attributesToHighlight": [],
                "showMatchesPosition": False,
            }
            result = index_obj.search(query, params)

            # Extract suggestions (simplistic approach: return titles/names)
            suggestions = []
            for hit in result["hits"]:
                # Heuristic to find a displayable string
                for attr in ["title", "name", "email", "message"]:
                    if attr in hit:
                        suggestions.append(hit[attr])
                        break
            return suggestions
        except Exception:
            return []


def get_search_service() -> SearchService:
    """Dependency provider for SearchService."""
    return SearchService()
