"""Tests for MCU Billing System."""

import pytest

from src.core.mcu_billing import (
    LOW_BALANCE_THRESHOLD,
    MCU_COSTS,
    MCUBilling,
    MCUTransaction,
    TenantBalance,
    DeductionResult,
)


class TestMCUCosts:
    """Test MCU cost configuration."""

    def test_mcu_costs_values(self):
        """Test MCU costs per complexity."""
        assert MCU_COSTS["simple"] == 1
        assert MCU_COSTS["standard"] == 3
        assert MCU_COSTS["complex"] == 5


class TestTenantBalance:
    """Test TenantBalance dataclass."""

    def test_tenant_balance_creation(self):
        """Test creating tenant balance."""
        balance = TenantBalance(tenant_id="tenant-123")
        assert balance.tenant_id == "tenant-123"
        assert balance.balance == 0
        assert balance.total_credited == 0
        assert balance.total_debited == 0

    def test_tenant_balance_to_dict(self):
        """Test tenant balance serialization."""
        balance = TenantBalance(tenant_id="tenant-456")
        balance.balance = 100
        balance.total_credited = 150
        balance.total_debited = 50

        data = balance.to_dict()
        assert data["balance"] == 100
        assert data["total_credited"] == 150
        assert data["total_debited"] == 50
        assert data["transaction_count"] == 0


class TestMCUTransaction:
    """Test MCUTransaction dataclass."""

    def test_transaction_creation(self):
        """Test creating transaction."""
        tx = MCUTransaction(
            tenant_id="tenant-123",
            amount=100,
            balance_after=100,
            transaction_type="credit",
            description="Initial credits",
        )
        assert tx.tenant_id == "tenant-123"
        assert tx.amount == 100
        assert tx.transaction_type == "credit"

    def test_transaction_to_dict(self):
        """Test transaction serialization."""
        tx = MCUTransaction(
            tenant_id="tenant-789",
            amount=-5,
            balance_after=95,
            transaction_type="debit",
            description="Task execution",
            mission_id="mission-001",
        )
        data = tx.to_dict()
        assert data["amount"] == -5
        assert data["mission_id"] == "mission-001"
        assert "timestamp" in data


class TestDeductionResult:
    """Test DeductionResult dataclass."""

    def test_deduction_result_success(self):
        """Test successful deduction result."""
        result = DeductionResult(
            success=True,
            balance_before=100,
            balance_after=97,
            amount_deducted=3,
            low_balance=False,
        )
        assert result.success is True
        assert result.amount_deducted == 3

    def test_deduction_result_failure(self):
        """Test failed deduction result."""
        result = DeductionResult(
            success=False,
            balance_before=2,
            balance_after=2,
            amount_deducted=0,
            error="Insufficient MCU: need 3, have 2",
        )
        assert result.success is False
        assert result.error != ""


class TestMCUBilling:
    """Test MCUBilling engine."""

    def test_billing_initialization(self):
        """Test billing initialization."""
        billing = MCUBilling()
        assert billing.tenant_count == 0
        assert billing.low_threshold == LOW_BALANCE_THRESHOLD

    def test_add_credits(self):
        """Test adding credits."""
        billing = MCUBilling()
        tenant = billing.add_credits("tenant-123", 100, "Initial grant")

        assert billing.get_balance("tenant-123") == 100
        assert tenant.balance == 100
        assert tenant.total_credited == 100
        assert len(tenant.transactions) == 1

    def test_add_credits_invalid_amount(self):
        """Test adding credits with invalid amount."""
        billing = MCUBilling()
        with pytest.raises(ValueError, match="must be positive"):
            billing.add_credits("tenant-123", 0)
        with pytest.raises(ValueError, match="must be positive"):
            billing.add_credits("tenant-123", -10)

    def test_deduct_simple_task(self):
        """Test deducting for simple task (1 MCU)."""
        billing = MCUBilling()
        billing.add_credits("tenant-123", 10)

        result = billing.deduct("tenant-123", "simple")

        assert result.success is True
        assert result.amount_deducted == 1
        assert result.balance_after == 9
        assert billing.get_balance("tenant-123") == 9

    def test_deduct_standard_task(self):
        """Test deducting for standard task (3 MCU)."""
        billing = MCUBilling()
        billing.add_credits("tenant-123", 10)

        result = billing.deduct("tenant-123", "standard")

        assert result.success is True
        assert result.amount_deducted == 3
        assert result.balance_after == 7

    def test_deduct_complex_task(self):
        """Test deducting for complex task (5 MCU)."""
        billing = MCUBilling()
        billing.add_credits("tenant-123", 10)

        result = billing.deduct("tenant-123", "complex")

        assert result.success is True
        assert result.amount_deducted == 5
        assert result.balance_after == 5

    def test_deduct_insufficient_balance(self):
        """Test deduction with insufficient balance."""
        billing = MCUBilling()
        billing.add_credits("tenant-123", 2)

        result = billing.deduct("tenant-123", "standard")  # Needs 3 MCU

        assert result.success is False
        assert result.error != ""
        assert "Insufficient MCU" in result.error
        assert billing.get_balance("tenant-123") == 2  # Unchanged

    def test_deduct_low_balance_trigger(self):
        """Test low balance detection after deduction."""
        billing = MCUBilling()
        billing.add_credits("tenant-123", 15)

        # Deduct until low balance
        billing.deduct("tenant-123", "complex")  # 15 - 5 = 10
        billing.deduct("tenant-123", "complex")  # 10 - 5 = 5

        assert billing.is_low_balance("tenant-123") is True

    def test_refund_credits(self):
        """Test refunding credits."""
        billing = MCUBilling()
        billing.add_credits("tenant-123", 10)
        billing.deduct("tenant-123", "standard")  # 10 - 3 = 7

        tenant = billing.refund("tenant-123", 5, mission_id="mission-001")

        assert tenant is not None
        assert tenant.balance == 12
        assert tenant.total_refunded == 5

    def test_refund_invalid_amount(self):
        """Test refund with invalid amount."""
        billing = MCUBilling()
        with pytest.raises(ValueError, match="must be positive"):
            billing.refund("tenant-123", 0)
        with pytest.raises(ValueError, match="must be positive"):
            billing.refund("tenant-123", -5)

    def test_refund_nonexistent_tenant(self):
        """Test refund for nonexistent tenant."""
        billing = MCUBilling()
        result = billing.refund("nonexistent", 10)
        assert result is None

    def test_get_tenant(self):
        """Test getting full tenant info."""
        billing = MCUBilling()
        billing.add_credits("tenant-123", 100)

        tenant = billing.get_tenant("tenant-123")
        assert tenant is not None
        assert tenant.balance == 100

    def test_get_nonexistent_tenant(self):
        """Test getting nonexistent tenant."""
        billing = MCUBilling()
        tenant = billing.get_tenant("nonexistent")
        assert tenant is None

    def test_is_low_balance(self):
        """Test low balance check."""
        billing = MCUBilling()
        billing.add_credits("tenant-123", 15)

        assert billing.is_low_balance("tenant-123") is False

        billing.deduct("tenant-123", "complex")  # 15 - 5 = 10
        billing.deduct("tenant-123", "complex")  # 10 - 5 = 5
        assert billing.is_low_balance("tenant-123") is True


class TestMCUBillingWebhooks:
    """Test MCU Billing webhook integration."""

    def test_webhook_handler_configured(self):
        """Test billing with webhook handler."""
        webhook_called = []

        def mock_webhook(event_type: str, payload: dict) -> None:
            webhook_called.append((event_type, payload))

        billing = MCUBilling(webhook_handler=mock_webhook)
        billing.add_credits("tenant-123", 15)
        billing.deduct("tenant-123", "complex")  # 15 - 5 = 10 (not low)
        billing.deduct("tenant-123", "complex")  # 10 - 5 = 5 (low!)

        # Should trigger credits.low webhook
        assert len(webhook_called) == 1
        event_type, payload = webhook_called[0]
        assert event_type == "credits.low"
        assert payload["tenant_id"] == "tenant-123"
        assert payload["current_balance"] == 5
        assert payload["threshold"] == 10

    def test_webhook_only_once_per_tenant(self):
        """Test webhook triggers only once per tenant."""
        webhook_called = []

        def mock_webhook(event_type: str, payload: dict) -> None:
            webhook_called.append((event_type, payload))

        billing = MCUBilling(webhook_handler=mock_webhook)
        billing.add_credits("tenant-123", 20)

        # Multiple deductions to go below threshold multiple times
        billing.deduct("tenant-123", "complex")  # 20 - 5 = 15
        billing.deduct("tenant-123", "complex")  # 15 - 5 = 10
        billing.deduct("tenant-123", "complex")  # 10 - 5 = 5 (triggers)
        billing.deduct("tenant-123", "complex")  # 5 - 5 = 0 (already notified)

        # Should only trigger once
        assert len(webhook_called) == 1

    def test_reset_low_balance_notification(self):
        """Test resetting low balance notification."""
        webhook_called = []

        def mock_webhook(event_type: str, payload: dict) -> None:
            webhook_called.append((event_type, payload))

        billing = MCUBilling(webhook_handler=mock_webhook)
        billing.add_credits("tenant-123", 20)

        # First low balance
        billing.deduct("tenant-123", "complex")  # 20 - 5 = 15
        billing.deduct("tenant-123", "complex")  # 15 - 5 = 10
        billing.deduct("tenant-123", "complex")  # 10 - 5 = 5 (triggers)
        assert len(webhook_called) == 1

        # Reset notification
        billing.reset_low_balance_notification("tenant-123")

        # Add credits and deduct again
        billing.add_credits("tenant-123", 10)  # 5 + 10 = 15
        billing.deduct("tenant-123", "complex")  # 15 - 5 = 10
        billing.deduct("tenant-123", "complex")  # 10 - 5 = 5 (triggers again)

        assert len(webhook_called) == 2

    def test_no_webhook_handler(self):
        """Test billing without webhook handler."""
        billing = MCUBilling()  # No webhook handler
        billing.add_credits("tenant-123", 15)
        billing.deduct("tenant-123", "complex")
        billing.deduct("tenant-123", "complex")

        # Should not raise, just silently skip webhook
        assert billing.is_low_balance("tenant-123") is True


class TestMCUBillingTransactions:
    """Test transaction history."""

    def test_transaction_history(self):
        """Test getting transaction history."""
        billing = MCUBilling()
        billing.add_credits("tenant-123", 100)
        billing.deduct("tenant-123", "standard", mission_id="m1")
        billing.deduct("tenant-123", "simple", mission_id="m2")

        tenant = billing.get_tenant("tenant-123")
        assert tenant is not None
        assert len(tenant.transactions) == 3

        # Check transaction order (newest last in list)
        tx1, tx2, tx3 = tenant.transactions
        assert tx1.amount == 100  # Credit
        assert tx2.amount == -3  # Debit standard
        assert tx3.amount == -1  # Debit simple
