import sys
from unittest.mock import AsyncMock, MagicMock, Mock, patch

import pytest
from fastapi.testclient import TestClient

# Now we can import app safely (mostly)
from backend.main import app

client = TestClient(app)

# Mock DB or use test DB?
# Ideally use integration test DB setup. For now, assuming environment is setup or mocks used.


class TestAuditMiddleware:
    def test_middleware_logs_request(self):
        # This is hard to test black-box without checking DB side effects.
        # We can mock the audit_service.create_audit_log method.

        with pytest.MonkeyPatch.context() as m:
            from unittest.mock import AsyncMock, MagicMock

            from backend.middleware.audit_middleware import audit_service

            mock_create = AsyncMock()
            m.setattr(audit_service, "create_audit_log", mock_create)

            # 1. Test Health Check (Skipped)
            response = client.get("/health")
            assert response.status_code == 200
            assert not mock_create.called

            # 2. Test Normal Endpoint (Logged)
            # Use a path that triggers the resource_type logic (parts > 1)
            response = client.get("/api/audit-resource-test")
            assert response.status_code == 404

            # Should have called create_audit_log
            assert mock_create.called
            args, kwargs = mock_create.call_args
            assert kwargs["action"] == "api.get"
            assert kwargs["resource_type"] == "audit-resource-test"
            assert kwargs["metadata"]["status_code"] == 404

    @pytest.mark.asyncio
    async def test_middleware_exception_handling(self):
        # Unit test the middleware directly to verify exception handling logic
        from starlette.types import Receive, Scope, Send

        from backend.middleware.audit_middleware import AuditMiddleware, audit_service

        # Mock app (not used in dispatch but needed for init)
        mock_app = Mock()
        middleware = AuditMiddleware(mock_app)

        # Mock request
        # scope = {"type": "http", "path": "/error-endpoint", "method": "GET", "query_string": b"", "headers": []}
        request = Mock()
        request.url.path = "/error-endpoint"
        request.method = "GET"
        request.query_params = {}
        request.client.host = "127.0.0.1"
        request.headers = {}
        request.state = Mock()

        # Mock call_next to raise exception
        async def mock_call_next(req):
            raise ValueError("Intentional Error")

        # Mock DB logging
        mock_create = AsyncMock()
        with pytest.MonkeyPatch.context() as m:
            m.setattr(audit_service, "create_audit_log", mock_create)

            # Expect exception to be re-raised
            with pytest.raises(ValueError):
                await middleware.dispatch(request, mock_call_next)

            # Verify logging happened with 500
            assert mock_create.called
            args, kwargs = mock_create.call_args
            assert kwargs["metadata"]["status_code"] == 500
            assert (
                kwargs["resource_type"] == "api_endpoint"
            )  # /error-endpoint -> split -> ['error-endpoint'] -> len 1

    def test_middleware_db_failure(self):
        # Test that if DB log fails, request still succeeds
        with pytest.MonkeyPatch.context() as m:
            from unittest.mock import AsyncMock

            from backend.middleware.audit_middleware import audit_service

            mock_create = AsyncMock(side_effect=Exception("DB Down"))
            m.setattr(audit_service, "create_audit_log", mock_create)

            response = client.get("/not-found-endpoint")
            # Should still return response, not crash
            assert response.status_code == 404
            assert mock_create.called
