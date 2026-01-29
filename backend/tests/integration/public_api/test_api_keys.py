import uuid
from datetime import datetime, timedelta

import pytest

from backend.services.api_key_service import ApiKeyService
from core.infrastructure.database import get_db


@pytest.fixture
def api_key_service():
    return ApiKeyService()


@pytest.fixture
def test_user_id():
    return str(uuid.uuid4())


class TestApiKeyService:
    def test_generate_api_key(self, api_key_service, test_user_id):
        # Mock DB insert
        api_key_service.db = MockDB()

        response = api_key_service.generate_api_key(
            user_id=test_user_id, name="Test Key", scopes=["read:subscriptions"]
        )

        assert response.name == "Test Key"
        assert response.key.startswith("aky_live_")
        assert len(response.key) > 20
        assert "read:subscriptions" in response.scopes
        assert str(response.user_id) == test_user_id

    def test_verify_api_key(self, api_key_service, test_user_id):
        # 1. Generate real key
        # We need a real-ish DB mock for verify to work because it queries by prefix
        mock_db = MockDB()
        api_key_service.db = mock_db

        # Create key
        created = api_key_service.generate_api_key(test_user_id, "Verify Key")
        full_key = created.key

        # 2. Verify
        # The mock DB needs to return the record when searched by prefix
        record = api_key_service.verify_api_key(full_key)

        assert record is not None
        assert record["id"] == str(created.id)
        assert record["name"] == "Verify Key"

    def test_verify_invalid_key(self, api_key_service):
        api_key_service.db = MockDB()
        record = api_key_service.verify_api_key("invalid_key_format")
        assert record is None

        record = api_key_service.verify_api_key("aky_live_wronglength")
        assert record is None

    def test_revoke_api_key(self, api_key_service, test_user_id):
        mock_db = MockDB()
        api_key_service.db = mock_db

        created = api_key_service.generate_api_key(test_user_id, "To Revoke")

        success = api_key_service.revoke_api_key(str(created.id), test_user_id)
        assert success is True

        # Verify it's revoked in "DB"
        assert mock_db.data["api_keys"][0]["status"] == "revoked"


# Minimal Mock DB for testing Service logic without real DB
import bcrypt


class MockDB:
    def __init__(self):
        self.data = {"api_keys": [], "api_usage": []}

    def table(self, name):
        self.current_table = name
        return self

    def insert(self, data):
        self.pending_insert = data
        return self

    def select(self, cols):
        return self

    def eq(self, col, val):
        # Very simple filtering for test purposes
        if self.current_table == "api_keys":
            if col == "prefix":
                self.filtered = [
                    r
                    for r in self.data["api_keys"]
                    if r["prefix"] == val and r["status"] == "active"
                ]
            elif col == "id":
                self.filtered = [r for r in self.data["api_keys"] if r["id"] == str(val)]
            elif col == "user_id":
                # If we already filtered by ID, filter that result
                if hasattr(self, "filtered"):
                    self.filtered = [r for r in self.filtered if r["user_id"] == val]
                else:
                    self.filtered = [r for r in self.data["api_keys"] if r["user_id"] == val]
        return self

    def neq(self, col, val):
        return self

    def update(self, data):
        self.update_data = data
        return self

    def execute(self):
        if hasattr(self, "pending_insert"):
            # Simulate insert returning data with ID
            from uuid import uuid4

            record = self.pending_insert.copy()
            record["id"] = str(uuid4())
            self.data[self.current_table].append(record)

            # Reset
            del self.pending_insert

            class Result:
                data = [record]

            return Result()

        if hasattr(self, "update_data") and hasattr(self, "filtered"):
            updated = []
            for r in self.filtered:
                r.update(self.update_data)
                updated.append(r)

            class Result:
                data = updated

            return Result()

        if hasattr(self, "filtered"):
            res = self.filtered
            # Reset
            del self.filtered

            class Result:
                data = res

            return Result()

        return self
