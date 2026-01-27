from sqlalchemy import text

def run(connection):
    """
    Seed data into the database.
    """
    # Check if table exists first to avoid error in empty db
    # connection.execute(text("INSERT INTO users (name) VALUES ('Alice')"))
    pass
