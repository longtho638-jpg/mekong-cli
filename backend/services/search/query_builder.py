"""
Search Query Builder
====================

Constructs search queries for Meilisearch.
"""

from typing import Any, Dict, List, Optional, Union


class SearchQueryBuilder:
    """
    Builder pattern for constructing Meilisearch queries.
    """

    def __init__(self, query: str):
        self.query = query
        self.params: Dict[str, Any] = {}

    def offset(self, offset: int) -> "SearchQueryBuilder":
        self.params["offset"] = offset
        return self

    def limit(self, limit: int) -> "SearchQueryBuilder":
        self.params["limit"] = limit
        return self

    def filter(self, filter_expression: str) -> "SearchQueryBuilder":
        """
        Add a filter expression.
        Example: 'role = admin AND is_active = true'
        """
        # Note: Meilisearch supports string or list of strings/lists for filters
        # For simplicity, we assume string input here.
        # If calling multiple times, we might want to AND them.
        current_filter = self.params.get("filter")
        if current_filter:
            self.params["filter"] = f"({current_filter}) AND ({filter_expression})"
        else:
            self.params["filter"] = filter_expression
        return self

    def sort(self, sort_attributes: List[str]) -> "SearchQueryBuilder":
        """
        Add sort attributes.
        Example: ['price:asc', 'created_at:desc']
        """
        self.params["sort"] = sort_attributes
        return self

    def facets(self, facets: List[str]) -> "SearchQueryBuilder":
        """
        Request facet distribution.
        """
        self.params["facets"] = facets
        return self

    def attributes_to_retrieve(self, attributes: List[str]) -> "SearchQueryBuilder":
        self.params["attributesToRetrieve"] = attributes
        return self

    def attributes_to_crop(
        self, attributes: List[str], crop_length: int = 10
    ) -> "SearchQueryBuilder":
        self.params["attributesToCrop"] = attributes
        self.params["cropLength"] = crop_length
        return self

    def attributes_to_highlight(self, attributes: List[str]) -> "SearchQueryBuilder":
        self.params["attributesToHighlight"] = attributes
        return self

    def build(self) -> Dict[str, Any]:
        """Return the query parameters dictionary."""
        return self.params


def build_search_params(
    query: str,
    offset: int = 0,
    limit: int = 20,
    filters: Optional[str] = None,
    sort: Optional[List[str]] = None,
    facets: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """Helper function to build search parameters quickly."""
    builder = SearchQueryBuilder(query)
    builder.offset(offset).limit(limit)

    if filters:
        builder.filter(filters)
    if sort:
        builder.sort(sort)
    if facets:
        builder.facets(facets)

    # Default highlighting for better UX
    builder.attributes_to_highlight(["*"])

    return builder.build()
