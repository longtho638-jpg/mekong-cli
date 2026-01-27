import asyncio
import logging
from typing import Any, Dict

from backend.services.search_service import SearchService
from backend.workers.worker_base import BaseWorker

logger = logging.getLogger(__name__)

def search_index_handler(payload: Dict[str, Any]):
    """
    Handler for 'search_indexing' jobs.
    """
    action = payload.get('action')
    index = payload.get('index')
    document = payload.get('document')
    document_id = payload.get('document_id')

    logger.info(f"Starting search index job: Action={action}, Index={index}")

    async def _execute_async():
        search_service = SearchService()
        if action == 'index':
            if document:
                await search_service.index_document(index, document)
                logger.info(f"Indexed document {document.get('id')} in {index}")
            else:
                logger.warning("Index action requires 'document' payload")
        elif action == 'delete':
            if document_id:
                await search_service.delete_document(index, document_id)
                logger.info(f"Deleted document {document_id} from {index}")
            else:
                logger.warning("Delete action requires 'document_id' payload")
        else:
            logger.warning(f"Unknown action: {action}")

    try:
        asyncio.run(_execute_async())
        return {"status": "completed", "action": action, "index": index}
    except Exception as e:
        logger.error(f"Failed to process search index job: {str(e)}")
        raise

if __name__ == "__main__":
    worker = BaseWorker(
        queues=["normal"], # Search indexing is usually normal priority
        worker_id="search-indexer"
    )
    worker.register_handler("search_indexing", search_index_handler)
    worker.start()
