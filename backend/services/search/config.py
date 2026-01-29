"""
Search Configuration
====================

Definitions for search indexes and their settings.
"""

from typing import Any, Dict, List


class IndexConfig:
    """Configuration for a Meilisearch index."""

    def __init__(
        self,
        name: str,
        primary_key: str = "id",
        searchable_attributes: List[str] = None,
        filterable_attributes: List[str] = None,
        sortable_attributes: List[str] = None,
        ranking_rules: List[str] = None,
    ):
        self.name = name
        self.primary_key = primary_key
        self.searchable_attributes = searchable_attributes or ["*"]
        self.filterable_attributes = filterable_attributes or []
        self.sortable_attributes = sortable_attributes or []
        self.ranking_rules = ranking_rules or [
            "words",
            "typo",
            "proximity",
            "attribute",
            "sort",
            "exactness",
        ]

    def to_settings(self) -> Dict[str, Any]:
        """Convert to Meilisearch settings dictionary."""
        return {
            "searchableAttributes": self.searchable_attributes,
            "filterableAttributes": self.filterable_attributes,
            "sortableAttributes": self.sortable_attributes,
            "rankingRules": self.ranking_rules,
        }


# Define indexes for the application
INDEXES = {
    "users": IndexConfig(
        name="users",
        primary_key="id",
        searchable_attributes=["name", "email", "role"],
        filterable_attributes=["role", "is_active", "created_at"],
        sortable_attributes=["created_at", "name"],
    ),
    "products": IndexConfig(
        name="products",
        primary_key="id",
        searchable_attributes=["title", "description", "sku", "tags"],
        filterable_attributes=["price", "status", "tags", "created_at"],
        sortable_attributes=["price", "created_at", "title"],
    ),
    "documents": IndexConfig(
        name="documents",
        primary_key="id",
        searchable_attributes=["title", "content", "metadata"],
        filterable_attributes=["type", "author_id", "created_at"],
        sortable_attributes=["created_at", "title"],
    ),
    "transactions": IndexConfig(
        name="transactions",
        primary_key="id",
        searchable_attributes=["invoice_number", "customer_name", "customer_email"],
        filterable_attributes=["status", "amount", "currency", "date"],
        sortable_attributes=["date", "amount"],
    ),
    "logs": IndexConfig(
        name="logs",
        primary_key="id",
        searchable_attributes=["message", "error_type", "path"],
        filterable_attributes=["level", "service", "timestamp", "user_id"],
        sortable_attributes=["timestamp"],
    ),
}
