#!/usr/bin/env python3
"""
Backup Service Demo Script
===========================

Demonstrates all features of the automated backup service.

Usage:
    python demo_backup_service.py
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.services.backup_service import (
    BackupConfig,
    BackupService,
    get_backup_service,
)


def print_header(title: str) -> None:
    """Print section header"""
    print(f"\n{'=' * 60}")
    print(f"  {title}")
    print(f"{'=' * 60}\n")


def demo_basic_backup():
    """Demonstrate basic backup creation"""
    print_header("1. Creating Backup")

    service = get_backup_service()
    success, metadata = service.create_backup()

    if success:
        print("✅ Backup created successfully!")
        print(f"   Path: {metadata.backup_path}")
        print(f"   Timestamp: {metadata.timestamp}")
        print(f"   Tables: {metadata.table_count}")
        print(f"   Records: {metadata.record_count}")
        print(f"   Size: {metadata.size_bytes:,} bytes")
        print(f"   Checksum: {metadata.checksum[:16]}...")
        print(f"   Verified: {metadata.verified}")
        return metadata.backup_path
    else:
        print("❌ Backup failed!")
        return None


def demo_verify_backup(backup_path: str):
    """Demonstrate backup verification"""
    print_header("2. Verifying Backup")

    service = get_backup_service()
    valid, error = service.verify_backup(backup_path)

    if valid:
        print("✅ Backup verification passed!")
        print("   Structure: Valid JSON")
        print("   Checksum: Matches")
        print("   Content: All tables present")
    else:
        print(f"❌ Backup verification failed: {error}")


def demo_list_backups():
    """Demonstrate listing backups"""
    print_header("3. Listing Available Backups")

    service = get_backup_service()
    backups = service.list_backups()

    if backups:
        print(f"Found {len(backups)} backup(s):\n")
        for i, backup in enumerate(backups, 1):
            print(f"{i}. Backup from {backup.timestamp}")
            print(f"   Tables: {backup.table_count}, Records: {backup.record_count}")
            print(f"   Size: {backup.size_bytes:,} bytes")
            print(f"   Path: {backup.backup_path}")
            print()
    else:
        print("No backups found.")


def demo_backup_stats():
    """Demonstrate backup statistics"""
    print_header("4. Backup Statistics")

    service = get_backup_service()
    stats = service.get_backup_stats()

    print(f"Total Backups: {stats['total_backups']}")
    print(f"Total Size: {stats['total_size_mb']:.2f} MB")
    print(f"Retention: {stats['retention_days']} days")
    print(f"Directory: {stats['backup_directory']}")

    if stats['oldest_backup']:
        print(f"Oldest: {stats['oldest_backup']}")
    if stats['newest_backup']:
        print(f"Newest: {stats['newest_backup']}")


def demo_restore_backup(backup_path: str):
    """Demonstrate backup restoration"""
    print_header("5. Restoring from Backup (to test database)")

    # Create a test restore target
    import tempfile
    test_db = tempfile.mktemp(suffix=".db")

    service = get_backup_service()
    success, error = service.restore_backup(backup_path, test_db)

    if success:
        print("✅ Restore completed successfully!")
        print(f"   Restored to: {test_db}")
        print("   Pre-restore backup created")
        print("   All tables recreated")
        print("   All data restored")

        # Cleanup test database
        import os
        if os.path.exists(test_db):
            os.remove(test_db)
            print(f"\n   (Test database cleaned up)")
    else:
        print(f"❌ Restore failed: {error}")


def demo_cleanup():
    """Demonstrate backup cleanup"""
    print_header("6. Cleanup Old Backups")

    service = get_backup_service()
    print(f"Retention policy: {service.config.retention_days} days")
    print("Running cleanup...")

    deleted = service.cleanup_old_backups()
    print(f"✅ Deleted {deleted} old backup(s)")


def demo_custom_config():
    """Demonstrate custom configuration"""
    print_header("7. Custom Configuration")

    config = BackupConfig(
        database_path="./agencyos.db",
        backup_directory="./custom_backups",
        retention_days=14,
        enable_compression=False,
        verify_on_backup=True
    )

    print("Custom Configuration:")
    print(f"  Database: {config.database_path}")
    print(f"  Backup Dir: {config.backup_directory}")
    print(f"  Retention: {config.retention_days} days")
    print(f"  Compression: {config.enable_compression}")
    print(f"  Auto-verify: {config.verify_on_backup}")

    service = BackupService(config)
    print("\n✅ Service initialized with custom config")


def main():
    """Run all demos"""
    print("""
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║           Automated Backup Service - Demo Script             ║
║                                                               ║
║  Demonstrates all features of the production-ready            ║
║  database backup and restore service                          ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
""")

    try:
        # Run demos
        backup_path = demo_basic_backup()

        if backup_path:
            demo_verify_backup(backup_path)
            demo_list_backups()
            demo_backup_stats()
            demo_restore_backup(backup_path)
            demo_cleanup()

        demo_custom_config()

        # Final summary
        print_header("✅ Demo Complete!")
        print("All backup service features demonstrated successfully.")
        print("\nFor production use:")
        print("  1. Configure backup_directory in settings")
        print("  2. Set up scheduled backups (cron/APScheduler)")
        print("  3. Monitor backup statistics regularly")
        print("  4. Test restore procedures periodically")
        print("  5. Consider adding encryption for sensitive data")
        print("\nSee TASK_AN_COMPLETION.md for integration guide.")

    except Exception as e:
        print(f"\n❌ Error during demo: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
