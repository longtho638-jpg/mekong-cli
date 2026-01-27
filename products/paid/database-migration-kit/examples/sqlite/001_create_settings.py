from sqlalchemy import text

def up(connection):
    # SQLite specific DDL
    connection.execute(text("""
        CREATE TABLE settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """))

def down(connection):
    connection.execute(text("DROP TABLE settings"))
