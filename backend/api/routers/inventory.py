from typing import List

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/inventory", tags=["inventory"])

class Product(BaseModel):
    id: str
    name: str
    quantity: int
    price: float

@router.get("/products")
async def list_products() -> List[Product]:
    """List inventory products"""
    return []

@router.post("/products")
async def create_product(product: Product) -> Product:
    """Add product to inventory"""
    return product
