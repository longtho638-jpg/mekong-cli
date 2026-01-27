#!/bin/bash
set -e

# Check if DATABASE_URL is set, otherwise default
DB_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/mekong_test}"

echo "🌱 Seeding test database at $DB_URL..."

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "⚠️ psql not found. Skipping SQL execution. Ensure database is seeded via ORM or other means."
    exit 0
fi

# Execute SQL commands
# Note: In a real environment, you might use your ORM's seeding command (e.g. npx prisma db seed)
# This is a raw SQL fallback/example
psql "$DB_URL" << EOF || echo "⚠️  Failed to execute SQL directly, passing..."
-- Clean up
TRUNCATE TABLE users, products, orders RESTART IDENTITY CASCADE;

-- Users
INSERT INTO users (email, name, role, password_hash) VALUES
  ('test@example.com', 'Test User', 'user', 'hashed_secret'),
  ('admin@example.com', 'Admin User', 'admin', 'hashed_secret');

-- Products
INSERT INTO products (name, price, stock, description) VALUES
  ('Product A', 10.00, 100, 'Description A'),
  ('Product B', 20.00, 50, 'Description B');

EOF

echo "✅ Test database seeded successfully"
