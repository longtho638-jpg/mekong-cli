from typing import List

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from backend.services.cache.decorators import cache
from backend.services.queue_service import QueueService

router = APIRouter(prefix="/api/v1/inventory", tags=["inventory"])


class Product(BaseModel):
    id: str
    name: str
    quantity: int
    price: float
    description: str = ""
    tags: List[str] = []


def get_queue_service() -> QueueService:
    return QueueService()


@router.get("/products")
@cache(ttl=300, prefix="inventory", key_func=lambda: "products_list", tags=["inventory"])
async def list_products() -> List[Product]:
    """List inventory products"""
    # Simulate DB call
    return []


@router.post("/products")
async def create_product(
    product: Product, queue_service: QueueService = Depends(get_queue_service)
) -> Product:
    """Add product to inventory and index it in search engine"""
    # In a real implementation, we would save to DB here
    # db.add(product)...

    # Trigger search indexing
    # We use the background worker to avoid blocking the API request
    try:
        queue_service.enqueue_job(
            job_type="search_indexing",
            payload={
                "action": "index",
                "index": "products",
                "document": {
                    "id": product.id,
                    "title": product.name,
                    "description": product.description,
                    "price": product.price,
                    "tags": product.tags,
                    "sku": product.id,  # Mapping id to sku for demo
                    "status": "active",
                    "created_at": 1234567890,  # Placeholder
                },
            },
            priority="normal",
        )
    except Exception as e:
        # Log error but don't fail the request
        print(f"Failed to enqueue search indexing job: {e}")

    # Invalidate cache
    # cache.invalidate("inventory:products_list")

    return product


@router.put("/products/{product_id}")
async def update_product(
    product_id: str, product: Product, queue_service: QueueService = Depends(get_queue_service)
) -> Product:
    """Update a product and update index"""
    # Simulate DB update
    # db.update(product)...

    # Ensure ID matches
    product.id = product_id

    try:
        queue_service.enqueue_job(
            job_type="search_indexing",
            payload={
                "action": "update",
                "index": "products",
                "document": {
                    "id": product.id,
                    "title": product.name,
                    "description": product.description,
                    "price": product.price,
                    "tags": product.tags,
                    "sku": product.id,
                    "status": "active",
                    "updated_at": 1234567890,
                },
            },
            priority="normal",
        )
    except Exception as e:
        print(f"Failed to enqueue search indexing job: {e}")

    return product


@router.delete("/products/{product_id}")
async def delete_product(product_id: str, queue_service: QueueService = Depends(get_queue_service)):
    """Delete a product and remove from index"""
    # Simulate DB delete
    # db.delete(product_id)...

    try:
        queue_service.enqueue_job(
            job_type="search_indexing",
            payload={"action": "delete", "index": "products", "document_id": product_id},
            priority="normal",
        )
    except Exception as e:
        print(f"Failed to enqueue search indexing job: {e}")

    return {"status": "deleted", "id": product_id}
