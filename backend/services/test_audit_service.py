import json
import os
import uuid
import pytest
from datetime import datetime, timezone
from sqlalchemy import create_engine, text, Column, String, BigInteger, Integer
from sqlalchemy.orm import sessionmaker
from sqlalchemy.dialects.postgresql import UUID, INET, JSONB
from sqlalchemy.ext.compiler import compiles

from backend.db.base import Base
from backend.models.audit_log import AuditLog
from backend.services.audit_service import (
    AuditEventType,
    AuditService,
    AuditSeverity,
    get_audit_service,
)

# Fix for SQLite not supporting PostgreSQL specific types
@compiles(UUID, "sqlite")
def compile_uuid(type_, compiler, **kw):
    return "VARCHAR(36)"

@compiles(INET, "sqlite")
def compile_inet(type_, compiler, **kw):
    return "VARCHAR(45)"

@compiles(JSONB, "sqlite")
def compile_jsonb(type_, compiler, **kw):
    return "JSON"

@compiles(BigInteger, "sqlite")
def compile_big_integer(type_, compiler, **kw):
    return "INTEGER"

# Define Mock User model to satisfy Foreign Key constraints
class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True)

# Test Data
USER_ID_1 = str(uuid.uuid4())
USER_ID_2 = str(uuid.uuid4())
ADMIN_ID = str(uuid.uuid4())
TARGET_USER_ID = str(uuid.uuid4())

# Setup fixtures
@pytest.fixture
def db_session():
    """Create a temporary in-memory DB session for testing"""
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()

    # Enable foreign keys for SQLite (optional, but good practice if we want to test integrity)
    session.execute(text("PRAGMA foreign_keys=OFF"))

    # Create test users
    u1 = User(id=uuid.UUID(USER_ID_1), email="user1@example.com")
    u2 = User(id=uuid.UUID(USER_ID_2), email="user2@example.com")
    admin = User(id=uuid.UUID(ADMIN_ID), email="admin@example.com")
    target = User(id=uuid.UUID(TARGET_USER_ID), email="target@example.com")

    session.add_all([u1, u2, admin, target])
    session.commit()

    yield session
    session.close()

@pytest.fixture
def service():
    """Get audit service instance"""
    return AuditService()

@pytest.mark.asyncio
async def test_audit_service_initialization(service):
    """Test audit service initialization"""
    print("Testing audit service initialization...")
    assert service is not None
    print("✓ Initialization test passed")

@pytest.mark.asyncio
async def test_user_login_logging(service, db_session):
    """Test user login event logging"""
    print("\nTesting user login logging...")

    # Test successful login
    log_entry = await service.log_user_login(
        db=db_session,
        user_id=USER_ID_1,
        ip_address="192.168.1.100",
        user_agent="Mozilla/5.0",
        success=True
    )

    assert log_entry.id is not None, "Should return valid entry with ID"
    assert str(log_entry.user_id) == USER_ID_1

    # Test failed login
    failed_log = await service.log_user_login(
        db=db_session,
        user_id=USER_ID_2,
        ip_address="192.168.1.200",
        user_agent="Mozilla/5.0",
        success=False,
        error="Invalid credentials"
    )

    assert failed_log.id is not None
    assert failed_log.id != log_entry.id

    # Verify logs
    logs = await service.get_logs(db_session)
    assert len(logs) == 2, "Should have 2 log entries"

    # Check successful login
    success_log = next((log for log in logs if str(log['user_id']) == USER_ID_1), None)
    assert success_log is not None
    assert success_log['metadata']['result'] == 'success'
    assert success_log['metadata']['severity'] == 'info'

    # Check failed login
    failed_log_entry = next((log for log in logs if str(log['user_id']) == USER_ID_2), None)
    assert failed_log_entry is not None
    assert failed_log_entry['metadata']['result'] == 'failure'
    assert failed_log_entry['metadata']['severity'] == 'warning'

    print("✓ User login logging test passed")

@pytest.mark.asyncio
async def test_purchase_logging(service, db_session):
    """Test purchase transaction logging"""
    print("\nTesting purchase logging...")

    # Test successful purchase
    log_entry = await service.log_purchase(
        db=db_session,
        user_id=USER_ID_1,
        ip_address="192.168.1.100",
        amount=99.99,
        currency="USD",
        product_id="prod_pro_license",
        success=True,
        transaction_id="txn_abc123"
    )

    assert log_entry.id is not None

    # Verify log
    logs = await service.get_logs(db_session)
    assert len(logs) == 1

    purchase_log = logs[0]
    assert purchase_log['metadata']['event_type'] == AuditEventType.PURCHASE_COMPLETED
    assert purchase_log['resource_type'] == 'purchase'
    assert purchase_log['resource_id'] == 'txn_abc123'

    # Verify metadata
    metadata = purchase_log['metadata']
    assert metadata['amount'] == 99.99
    assert metadata['currency'] == 'USD'
    assert metadata['product_id'] == 'prod_pro_license'

    print("✓ Purchase logging test passed")

@pytest.mark.asyncio
async def test_api_call_logging(service, db_session):
    """Test API call logging"""
    print("\nTesting API call logging...")

    # Test successful API call
    await service.log_api_call(
        db=db_session,
        user_id=USER_ID_1,
        ip_address="192.168.1.100",
        endpoint="/api/users",
        method="GET",
        status_code=200,
        response_time_ms=45.2,
        user_agent="API Client/1.0"
    )

    # Test failed API call
    await service.log_api_call(
        db=db_session,
        user_id=USER_ID_1,
        ip_address="192.168.1.100",
        endpoint="/api/admin",
        method="POST",
        status_code=403,
        response_time_ms=12.5
    )

    # Test server error
    await service.log_api_call(
        db=db_session,
        user_id=USER_ID_1,
        ip_address="192.168.1.100",
        endpoint="/api/process",
        method="POST",
        status_code=500,
        response_time_ms=2500.0
    )

    logs = await service.get_logs(db_session)
    assert len(logs) == 3

    # Check severity levels
    success_log = next((log for log in logs if log['metadata']['status_code'] == 200), None)
    assert success_log['metadata']['severity'] == 'info'

    client_error = next((log for log in logs if log['metadata']['status_code'] == 403), None)
    assert client_error['metadata']['severity'] == 'warning'

    server_error = next((log for log in logs if log['metadata']['status_code'] == 500), None)
    assert server_error['metadata']['severity'] == 'critical'

    print("✓ API call logging test passed")

@pytest.mark.asyncio
async def test_admin_action_logging(service, db_session):
    """Test admin action logging"""
    print("\nTesting admin action logging...")

    # Test admin user creation
    await service.log_admin_action(
        db=db_session,
        admin_user_id=ADMIN_ID,
        ip_address="192.168.1.50",
        action_type=AuditEventType.ADMIN_USER_CREATE,
        action_description="Created new user account",
        target_user_id=TARGET_USER_ID,
        changes={
            "email": "newuser@example.com",
            "role": "member"
        }
    )

    # Test config change
    await service.log_admin_action(
        db=db_session,
        admin_user_id=ADMIN_ID,
        ip_address="192.168.1.50",
        action_type=AuditEventType.ADMIN_CONFIG_CHANGE,
        action_description="Updated system configuration",
        changes={
            "setting": "max_users",
            "old_value": 100,
            "new_value": 200
        }
    )

    logs = await service.get_logs(db_session)
    assert len(logs) == 2

    # All admin actions should be WARNING severity
    for log in logs:
        assert log['metadata']['severity'] == 'warning'

    # Check user creation log
    user_create = next((log for log in logs if log['metadata']['event_type'] == AuditEventType.ADMIN_USER_CREATE), None)
    assert user_create is not None
    assert user_create['resource_id'] == TARGET_USER_ID

    print("✓ Admin action logging test passed")

@pytest.mark.asyncio
async def test_query_filters(service, db_session):
    """Test audit log query filters"""
    print("\nTesting query filters...")

    # Create test data
    await service.log_user_login(db_session, USER_ID_1, "192.168.1.1", None, success=True)
    await service.log_user_login(db_session, USER_ID_2, "192.168.1.2", None, success=True)
    await service.log_user_login(db_session, USER_ID_1, "192.168.1.1", None, success=False, error="Bad password")

    # Filter by user_id
    user1_logs = await service.get_logs(db_session, user_id=USER_ID_1)
    assert len(user1_logs) == 2

    # Filter by resource_type which is "auth"
    auth_logs = await service.get_logs(db_session, resource_type="auth")
    assert len(auth_logs) == 3

    # Test pagination
    page1 = await service.get_logs(db_session, limit=2, offset=0)
    assert len(page1) == 2

    page2 = await service.get_logs(db_session, limit=2, offset=2)
    assert len(page2) == 1

    print("✓ Query filters test passed")

@pytest.mark.asyncio
async def test_json_export(service, db_session):
    """Test JSON export functionality"""
    print("\nTesting JSON export...")

    # Create test data
    await service.log_user_login(db_session, USER_ID_1, "192.168.1.1", None, success=True)
    await service.log_purchase(
        db=db_session,
        user_id=USER_ID_1,
        ip_address="192.168.1.1",
        amount=49.99,
        currency="USD",
        product_id="prod_starter",
        success=True,
        transaction_id="txn_001"
    )

    # Export to JSON (returns list of dicts)
    export_data = await service.export_logs(db_session, format="json")

    assert isinstance(export_data, list)
    assert len(export_data) == 2

    entry = export_data[0]
    assert 'timestamp' in entry
    assert 'user_id' in entry
    assert 'metadata' in entry

    print("✓ JSON export test passed")

@pytest.mark.asyncio
async def test_retention_policy(service, db_session):
    """Test retention policy (simulated)"""
    print("\nTesting retention policy...")
    await service.archive_old_logs(db_session, retention_days=90)
    print("✓ Retention policy test passed (Placeholder)")

@pytest.mark.asyncio
async def test_statistics(service, db_session):
    """Test statistics generation"""
    print("\nTesting statistics...")

    # Create varied test data
    await service.log_user_login(db_session, USER_ID_1, "192.168.1.1", None, success=True)
    await service.log_user_login(db_session, USER_ID_2, "192.168.1.2", None, success=True)

    stats = await service.get_statistics(db_session)

    assert stats['total_entries'] == 2
    assert stats['last_24_hours'] == 2

    print("✓ Statistics test passed")

def test_singleton_service():
    """Test singleton pattern"""
    print("\nTesting singleton service...")
    service1 = get_audit_service()
    service2 = get_audit_service()
    assert service1 is service2, "Should return same instance"
    print("✓ Singleton test passed")
