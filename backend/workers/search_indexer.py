import asyncio
import logging
from typing import Any, Dict

from backend.services.search.config import INDEXES
from backend.services.search.indexer import get_search_indexer
from backend.workers.worker_base import BaseWorker

logger = logging.getLogger(__name__)


def search_index_handler(payload: Dict[str, Any]):
    """
    Handler for 'search_indexing' jobs.
    """
    action = payload.get("action")
    index = payload.get("index")
    document = payload.get("document")
    document_id = payload.get("document_id")

    logger.info(f"Starting search index job: Action={action}, Index={index}")

    if index not in INDEXES:
        logger.warning(f"Unknown index: {index}. Skipping.")
        return {"status": "skipped", "reason": "unknown_index"}

    indexer = get_search_indexer()

    try:
        if action == "index":
            if document:
                # Wrap in list as add_documents expects a list
                result = indexer.add_documents(index, [document])
                logger.info(
                    f"Indexed document {document.get('id')} in {index}. Task UID: {result.get('task_uid')}"
                )
            else:
                logger.warning("Index action requires 'document' payload")
        elif action == "delete":
            if document_id:
                result = indexer.delete_document(index, document_id)
                logger.info(
                    f"Deleted document {document_id} from {index}. Task UID: {result.get('task_uid')}"
                )
            else:
                logger.warning("Delete action requires 'document_id' payload")
        elif action == "update":
            if document:
                result = indexer.update_documents(index, [document])
                logger.info(
                    f"Updated document {document.get('id')} in {index}. Task UID: {result.get('task_uid')}"
                )
            else:
                logger.warning("Update action requires 'document' payload")
        else:
            logger.warning(f"Unknown action: {action}")

        return {"status": "completed", "action": action, "index": index}

    except Exception as e:
        logger.error(f"Failed to process search index job: {str(e)}")
        # Re-raise to ensure worker marks job as failed/retries if configured
        raise


if __name__ == "__main__":
    worker = BaseWorker(
        queues=["normal"],  # Search indexing is usually normal priority
        worker_id="search-indexer",
    )
    worker.register_handler("search_indexing", search_index_handler)
    worker.start()
