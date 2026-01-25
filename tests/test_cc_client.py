#!/usr/bin/env python3
"""
Tests for cc_client.py - Client Management CLI

Tests all 5 commands: add, list, portal, invoice, status
"""

import json

# Import the app
import sys
from datetime import datetime, timedelta
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest
from typer.testing import CliRunner

sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))
from cc_client import app, generate_client_id, generate_invoice_id, generate_portal_code

runner = CliRunner()


# ============================================================================
# FIXTURES
# ============================================================================

@pytest.fixture
def temp_data_dir(tmp_path):
    """Create temporary data directory for testing."""
    data_dir = tmp_path / "data" / "client_portal"
    data_dir.mkdir(parents=True)
    return data_dir


@pytest.fixture
def mock_clients_file(temp_data_dir):
    """Create mock clients.json file."""
    clients_file = temp_data_dir / "clients.json"
    clients_data = {
        "CLI-TEST001": {
            "id": "CLI-TEST001",
            "name": "Test Client",
            "email": "test@example.com",
            "company": "Test Corp",
            "status": "active",
            "created_at": "2026-01-25T10:00:00",
            "portal_code": "ABC123DEF456",
            "notes": "",
            "monthly_retainer": 2000.0,
            "total_spent": 0.0
        }
    }
    clients_file.write_text(json.dumps(clients_data, indent=2))
    return clients_file


@pytest.fixture
def mock_invoices_file(temp_data_dir):
    """Create mock invoices.json file."""
    invoices_file = temp_data_dir / "invoices.json"
    invoices_data = {
        "INV-202601-0001": {
            "id": "INV-202601-0001",
            "client_id": "CLI-TEST001",
            "project_id": None,
            "amount": 2500.0,
            "status": "paid",
            "due_date": "2026-02-25T10:00:00",
            "paid_date": "2026-01-20T10:00:00",
            "items": [
                {
                    "name": "Phase 1",
                    "amount": 2500.0
                }
            ],
            "notes": ""
        }
    }
    invoices_file.write_text(json.dumps(invoices_data, indent=2))
    return invoices_file


@pytest.fixture(autouse=True)
def patch_data_files(mock_clients_file, mock_invoices_file, monkeypatch):
    """Patch DATA_DIR to use temp directory for all tests."""
    import cc_client
    temp_dir = mock_clients_file.parent
    monkeypatch.setattr(cc_client, 'DATA_DIR', temp_dir)
    monkeypatch.setattr(cc_client, 'CLIENTS_FILE', mock_clients_file)
    monkeypatch.setattr(cc_client, 'INVOICES_FILE', mock_invoices_file)


# ============================================================================
# TEST ID GENERATORS
# ============================================================================

def test_generate_client_id():
    """Test client ID generation format."""
    client_id = generate_client_id()
    assert client_id.startswith("CLI-")
    assert len(client_id) == 12  # CLI- + 8 hex chars


def test_generate_portal_code():
    """Test portal code generation format."""
    code = generate_portal_code()
    assert len(code) == 12  # 12 hex chars
    assert all(c in "0123456789ABCDEF" for c in code)


def test_generate_invoice_id():
    """Test invoice ID generation format."""
    invoice_id = generate_invoice_id()
    assert invoice_id.startswith("INV-")
    assert len(invoice_id.split("-")) == 3  # INV-YYYYMM-XXXX
    # Verify date format
    date_part = invoice_id.split("-")[1]
    assert len(date_part) == 6  # YYYYMM
    assert date_part.isdigit()


# ============================================================================
# TEST COMMAND: add
# ============================================================================

def test_add_client_success():
    """Test adding a new client."""
    result = runner.invoke(app, [
        "add",
        "John Doe",
        "--email", "john@example.com",
        "--company", "Acme Corp",
        "--retainer", "3000"
    ])

    assert result.exit_code == 0
    assert "Client onboarded successfully" in result.stdout
    assert "john@example.com" in result.stdout
    assert "Acme Corp" in result.stdout
    assert "$3,000.00" in result.stdout


def test_add_client_minimal():
    """Test adding a client with minimal info (no company)."""
    result = runner.invoke(app, [
        "add",
        "Jane Smith",
        "--email", "jane@example.com"
    ])

    assert result.exit_code == 0
    assert "Client onboarded successfully" in result.stdout
    assert "jane@example.com" in result.stdout


# ============================================================================
# TEST COMMAND: list
# ============================================================================

def test_list_clients_all():
    """Test listing all clients."""
    result = runner.invoke(app, ["list"])

    assert result.exit_code == 0
    assert "Client List" in result.stdout
    assert "CLI-TEST001" in result.stdout
    assert "Test Client" in result.stdout
    assert "test@example.com" in result.stdout


def test_list_clients_by_status():
    """Test filtering clients by status."""
    result = runner.invoke(app, ["list", "--status", "active"])

    assert result.exit_code == 0
    assert "CLI-TEST001" in result.stdout


def test_list_clients_empty():
    """Test listing when no clients exist."""
    # Clear clients file
    import cc_client
    cc_client.save_clients({})

    result = runner.invoke(app, ["list"])

    assert result.exit_code == 0
    assert "No clients found" in result.stdout


# ============================================================================
# TEST COMMAND: portal
# ============================================================================

def test_portal_success():
    """Test generating portal link for existing client."""
    result = runner.invoke(app, ["portal", "CLI-TEST001"])

    assert result.exit_code == 0
    assert "Portal Access" in result.stdout
    assert "ABC123DEF456" in result.stdout
    assert "portal.binhphap.agency" in result.stdout


def test_portal_client_not_found():
    """Test portal command with non-existent client."""
    result = runner.invoke(app, ["portal", "CLI-NOTFOUND"])

    assert result.exit_code == 1
    assert "not found" in result.stdout


# ============================================================================
# TEST COMMAND: invoice
# ============================================================================

def test_invoice_create_success():
    """Test creating an invoice for a client."""
    result = runner.invoke(app, [
        "invoice",
        "CLI-TEST001",
        "5000",
        "--description", "Website Development",
        "--due-days", "15"
    ])

    assert result.exit_code == 0
    assert "Invoice created successfully" in result.stdout
    assert "$5,000.00" in result.stdout
    assert "Website Development" in result.stdout


def test_invoice_create_default_description():
    """Test creating invoice with default description."""
    result = runner.invoke(app, [
        "invoice",
        "CLI-TEST001",
        "1000"
    ])

    assert result.exit_code == 0
    assert "Invoice created successfully" in result.stdout
    assert "Service Fee" in result.stdout


def test_invoice_client_not_found():
    """Test invoice creation with non-existent client."""
    result = runner.invoke(app, [
        "invoice",
        "CLI-NOTFOUND",
        "1000"
    ])

    assert result.exit_code == 1
    assert "not found" in result.stdout


# ============================================================================
# TEST COMMAND: status
# ============================================================================

def test_status_success():
    """Test showing client status report."""
    result = runner.invoke(app, ["status", "CLI-TEST001"])

    assert result.exit_code == 0
    assert "Client Status" in result.stdout
    assert "Test Client" in result.stdout
    assert "test@example.com" in result.stdout
    assert "Financial Overview" in result.stdout
    assert "Invoice Summary" in result.stdout
    assert "Health Status" in result.stdout


def test_status_client_not_found():
    """Test status command with non-existent client."""
    result = runner.invoke(app, ["status", "CLI-NOTFOUND"])

    assert result.exit_code == 1
    assert "not found" in result.stdout


def test_status_shows_invoices():
    """Test that status displays recent invoices."""
    result = runner.invoke(app, ["status", "CLI-TEST001"])

    assert result.exit_code == 0
    assert "Recent Invoices" in result.stdout
    assert "INV-202601-0001" in result.stdout
    assert "PAID" in result.stdout


def test_status_health_calculation():
    """Test health status calculation logic."""
    # Add overdue invoice
    import cc_client
    invoices = cc_client.load_invoices()
    invoices["INV-OVERDUE"] = {
        "id": "INV-OVERDUE",
        "client_id": "CLI-TEST001",
        "amount": 1000.0,
        "status": "pending",
        "due_date": (datetime.now() - timedelta(days=10)).isoformat(),
        "paid_date": None,
        "items": [{"name": "Test", "amount": 1000.0}],
        "notes": ""
    }
    cc_client.save_invoices(invoices)

    result = runner.invoke(app, ["status", "CLI-TEST001"])

    assert result.exit_code == 0
    assert "Needs Attention" in result.stdout or "Outstanding Balance" in result.stdout


# ============================================================================
# INTEGRATION TESTS
# ============================================================================

def test_full_workflow():
    """Test complete workflow: add client -> create invoice -> check status."""
    # Step 1: Add client
    result = runner.invoke(app, [
        "add",
        "Integration Test",
        "--email", "integration@example.com",
        "--company", "Test LLC",
        "--retainer", "5000"
    ])
    assert result.exit_code == 0

    # Extract client ID from output
    import cc_client
    clients = cc_client.load_clients()
    client_id = next(
        (cid for cid, c in clients.items() if c.get("email") == "integration@example.com"),
        None
    )
    assert client_id is not None

    # Step 2: Create invoice
    result = runner.invoke(app, [
        "invoice",
        client_id,
        "10000",
        "--description", "Initial Project"
    ])
    assert result.exit_code == 0

    # Step 3: Check status
    result = runner.invoke(app, ["status", client_id])
    assert result.exit_code == 0
    assert "Integration Test" in result.stdout
    assert "Initial Project" in result.stdout


def test_persistence():
    """Test that data persists across command invocations."""
    # Add client
    result = runner.invoke(app, [
        "add",
        "Persist Test",
        "--email", "persist@example.com"
    ])
    assert result.exit_code == 0

    # List clients - should see new client
    result = runner.invoke(app, ["list"])
    assert result.exit_code == 0
    assert "Persist Test" in result.stdout
    assert "persist@example.com" in result.stdout


# ============================================================================
# EDGE CASES
# ============================================================================

def test_add_client_with_special_characters():
    """Test adding client with special characters in name."""
    result = runner.invoke(app, [
        "add",
        "O'Brien & Associates",
        "--email", "obrien@example.com"
    ])
    assert result.exit_code == 0


def test_invoice_zero_amount():
    """Test creating invoice with zero amount (should work)."""
    result = runner.invoke(app, [
        "invoice",
        "CLI-TEST001",
        "0"
    ])
    assert result.exit_code == 0
    assert "$0.00" in result.stdout


def test_list_clients_no_filters():
    """Test list without filters returns all clients."""
    result = runner.invoke(app, ["list"])
    assert result.exit_code == 0
    # Should show at least the fixture client
    assert "CLI-TEST001" in result.stdout
