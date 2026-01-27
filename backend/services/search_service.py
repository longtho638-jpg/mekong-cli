import os
from typing import Any, Dict, List, Literal, Optional

from backend.services.algolia_service import AlgoliaService
from backend.services.meilisearch_service import MeilisearchService

SearchProvider = Literal['algolia', 'meilisearch']

class SearchService:
    """
    Abstraction layer for search engines.
    Binh Pháp Ch.9: Discipline in execution - consistent interface regardless of provider.
    """
    def __init__(self, provider: Optional[SearchProvider] = None):
        self.provider = provider or os.getenv('SEARCH_PROVIDER', 'meilisearch')
        if self.provider == 'algolia':
            self.engine = AlgoliaService()
        else:
            self.engine = MeilisearchService()

    async def search(
        self,
        query: str,
        indexes: List[str],
        filters: Optional[Dict] = None,
        limit: int = 20,
        offset: int = 0,
    ) -> Dict[str, Any]:
        """
        Unified search across multiple indexes.

        Args:
            query: Search query string
            indexes: List of index names to search (e.g., ['users', 'transactions'])
            filters: Facet filters (e.g., {'status': 'active', 'type': 'payment'})
            limit: Max results per index
            offset: Pagination offset

        Returns:
            {
                'results': {
                    'users': [...],
                    'transactions': [...],
                },
                'total': 123,
                'query_time_ms': 45,
            }
        """
        return await self.engine.multi_index_search(query, indexes, filters, limit, offset)

    async def autocomplete(self, query: str, index: str, limit: int = 5) -> List[str]:
        """
        Instant autocomplete suggestions (<100ms target).
        """
        return await self.engine.autocomplete(query, index, limit)

    async def index_document(self, index: str, document: Dict):
        """
        Index a single document (real-time).
        Called from entity lifecycle hooks (create/update).
        """
        await self.engine.add_documents(index, [document])

    async def delete_document(self, index: str, document_id: str):
        """
        Delete document from index (real-time).
        Called from entity delete hooks.
        """
        await self.engine.delete_document(index, document_id)

    async def batch_index(self, index: str, documents: List[Dict]):
        """
        Batch indexing for initial sync or reindexing.
        """
        await self.engine.add_documents(index, documents)

    async def get_index_stats(self, index: str) -> Dict[str, Any]:
        """
        Get index statistics (document count, size, last update).
        """
        return await self.engine.get_stats(index)
