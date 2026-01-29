import asyncio
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from workers.export_worker import ExportWorker


@pytest.fixture
def mock_dependencies():
    with (
        patch("workers.export_worker.QueueService") as MockQueue,
        patch("workers.export_worker.ExportService") as MockExport,
        patch("workers.export_worker.StorageService") as MockStorage,
        patch("workers.export_worker.get_db") as MockDB,
    ):
        yield {"queue": MockQueue, "export": MockExport, "storage": MockStorage, "db": MockDB}


@pytest.mark.asyncio
async def test_process_job_export(mock_dependencies):
    # Setup
    worker = ExportWorker()

    # Mock QueueService instance
    queue_instance = mock_dependencies["queue"].return_value
    # Mock job data
    mock_job = MagicMock()
    mock_job.type = "export_data"
    mock_job.payload = {
        "export_id": "test-export-id",
        "user_id": "test-user",
        "resource_type": "users",
        "format": "csv",
    }
    queue_instance.get_job.return_value = mock_job

    # Mock ExportService
    export_instance = mock_dependencies["export"].return_value
    mock_file = MagicMock()
    mock_file.getbuffer.return_value.nbytes = 100
    export_instance.export_data.return_value = mock_file

    # Mock StorageService
    storage_instance = mock_dependencies["storage"].return_value
    storage_instance.upload.return_value = "exports/test-user/test-export-id.csv"

    # Mock DB
    db_instance = mock_dependencies["db"].return_value
    # Mock chain: db.table().select()... or db.table().update().eq().execute()
    # Mock fetch data
    db_instance.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [
        {"id": 1}
    ]

    # Execute
    await worker.process_job("job-123")

    # Assertions
    queue_instance.update_job_status.assert_any_call("job-123", "processing")
    queue_instance.update_job_status.assert_any_call("job-123", "completed")

    export_instance.export_data.assert_called_once()
    storage_instance.upload.assert_called_once()

    # Verify DB update calls (rough check)
    assert db_instance.table.called


@pytest.mark.asyncio
async def test_process_job_unknown_type(mock_dependencies):
    worker = ExportWorker()
    queue_instance = mock_dependencies["queue"].return_value

    mock_job = MagicMock()
    mock_job.type = "unknown_type"
    queue_instance.get_job.return_value = mock_job

    await worker.process_job("job-unknown")

    # Should mark completed (or failed, depending on logic, currently logic says completed for unknown to avoid loop)
    queue_instance.update_job_status.assert_any_call("job-unknown", "completed")
