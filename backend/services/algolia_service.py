import os
from typing import Any, Dict, List, Optional

try:
    from algoliasearch.search_client import SearchClient
except ImportError:
    SearchClient = None


class AlgoliaService:
    def __init__(self):
        app_id = os.getenv('ALGOLIA_APP_ID')
        api_key = os.getenv('ALGOLIA_API_KEY')

        if app_id and api_key and SearchClient:
            self.client = SearchClient.create(app_id, api_key)
        else:
            self.client = None
            # Log warning?

    async def multi_index_search(self, query: str, indexes: List[str], filters: Optional[Dict], limit: int, offset: int) -> Dict[str, Any]:
        if not self.client:
            return {'results': {}, 'total': 0, 'query_time_ms': 0}

        queries = [
            {
                'indexName': idx,
                'query': query,
                'params': {
                    'filters': self._build_algolia_filters(filters) if filters else '',
                    'hitsPerPage': limit,
                    'page': offset // limit if limit > 0 else 0,
                },
            }
            for idx in indexes
        ]

        # Algolia python client might be synchronous or async?
        # The library is generally synchronous unless using the async client.
        # But the method signature in the plan is `async`.
        # For now we will run it synchronously as the library is sync default.
        # If we need async, we might need `algoliasearch.search_client.SearchClient` is sync.
        # There is `SearchClient.create` which returns a Sync client.
        # To keep it async compatible, we might wrap it or just run it.
        # FastAPI handles sync/async.

        results = self.client.multiple_queries(queries)

        return {
            'results': {
                r['index']: r['hits']
                for r in results['results']
            },
            'total': sum(r['nbHits'] for r in results['results']),
            'query_time_ms': sum(r['processingTimeMS'] for r in results['results']),
        }

    async def autocomplete(self, query: str, index: str, limit: int) -> List[str]:
        if not self.client:
            return []

        index_obj = self.client.init_index(index)
        results = index_obj.search(query, {'hitsPerPage': limit, 'attributesToRetrieve': ['title', 'name']})
        return [hit.get('title') or hit.get('name') for hit in results['hits']]

    async def add_documents(self, index: str, documents: List[Dict]):
        if not self.client:
            return

        index_obj = self.client.init_index(index)
        index_obj.save_objects(documents, {'autoGenerateObjectIDIfNotExist': True})

    async def delete_document(self, index: str, document_id: str):
        if not self.client:
            return

        index_obj = self.client.init_index(index)
        index_obj.delete_object(document_id)

    async def get_stats(self, index: str) -> Dict[str, Any]:
        return {'provider': 'algolia'}

    def _build_algolia_filters(self, filters: Dict) -> str:
        """
        Convert dict to Algolia filter string.
        Example: {'status': 'active', 'type': 'payment'} -> 'status:active AND type:payment'
        """
        return ' AND '.join(f'{k}:{v}' for k, v in filters.items())
