"""
Search Indexer Service
======================

Manages index creation, configuration, and document updates.
"""

import logging
from typing import Any, Dict, List, Optional

from meilisearch.errors import MeilisearchError

from backend.services.search.config import INDEXES, IndexConfig
from backend.services.search.meilisearch_client import get_meilisearch_client

logger = logging.getLogger(__name__)

class SearchIndexer:
    """
    Service to handle indexing operations.
    """
    def __init__(self):
        self.client = get_meilisearch_client().client

    def create_index(self, index_name: str) -> None:
        """Create an index if it doesn't exist and configure it."""
        if index_name not in INDEXES:
            raise ValueError(f"Unknown index: {index_name}")

        config: IndexConfig = INDEXES[index_name]

        try:
            # Create index (get_or_create logic)
            self.client.create_index(config.name, {'primaryKey': config.primary_key})

            # Update settings
            index = self.client.index(config.name)
            task = index.update_settings(config.to_settings())
            logger.info(f"Updated settings for index '{index_name}'. Task UID: {task.task_uid}")

        except MeilisearchError as e:
            logger.error(f"Error creating/updating index '{index_name}': {e}")
            raise

    def initialize_all_indexes(self) -> None:
        """Initialize all defined indexes."""
        for name in INDEXES:
            try:
                self.create_index(name)
            except Exception as e:
                logger.error(f"Failed to initialize index {name}: {e}")

    def add_documents(self, index_name: str, documents: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Add or update documents in an index."""
        if not documents:
            return {"status": "skipped", "message": "No documents provided"}

        try:
            index = self.client.index(index_name)
            task = index.add_documents(documents)
            logger.info(f"Added {len(documents)} docs to '{index_name}'. Task UID: {task.task_uid}")
            return {"task_uid": task.task_uid, "status": "enqueued"}
        except MeilisearchError as e:
            logger.error(f"Error adding documents to '{index_name}': {e}")
            raise

    def update_documents(self, index_name: str, documents: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Update documents (partial update) in an index."""
        if not documents:
            return {"status": "skipped", "message": "No documents provided"}

        try:
            index = self.client.index(index_name)
            task = index.update_documents(documents)
            logger.info(f"Updated {len(documents)} docs in '{index_name}'. Task UID: {task.task_uid}")
            return {"task_uid": task.task_uid, "status": "enqueued"}
        except MeilisearchError as e:
            logger.error(f"Error updating documents in '{index_name}': {e}")
            raise

    def delete_document(self, index_name: str, document_id: str) -> Dict[str, Any]:
        """Delete a single document by ID."""
        try:
            index = self.client.index(index_name)
            task = index.delete_document(document_id)
            logger.info(f"Deleted doc {document_id} from '{index_name}'. Task UID: {task.task_uid}")
            return {"task_uid": task.task_uid, "status": "enqueued"}
        except MeilisearchError as e:
            logger.error(f"Error deleting document {document_id} from '{index_name}': {e}")
            raise

    def delete_documents(self, index_name: str, document_ids: List[str]) -> Dict[str, Any]:
        """Delete multiple documents by ID."""
        if not document_ids:
            return {"status": "skipped", "message": "No IDs provided"}

        try:
            index = self.client.index(index_name)
            task = index.delete_documents(document_ids)
            logger.info(f"Deleted {len(document_ids)} docs from '{index_name}'. Task UID: {task.task_uid}")
            return {"task_uid": task.task_uid, "status": "enqueued"}
        except MeilisearchError as e:
            logger.error(f"Error deleting documents from '{index_name}': {e}")
            raise

    def delete_index(self, index_name: str) -> Dict[str, Any]:
        """Delete an entire index."""
        try:
            task = self.client.delete_index(index_name)
            logger.info(f"Deleted index '{index_name}'. Task UID: {task.task_uid}")
            return {"task_uid": task.task_uid, "status": "enqueued"}
        except MeilisearchError as e:
            logger.error(f"Error deleting index '{index_name}': {e}")
            raise

    def get_task_status(self, task_uid: int) -> Dict[str, Any]:
        """Get the status of an asynchronous task."""
        try:
            task = self.client.get_task(task_uid)
            return {
                "uid": task.uid,
                "index_uid": task.index_uid,
                "status": task.status,
                "type": task.type,
                "duration": task.duration,
                "enqueued_at": str(task.enqueued_at),
                "started_at": str(task.started_at) if task.started_at else None,
                "finished_at": str(task.finished_at) if task.finished_at else None,
                "error": task.error
            }
        except MeilisearchError as e:
            logger.error(f"Error getting task {task_uid}: {e}")
            raise

def get_search_indexer() -> SearchIndexer:
    """Dependency provider for SearchIndexer."""
    return SearchIndexer()
