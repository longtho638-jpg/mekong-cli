from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app

# Setup in-memory database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

def setup_module(module):
    Base.metadata.create_all(bind=engine)

def teardown_module(module):
    Base.metadata.drop_all(bind=engine)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to User Preferences API"}

def test_get_preferences_new_user():
    user_id = "test_user_1"
    response = client.get(f"/api/preferences/{user_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["user_id"] == user_id
    assert data["theme"] == "system"  # Default
    assert data["language"] == "en"   # Default

def test_update_preferences():
    user_id = "test_user_2"
    # First ensure user exists (or update should create if implemented that way,
    # but strictly PUT usually updates. Our implementation creates if not exists in PUT too)

    update_data = {
        "theme": "dark",
        "language": "es",
        "email_notifications": False
    }
    response = client.put(f"/api/preferences/{user_id}", json=update_data)
    assert response.status_code == 200
    data = response.json()
    assert data["user_id"] == user_id
    assert data["theme"] == "dark"
    assert data["language"] == "es"
    assert data["email_notifications"] is False
    assert data["push_notifications"] is True # Should remain default

    # Verify persistence
    get_response = client.get(f"/api/preferences/{user_id}")
    assert get_response.json()["theme"] == "dark"

def test_partial_update():
    user_id = "test_user_3"
    # Create initial
    client.put(f"/api/preferences/{user_id}", json={"theme": "light"})

    # Partial update
    response = client.put(f"/api/preferences/{user_id}", json={"profile_visibility": "private"})
    assert response.status_code == 200
    data = response.json()
    assert data["theme"] == "light" # Should not change
    assert data["profile_visibility"] == "private"
