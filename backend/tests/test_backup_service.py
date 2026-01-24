"""
Tests for Backup Service
========================

Comprehensive test suite for database backup and restore functionality.
"""

import json
import os
import sqlite3
import tempfile
from datetime import datetime, timedelta
from pathlib import Path

import pytest

from backend.services.backup_service import (
    BackupConfig,
    BackupService,
    create_backup,
    restore_backup,
    cleanup_old_backups,
    get_backup_service,
)


@pytest.fixture
def temp_dirs():
    """Create temporary directories for testing"""
    with tempfile.TemporaryDirectory() as db_dir, \
         tempfile.TemporaryDirectory() as backup_dir:
        yield {
            "db_dir": db_dir,
            "backup_dir": backup_dir,
        }


@pytest.fixture
def sample_database(temp_dirs):
    """Create a sample SQLite database for testing"""
    db_path = os.path.join(temp_dirs["db_dir"], "test.db")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Create sample tables
    cursor.execute("""
        CREATE TABLE users (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            created_at TEXT
        )
    """)

    cursor.execute("""
        CREATE TABLE orders (
            id INTEGER PRIMARY KEY,
            user_id INTEGER,
            amount REAL,
            status TEXT,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    """)

    # Insert sample data
    cursor.execute(
        "INSERT INTO users (name, email, created_at) VALUES (?, ?, ?)",
        ("John Doe", "john@example.com", datetime.utcnow().isoformat())
    )
    cursor.execute(
        "INSERT INTO users (name, email, created_at) VALUES (?, ?, ?)",
        ("Jane Smith", "jane@example.com", datetime.utcnow().isoformat())
    )

    cursor.execute(
        "INSERT INTO orders (user_id, amount, status) VALUES (?, ?, ?)",
        (1, 99.99, "completed")
    )
    cursor.execute(
        "INSERT INTO orders (user_id, amount, status) VALUES (?, ?, ?)",
        (2, 149.99, "pending")
    )

    conn.commit()
    conn.close()

    yield db_path


@pytest.fixture
def backup_service(temp_dirs, sample_database):
    """Create a backup service instance for testing"""
    config = BackupConfig(
        database_path=sample_database,
        backup_directory=temp_dirs["backup_dir"],
        retention_days=7,
        verify_on_backup=True
    )
    return BackupService(config)


class TestBackupService:
    """Test suite for BackupService"""

    def test_backup_service_initialization(self, backup_service, temp_dirs):
        """Test that backup service initializes correctly"""
        assert backup_service.config.backup_directory == temp_dirs["backup_dir"]
        assert os.path.exists(temp_dirs["backup_dir"])

    def test_create_backup_success(self, backup_service):
        """Test successful backup creation"""
        success, metadata = backup_service.create_backup()

        assert success is True
        assert metadata is not None
        assert metadata.table_count == 2  # users and orders
        assert metadata.record_count == 4  # 2 users + 2 orders
        assert os.path.exists(metadata.backup_path)
        assert metadata.checksum is not None
        assert metadata.verified is True

    def test_backup_file_structure(self, backup_service):
        """Test that backup file has correct JSON structure"""
        success, metadata = backup_service.create_backup()
        assert success is True

        with open(metadata.backup_path, 'r') as f:
            backup_data = json.load(f)

        # Check structure
        assert "metadata" in backup_data
        assert "tables" in backup_data
        assert "users" in backup_data["tables"]
        assert "orders" in backup_data["tables"]

        # Check data
        assert len(backup_data["tables"]["users"]) == 2
        assert len(backup_data["tables"]["orders"]) == 2

    def test_verify_backup_valid(self, backup_service):
        """Test verification of valid backup"""
        success, metadata = backup_service.create_backup()
        assert success is True

        valid, error = backup_service.verify_backup(metadata.backup_path)
        assert valid is True
        assert error is None

    def test_verify_backup_invalid_json(self, backup_service, temp_dirs):
        """Test verification fails for invalid JSON"""
        # Create invalid JSON file
        invalid_path = os.path.join(temp_dirs["backup_dir"], "invalid.json")
        with open(invalid_path, 'w') as f:
            f.write("{ invalid json }")

        valid, error = backup_service.verify_backup(invalid_path)
        assert valid is False
        assert "Invalid JSON" in error

    def test_verify_backup_missing_file(self, backup_service):
        """Test verification fails for missing file"""
        valid, error = backup_service.verify_backup("/nonexistent/backup.json")
        assert valid is False
        assert "not found" in error

    def test_restore_backup_success(self, backup_service, temp_dirs):
        """Test successful restore from backup"""
        # Create backup
        success, metadata = backup_service.create_backup()
        assert success is True

        # Create new target database
        target_db = os.path.join(temp_dirs["db_dir"], "restored.db")

        # Restore
        success, error = backup_service.restore_backup(metadata.backup_path, target_db)
        assert success is True
        assert error is None

        # Verify restored data
        conn = sqlite3.connect(target_db)
        cursor = conn.cursor()

        cursor.execute("SELECT COUNT(*) FROM users")
        assert cursor.fetchone()[0] == 2

        cursor.execute("SELECT COUNT(*) FROM orders")
        assert cursor.fetchone()[0] == 2

        cursor.execute("SELECT name FROM users WHERE id = 1")
        assert cursor.fetchone()[0] == "John Doe"

        conn.close()

    def test_restore_creates_pre_restore_backup(self, backup_service, sample_database):
        """Test that restore creates backup of existing database"""
        # Create backup
        success, metadata = backup_service.create_backup()
        assert success is True

        # Restore to same database
        success, error = backup_service.restore_backup(
            metadata.backup_path,
            sample_database
        )
        assert success is True

        # Check for pre-restore backup
        db_dir = os.path.dirname(sample_database)
        pre_restore_files = [f for f in os.listdir(db_dir) if "pre_restore" in f]
        assert len(pre_restore_files) == 1

    def test_cleanup_old_backups(self, backup_service, temp_dirs):
        """Test cleanup of old backups"""
        # Create multiple backups with different timestamps
        backup_dir = Path(temp_dirs["backup_dir"])

        # Create old backup (9 days ago)
        old_timestamp = datetime.utcnow() - timedelta(days=9)
        old_filename = f"backup_{old_timestamp.strftime('%Y%m%d_%H%M%S')}.json"
        old_path = backup_dir / old_filename
        with open(old_path, 'w') as f:
            json.dump({"metadata": {}, "tables": {}}, f)

        # Create recent backup (3 days ago)
        recent_timestamp = datetime.utcnow() - timedelta(days=3)
        recent_filename = f"backup_{recent_timestamp.strftime('%Y%m%d_%H%M%S')}.json"
        recent_path = backup_dir / recent_filename
        with open(recent_path, 'w') as f:
            json.dump({"metadata": {}, "tables": {}}, f)

        # Create current backup
        backup_service.create_backup()

        # Run cleanup (retention is 7 days)
        deleted_count = backup_service.cleanup_old_backups()

        # Old backup should be deleted, recent ones kept
        assert deleted_count == 1
        assert not old_path.exists()
        assert recent_path.exists()

    def test_list_backups(self, backup_service):
        """Test listing available backups"""
        # Create multiple backups
        backup_service.create_backup()

        backups = backup_service.list_backups()
        assert len(backups) == 1
        assert backups[0].table_count == 2
        assert backups[0].record_count == 4

    def test_get_backup_stats(self, backup_service):
        """Test backup statistics"""
        # Create backup
        backup_service.create_backup()

        stats = backup_service.get_backup_stats()

        assert stats["total_backups"] == 1
        assert stats["total_size_bytes"] > 0
        assert stats["total_size_mb"] >= 0  # Can be 0.0 for very small files
        assert "oldest_backup" in stats
        assert "newest_backup" in stats
        assert stats["retention_days"] == 7

    def test_get_backup_stats_empty(self, backup_service):
        """Test backup statistics with no backups"""
        stats = backup_service.get_backup_stats()

        assert stats["total_backups"] == 0
        assert stats["total_size_bytes"] == 0
        assert stats["oldest_backup"] is None
        assert stats["newest_backup"] is None

    def test_checksum_calculation(self, backup_service):
        """Test checksum calculation"""
        success, metadata = backup_service.create_backup()
        assert success is True

        # Recalculate checksum
        actual_checksum = backup_service._calculate_checksum(metadata.backup_path)
        assert actual_checksum == metadata.checksum

    def test_backup_with_empty_table(self, temp_dirs):
        """Test backup with empty table"""
        # Create database with empty table
        db_path = os.path.join(temp_dirs["db_dir"], "empty.db")
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("CREATE TABLE empty_table (id INTEGER PRIMARY KEY)")
        conn.commit()
        conn.close()

        config = BackupConfig(
            database_path=db_path,
            backup_directory=temp_dirs["backup_dir"]
        )
        service = BackupService(config)

        success, metadata = service.create_backup()
        assert success is True
        assert metadata.table_count == 1
        assert metadata.record_count == 0

    def test_convenience_functions(self, temp_dirs, sample_database):
        """Test convenience functions"""
        config = BackupConfig(
            database_path=sample_database,
            backup_directory=temp_dirs["backup_dir"]
        )

        # Test create_backup
        success, metadata = create_backup(config)
        assert success is True

        # Test cleanup_old_backups
        count = cleanup_old_backups(config)
        assert count >= 0

        # Test restore_backup
        target_db = os.path.join(temp_dirs["db_dir"], "restored.db")
        success, error = restore_backup(metadata.backup_path, config)
        assert success is True

    def test_singleton_service(self):
        """Test that get_backup_service returns singleton"""
        service1 = get_backup_service()
        service2 = get_backup_service()
        assert service1 is service2


class TestBackupConfig:
    """Test backup configuration"""

    def test_default_config(self):
        """Test default configuration values"""
        config = BackupConfig()
        assert config.database_path == "./agencyos.db"
        assert config.backup_directory == "./backups"
        assert config.retention_days == 7
        assert config.enable_compression is False
        assert config.verify_on_backup is True

    def test_custom_config(self):
        """Test custom configuration"""
        config = BackupConfig(
            database_path="/custom/path.db",
            backup_directory="/custom/backups",
            retention_days=14,
            enable_compression=True,
            verify_on_backup=False
        )
        assert config.database_path == "/custom/path.db"
        assert config.backup_directory == "/custom/backups"
        assert config.retention_days == 14
        assert config.enable_compression is True
        assert config.verify_on_backup is False


class TestEdgeCases:
    """Test edge cases and error handling"""

    def test_backup_nonexistent_database(self, temp_dirs):
        """Test backup fails gracefully for nonexistent database"""
        config = BackupConfig(
            database_path="/nonexistent/database.db",
            backup_directory=temp_dirs["backup_dir"]
        )
        service = BackupService(config)

        success, metadata = service.create_backup()
        assert success is False
        assert metadata is None

    def test_restore_corrupted_backup(self, backup_service, temp_dirs):
        """Test restore fails for corrupted backup"""
        # Create corrupted backup
        corrupted_path = os.path.join(temp_dirs["backup_dir"], "corrupted.json")
        with open(corrupted_path, 'w') as f:
            json.dump({"metadata": {}, "tables": {"bad": "data"}}, f)

        success, error = backup_service.restore_backup(corrupted_path)
        assert success is False
        assert error is not None

    def test_metadata_persistence(self, backup_service):
        """Test that metadata is saved and can be loaded"""
        success, metadata = backup_service.create_backup()
        assert success is True

        # Check metadata file exists
        meta_path = metadata.backup_path + ".meta"
        assert os.path.exists(meta_path)

        # Load and verify metadata
        with open(meta_path, 'r') as f:
            loaded_meta = json.load(f)

        assert loaded_meta["checksum"] == metadata.checksum
        assert loaded_meta["table_count"] == metadata.table_count


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
