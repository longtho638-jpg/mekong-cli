---
description: 📦 INVENTORY - Manage products, stock, and search indexing
---

# /inventory - Inventory Management Command

> **"Hàng hoá lưu thông"** - Flow of Goods

## Usage

```bash
/inventory [action] [args]
```

## Actions

| Action | Description | Example |
|--------|-------------|---------|
| `check` | Check stock levels | `/inventory check --sku PROD-001` |
| `index` | Force re-index search engine | `/inventory index --all` |
| `update` | Update product metadata | `/inventory update --id 123 --price 99.99` |
| `low-stock` | List items below threshold | `/inventory low-stock` |

## Execution Protocol

1.  **Agent**: Delegates to `inventory-manager`.
2.  **Tool**: Uses `InventoryRouter` and `QueueService`.
3.  **Sync**: Triggers search re-indexing on updates.

## Examples

```bash
# Re-index all products to MeiliSearch
/inventory index --all

# Check for items needing re-stock
/inventory low-stock --threshold 10
```

## Win-Win-Win
- **Owner**: No lost sales due to OOS.
- **Agency**: Efficient catalog management.
- **Client**: Accurate product availability.
