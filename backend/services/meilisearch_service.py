import os
from typing import Any, Dict, List, Optional

import meilisearch


class MeilisearchService:
    def __init__(self):
        url = os.getenv('MEILISEARCH_URL', 'http://localhost:7700')
        api_key = os.getenv('MEILISEARCH_API_KEY')
        self.client = meilisearch.Client(url, api_key)

    async def multi_index_search(self, query: str, indexes: List[str], filters: Optional[Dict], limit: int, offset: int) -> Dict[str, Any]:
        results = {}
        total = 0
        query_time_ms = 0

        for idx in indexes:
            # Meilisearch python client is sync.
            try:
                index = self.client.index(idx)
                search_params = {
                    'limit': limit,
                    'offset': offset,
                }
                if filters:
                    search_params['filter'] = self._build_meilisearch_filters(filters)

                result = index.search(query, search_params)
                results[idx] = result['hits']
                total += result.get('estimatedTotalHits', 0)
                query_time_ms += result.get('processingTimeMs', 0)
            except Exception as e:
                # Log error?
                results[idx] = []
                print(f"Error searching index {idx}: {e}")

        return {
            'results': results,
            'total': total,
            'query_time_ms': query_time_ms,
        }

    async def autocomplete(self, query: str, index_name: str, limit: int) -> List[str]:
        try:
            index = self.client.index(index_name)
            results = index.search(query, {'limit': limit, 'attributesToRetrieve': ['title', 'name']})
            return [hit.get('title') or hit.get('name') for hit in results['hits']]
        except Exception:
            return []

    async def add_documents(self, index_name: str, documents: List[Dict]):
        try:
            index = self.client.index(index_name)
            index.add_documents(documents)
        except Exception as e:
            print(f"Error adding documents to {index_name}: {e}")

    async def delete_document(self, index_name: str, document_id: str):
        try:
            index = self.client.index(index_name)
            index.delete_document(document_id)
        except Exception as e:
            print(f"Error deleting document from {index_name}: {e}")

    async def get_stats(self, index_name: str) -> Dict[str, Any]:
        try:
            index = self.client.index(index_name)
            stats = index.get_stats()
            return {
                'provider': 'meilisearch',
                'document_count': stats.number_of_documents,
                'is_indexing': stats.is_indexing,
            }
        except Exception:
             return {
                'provider': 'meilisearch',
                'document_count': 0,
                'is_indexing': False,
            }

    def _build_meilisearch_filters(self, filters: Dict) -> str:
        """
        Convert dict to Meilisearch filter string.
        Example: {'status': 'active', 'type': 'payment'} -> 'status = "active" AND type = "payment"'
        """
        return ' AND '.join(f'{k} = "{v}"' for k, v in filters.items())

    async def configure_index(self, index_name: str, config: Dict):
        """
        Configure index settings: searchable attributes, ranking rules, synonyms.
        """
        try:
            index = self.client.index(index_name)

            # Searchable attributes (priority order)
            if 'searchable_attributes' in config:
                index.update_searchable_attributes(config['searchable_attributes'])

            # Ranking rules
            if 'ranking_rules' in config:
                index.update_ranking_rules(config['ranking_rules'])

            # Faceted attributes
            if 'faceted_attributes' in config:
                index.update_filterable_attributes(config['faceted_attributes'])

            # Synonyms
            if 'synonyms' in config:
                index.update_synonyms(config['synonyms'])

            # Stop words
            if 'stop_words' in config:
                index.update_stop_words(config['stop_words'])
        except Exception as e:
            print(f"Error configuring index {index_name}: {e}")
