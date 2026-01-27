from sqlalchemy import text

def up(connection):
    # PostgreSQL specific DDL with JSONB
    connection.execute(text("""
        CREATE TABLE products (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            attributes JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
    """))
    connection.execute(text("CREATE INDEX idx_products_attributes ON products USING GIN (attributes)"))

def down(connection):
    connection.execute(text("DROP TABLE products"))
