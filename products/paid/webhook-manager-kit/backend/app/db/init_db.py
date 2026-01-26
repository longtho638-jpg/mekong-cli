from app.db.session import engine
from app.db.base_class import Base
# Import all models so they are registered with Base
from app.models.webhook import WebhookEndpoint, WebhookEvent, WebhookDelivery

def init_db():
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created!")

if __name__ == "__main__":
    init_db()
