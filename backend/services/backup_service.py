"""
Automated Backup Service for Agency OS
=======================================

Production-ready backup and restore service with:
1. Daily database export to JSON
2. Configurable backup path
3. Retention policy (7 days)
4. Backup verification (checksum)
5. Restore from backup function

Binh Pháp: "Dùng Cầu" - Data Protection Bridge
"""

import hashlib
import json
import logging
import os
import shutil
import sqlite3
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from pydantic import BaseModel, Field

# Configure logging
logger = logging.getLogger(__name__)


class BackupConfig(BaseModel):
    """Configuration for backup service"""

    database_path: str = Field(
        default="./agencyos.db",
        description="Path to SQLite database file"
    )
    backup_directory: str = Field(
        default="./backups",
        description="Directory to store backups"
    )
    retention_days: int = Field(
        default=7,
        description="Number of days to retain backups"
    )
    enable_compression: bool = Field(
        default=False,
        description="Enable gzip compression for backups"
    )
    verify_on_backup: bool = Field(
        default=True,
        description="Verify backup integrity after creation"
    )


class BackupMetadata(BaseModel):
    """Metadata for a backup"""

    timestamp: str
    database_path: str
    backup_path: str
    checksum: str
    size_bytes: int
    table_count: int
    record_count: int
    compressed: bool = False
    verified: bool = False


class BackupService:
    """
    Automated backup and restore service for SQLite database.

    Features:
    - Export database to JSON format
    - Configurable backup location
    - Automatic retention policy
    - Checksum verification
    - Full restore capability
    """

    def __init__(self, config: Optional[BackupConfig] = None):
        """
        Initialize backup service.

        Args:
            config: Backup configuration (uses defaults if not provided)
        """
        self.config = config or BackupConfig()
        self._ensure_backup_directory()

    def _ensure_backup_directory(self) -> None:
        """Create backup directory if it doesn't exist"""
        Path(self.config.backup_directory).mkdir(parents=True, exist_ok=True)
        logger.info(f"Backup directory ready: {self.config.backup_directory}")

    def _get_backup_filename(self, timestamp: Optional[datetime] = None) -> str:
        """
        Generate backup filename with timestamp.

        Args:
            timestamp: Optional timestamp (defaults to now)

        Returns:
            Backup filename
        """
        ts = timestamp or datetime.utcnow()
        filename = f"backup_{ts.strftime('%Y%m%d_%H%M%S')}.json"
        if self.config.enable_compression:
            filename += ".gz"
        return filename

    def _calculate_checksum(self, file_path: str) -> str:
        """
        Calculate SHA256 checksum of a file.

        Args:
            file_path: Path to file

        Returns:
            Hex string of checksum
        """
        sha256_hash = hashlib.sha256()
        with open(file_path, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()

    def _export_table_to_dict(self, conn: sqlite3.Connection, table_name: str) -> List[Dict[str, Any]]:
        """
        Export a single table to list of dictionaries.

        Args:
            conn: SQLite connection
            table_name: Name of table to export

        Returns:
            List of row dictionaries
        """
        cursor = conn.cursor()

        # Get column names
        cursor.execute(f"PRAGMA table_info({table_name})")
        columns = [col[1] for col in cursor.fetchall()]

        # Get all rows
        cursor.execute(f"SELECT * FROM {table_name}")
        rows = cursor.fetchall()

        # Convert to list of dicts
        return [dict(zip(columns, row)) for row in rows]

    def _get_table_names(self, conn: sqlite3.Connection) -> List[str]:
        """
        Get all table names from database.

        Args:
            conn: SQLite connection

        Returns:
            List of table names
        """
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
        return [row[0] for row in cursor.fetchall()]

    def create_backup(self) -> Tuple[bool, Optional[BackupMetadata]]:
        """
        Create a backup of the database.

        Returns:
            Tuple of (success, metadata)
        """
        try:
            timestamp = datetime.utcnow()
            backup_filename = self._get_backup_filename(timestamp)
            backup_path = os.path.join(self.config.backup_directory, backup_filename)

            # Check if database exists
            if not os.path.exists(self.config.database_path):
                logger.error(f"Database not found: {self.config.database_path}")
                return False, None

            # Connect to database
            conn = sqlite3.connect(self.config.database_path)

            try:
                # Get all tables
                tables = self._get_table_names(conn)
                logger.info(f"Found {len(tables)} tables to backup")

                # Export all tables
                backup_data = {
                    "metadata": {
                        "timestamp": timestamp.isoformat(),
                        "database": self.config.database_path,
                        "version": "1.0",
                    },
                    "tables": {}
                }

                total_records = 0
                for table in tables:
                    table_data = self._export_table_to_dict(conn, table)
                    backup_data["tables"][table] = table_data
                    total_records += len(table_data)
                    logger.info(f"Exported table '{table}': {len(table_data)} records")

                # Write to JSON file
                with open(backup_path, 'w') as f:
                    json.dump(backup_data, f, indent=2, default=str)

                logger.info(f"Backup created: {backup_path}")

                # Calculate checksum
                checksum = self._calculate_checksum(backup_path)
                file_size = os.path.getsize(backup_path)

                # Create metadata
                metadata = BackupMetadata(
                    timestamp=timestamp.isoformat(),
                    database_path=self.config.database_path,
                    backup_path=backup_path,
                    checksum=checksum,
                    size_bytes=file_size,
                    table_count=len(tables),
                    record_count=total_records,
                    compressed=self.config.enable_compression,
                    verified=False
                )

                # Verify backup if enabled
                if self.config.verify_on_backup:
                    verified, _ = self.verify_backup(backup_path)
                    metadata.verified = verified

                # Save metadata
                self._save_metadata(metadata)

                logger.info(f"Backup completed: {total_records} records from {len(tables)} tables")
                return True, metadata

            finally:
                conn.close()

        except Exception as e:
            logger.error(f"Backup failed: {str(e)}", exc_info=True)
            return False, None

    def verify_backup(self, backup_path: str) -> Tuple[bool, Optional[str]]:
        """
        Verify backup integrity by checking JSON structure and checksum.

        Args:
            backup_path: Path to backup file

        Returns:
            Tuple of (valid, error_message)
        """
        try:
            if not os.path.exists(backup_path):
                return False, "Backup file not found"

            # Load and validate JSON structure
            with open(backup_path, 'r') as f:
                data = json.load(f)

            # Check required keys
            if "metadata" not in data or "tables" not in data:
                return False, "Invalid backup structure: missing metadata or tables"

            # Verify table data structure
            for table_name, records in data["tables"].items():
                if not isinstance(records, list):
                    return False, f"Invalid table data for '{table_name}'"

            # Calculate and verify checksum
            actual_checksum = self._calculate_checksum(backup_path)

            # Try to load stored metadata
            metadata_path = backup_path + ".meta"
            if os.path.exists(metadata_path):
                with open(metadata_path, 'r') as f:
                    stored_metadata = BackupMetadata(**json.load(f))

                if stored_metadata.checksum != actual_checksum:
                    return False, "Checksum mismatch - backup may be corrupted"

            logger.info(f"Backup verified: {backup_path}")
            return True, None

        except json.JSONDecodeError as e:
            return False, f"Invalid JSON: {str(e)}"
        except Exception as e:
            return False, f"Verification failed: {str(e)}"

    def restore_backup(self, backup_path: str, target_db: Optional[str] = None) -> Tuple[bool, Optional[str]]:
        """
        Restore database from backup file.

        Args:
            backup_path: Path to backup file
            target_db: Optional target database path (defaults to config path)

        Returns:
            Tuple of (success, error_message)
        """
        try:
            # Verify backup first
            valid, error = self.verify_backup(backup_path)
            if not valid:
                logger.error(f"Backup verification failed: {error}")
                return False, error

            # Load backup data
            with open(backup_path, 'r') as f:
                backup_data = json.load(f)

            # Determine target database
            target_database = target_db or self.config.database_path

            # Create backup of current database if it exists
            if os.path.exists(target_database):
                backup_current = f"{target_database}.pre_restore_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
                shutil.copy2(target_database, backup_current)
                logger.info(f"Created pre-restore backup: {backup_current}")

            # Connect to target database
            conn = sqlite3.connect(target_database)

            try:
                cursor = conn.cursor()

                # Drop existing tables
                existing_tables = self._get_table_names(conn)
                for table in existing_tables:
                    cursor.execute(f"DROP TABLE IF EXISTS {table}")
                logger.info(f"Dropped {len(existing_tables)} existing tables")

                # Restore each table
                total_restored = 0
                for table_name, records in backup_data["tables"].items():
                    if not records:
                        logger.warning(f"Skipping empty table: {table_name}")
                        continue

                    # Create table from first record structure
                    first_record = records[0]
                    columns = list(first_record.keys())

                    # Create table (simple type inference)
                    column_defs = []
                    for col in columns:
                        if col.lower() == 'id':
                            column_defs.append(f"{col} INTEGER PRIMARY KEY")
                        else:
                            column_defs.append(f"{col} TEXT")

                    create_sql = f"CREATE TABLE {table_name} ({', '.join(column_defs)})"
                    cursor.execute(create_sql)

                    # Insert records
                    placeholders = ', '.join(['?' for _ in columns])
                    insert_sql = f"INSERT INTO {table_name} ({', '.join(columns)}) VALUES ({placeholders})"

                    for record in records:
                        values = [record.get(col) for col in columns]
                        cursor.execute(insert_sql, values)

                    total_restored += len(records)
                    logger.info(f"Restored table '{table_name}': {len(records)} records")

                conn.commit()
                logger.info(f"Restore completed: {total_restored} records restored")
                return True, None

            finally:
                conn.close()

        except Exception as e:
            error_msg = f"Restore failed: {str(e)}"
            logger.error(error_msg, exc_info=True)
            return False, error_msg

    def cleanup_old_backups(self) -> int:
        """
        Remove backups older than retention period.

        Returns:
            Number of backups deleted
        """
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=self.config.retention_days)
            deleted_count = 0

            backup_dir = Path(self.config.backup_directory)
            for backup_file in backup_dir.glob("backup_*.json*"):
                # Extract timestamp from filename
                try:
                    timestamp_str = backup_file.stem.replace("backup_", "")
                    file_date = datetime.strptime(timestamp_str, "%Y%m%d_%H%M%S")

                    if file_date < cutoff_date:
                        # Remove backup file and metadata
                        backup_file.unlink()
                        meta_file = Path(str(backup_file) + ".meta")
                        if meta_file.exists():
                            meta_file.unlink()

                        deleted_count += 1
                        logger.info(f"Deleted old backup: {backup_file.name}")

                except ValueError:
                    logger.warning(f"Could not parse timestamp from: {backup_file.name}")

            logger.info(f"Cleanup completed: {deleted_count} backups deleted")
            return deleted_count

        except Exception as e:
            logger.error(f"Cleanup failed: {str(e)}", exc_info=True)
            return 0

    def list_backups(self) -> List[BackupMetadata]:
        """
        List all available backups.

        Returns:
            List of backup metadata
        """
        backups = []
        backup_dir = Path(self.config.backup_directory)

        for backup_file in sorted(backup_dir.glob("backup_*.json*")):
            meta_file = Path(str(backup_file) + ".meta")
            if meta_file.exists():
                try:
                    with open(meta_file, 'r') as f:
                        metadata = BackupMetadata(**json.load(f))
                    backups.append(metadata)
                except Exception as e:
                    logger.warning(f"Could not load metadata for {backup_file.name}: {str(e)}")

        return backups

    def _save_metadata(self, metadata: BackupMetadata) -> None:
        """
        Save backup metadata to separate file.

        Args:
            metadata: Backup metadata to save
        """
        meta_path = metadata.backup_path + ".meta"
        with open(meta_path, 'w') as f:
            json.dump(metadata.model_dump(), f, indent=2)
        logger.info(f"Metadata saved: {meta_path}")

    def get_backup_stats(self) -> Dict[str, Any]:
        """
        Get statistics about backups.

        Returns:
            Dictionary with backup statistics
        """
        backups = self.list_backups()

        if not backups:
            return {
                "total_backups": 0,
                "total_size_bytes": 0,
                "oldest_backup": None,
                "newest_backup": None,
            }

        total_size = sum(b.size_bytes for b in backups)
        oldest = min(backups, key=lambda b: b.timestamp)
        newest = max(backups, key=lambda b: b.timestamp)

        return {
            "total_backups": len(backups),
            "total_size_bytes": total_size,
            "total_size_mb": round(total_size / (1024 * 1024), 2),
            "oldest_backup": oldest.timestamp,
            "newest_backup": newest.timestamp,
            "retention_days": self.config.retention_days,
            "backup_directory": self.config.backup_directory,
        }


# Singleton instance
_backup_service: Optional[BackupService] = None


def get_backup_service(config: Optional[BackupConfig] = None) -> BackupService:
    """
    Get or create backup service singleton.

    Args:
        config: Optional configuration

    Returns:
        BackupService instance
    """
    global _backup_service
    if _backup_service is None:
        _backup_service = BackupService(config)
    return _backup_service


# Convenience functions for common operations
def create_backup(config: Optional[BackupConfig] = None) -> Tuple[bool, Optional[BackupMetadata]]:
    """Create a backup using default service"""
    service = get_backup_service(config)
    return service.create_backup()


def restore_backup(backup_path: str, config: Optional[BackupConfig] = None) -> Tuple[bool, Optional[str]]:
    """Restore from backup using default service"""
    service = get_backup_service(config)
    return service.restore_backup(backup_path)


def cleanup_old_backups(config: Optional[BackupConfig] = None) -> int:
    """Cleanup old backups using default service"""
    service = get_backup_service(config)
    return service.cleanup_old_backups()
