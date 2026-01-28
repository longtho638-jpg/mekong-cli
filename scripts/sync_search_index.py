#!/usr/bin/env python3
"""
Script to sync database data to Meilisearch index.
Usage: python scripts/sync_search_index.py [--index all|products|users]
"""

import argparse
import asyncio
import logging
import os
import sys

# Add project root to path
sys.path.append(os.getcwd())

from backend.services.search.config import INDEXES
from backend.services.search.indexer import get_search_indexer

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("sync_search_index")

async def sync_products(indexer):
    """Sync products to Meilisearch."""
    logger.info("Syncing products...")

    # In a real app, fetch from DB
    # from backend.services.inventory_service import get_all_products
    # products = await get_all_products()

    # Mock data for demonstration
    products = [
        {
            "id": "prod_001",
            "title": "High-Performance Laptop",
            "description": "Latest gen processor, 32GB RAM, 1TB SSD.",
            "price": 1299.99,
            "sku": "LAP-001",
            "tags": ["electronics", "computers", "premium"],
            "status": "active",
            "created_at": 1700000000
        },
        {
            "id": "prod_002",
            "title": "Wireless Noise-Canceling Headphones",
            "description": "Industry leading noise cancellation.",
            "price": 349.50,
            "sku": "AUD-002",
            "tags": ["electronics", "audio", "wireless"],
            "status": "active",
            "created_at": 1700000100
        },
        {
            "id": "prod_003",
            "title": "Ergonomic Office Chair",
            "description": "Comfortable chair for long work hours.",
            "price": 299.00,
            "sku": "FUR-003",
            "tags": ["furniture", "office"],
            "status": "active",
            "created_at": 1700000200
        },
        {
            "id": "prod_004",
            "title": "Mechanical Keyboard",
            "description": "RGB Backlit, Cherry MX Blue switches.",
            "price": 120.00,
            "sku": "ACC-004",
            "tags": ["electronics", "accessories", "gaming"],
            "status": "active",
            "created_at": 1700000300
        },
        {
            "id": "prod_005",
            "title": "4K Monitor 27-inch",
            "description": "IPS Panel, 144Hz refresh rate.",
            "price": 450.00,
            "sku": "DIS-005",
            "tags": ["electronics", "display", "gaming"],
            "status": "out_of_stock",
            "created_at": 1700000400
        }
    ]

    try:
        result = await indexer.update_documents("products", products)
        logger.info(f"Synced {len(products)} products. Task UID: {result.get('taskUid')}")
    except Exception as e:
        logger.error(f"Failed to sync products: {e}")

async def sync_users(indexer):
    """Sync users to Meilisearch."""
    logger.info("Syncing users...")

    # Mock data
    users = [
        {
            "id": "user_001",
            "name": "Admin User",
            "email": "admin@example.com",
            "role": "admin",
            "is_active": True,
            "created_at": 1600000000
        },
        {
            "id": "user_002",
            "name": "John Doe",
            "email": "john@example.com",
            "role": "user",
            "is_active": True,
            "created_at": 1600000100
        },
        {
            "id": "user_003",
            "name": "Jane Smith",
            "email": "jane@example.com",
            "role": "user",
            "is_active": False,
            "created_at": 1600000200
        }
    ]

    try:
        result = await indexer.update_documents("users", users)
        logger.info(f"Synced {len(users)} users. Task UID: {result.get('taskUid')}")
    except Exception as e:
        logger.error(f"Failed to sync users: {e}")

async def main():
    parser = argparse.ArgumentParser(description="Sync data to Meilisearch")
    parser.add_argument("--index", default="all", help="Index to sync (all, products, users)")
    args = parser.parse_args()

    indexer = get_search_indexer()

    # Ensure indexes exist
    logger.info("Verifying indexes...")
    for name in INDEXES:
        try:
            await indexer.create_index(name)
        except Exception as e:
            logger.warning(f"Error creating/checking index {name}: {e}")

    if args.index == "all" or args.index == "products":
        await sync_products(indexer)

    if args.index == "all" or args.index == "users":
        await sync_users(indexer)

    logger.info("Sync completed.")

if __name__ == "__main__":
    asyncio.run(main())
