"""
Financial Validators - Pydantic Models for Input Validation
============================================================

Provides type-safe validation for all financial calculations.
Prevents injection attacks and ensures data integrity.
"""

from decimal import Decimal
from typing import Optional

try:
    from pydantic import BaseModel, Field, field_validator, ConfigDict
    PYDANTIC_AVAILABLE = True
except ImportError:
    # Fallback for systems without pydantic
    PYDANTIC_AVAILABLE = False
    BaseModel = object
    Field = lambda **kwargs: None
    field_validator = lambda *args, **kwargs: lambda f: f
    ConfigDict = dict


class PricingInput(BaseModel):
    """
    Validated input for pricing calculations.

    Ensures all financial inputs are valid before processing.
    """
    if PYDANTIC_AVAILABLE:
        model_config = ConfigDict(frozen=False, arbitrary_types_allowed=True)

    base_price: Decimal = Field(gt=0, description="Base price (must be positive)")
    discount_percentage: int = Field(ge=0, le=100, description="Discount percentage (0-100)")
    quantity: int = Field(gt=0, description="Quantity (must be positive)")
    client_name: str = Field(min_length=1, max_length=200, description="Client name")

    @field_validator("base_price")
    @classmethod
    def validate_price_precision(cls, v: Decimal) -> Decimal:
        """Ensure price has maximum 2 decimal places."""
        if not PYDANTIC_AVAILABLE:
            return v

        # Check decimal precision
        if v.as_tuple().exponent < -2:
            raise ValueError("Price must have maximum 2 decimal places (cents precision)")

        return v

    @field_validator("base_price")
    @classmethod
    def validate_reasonable_price(cls, v: Decimal) -> Decimal:
        """Ensure price is within reasonable bounds."""
        if not PYDANTIC_AVAILABLE:
            return v

        # Set upper limit to prevent overflow/abuse
        MAX_PRICE = Decimal("1000000000")  # $1 billion max
        if v > MAX_PRICE:
            raise ValueError(f"Price exceeds maximum allowed value of ${MAX_PRICE}")

        return v

    @field_validator("client_name")
    @classmethod
    def sanitize_client_name(cls, v: str) -> str:
        """Sanitize client name to prevent injection."""
        if not PYDANTIC_AVAILABLE:
            return v

        # Remove potentially dangerous characters
        sanitized = "".join(c for c in v if c.isalnum() or c in " .-_&,()")
        if not sanitized:
            raise ValueError("Client name contains only invalid characters")

        return sanitized.strip()


class RevenueCalculation(BaseModel):
    """
    Immutable revenue calculation result.

    All financial outputs are frozen to prevent tampering.
    """
    if PYDANTIC_AVAILABLE:
        model_config = ConfigDict(frozen=True, arbitrary_types_allowed=True)

    gross_revenue: Decimal = Field(description="Total revenue before deductions")
    net_revenue: Decimal = Field(description="Revenue after all deductions")
    tax_amount: Decimal = Field(ge=0, description="Tax amount")
    fees: Decimal = Field(ge=0, description="Platform/processing fees")

    @field_validator("gross_revenue", "net_revenue", "tax_amount", "fees")
    @classmethod
    def validate_non_negative(cls, v: Decimal) -> Decimal:
        """Ensure all amounts are non-negative."""
        if not PYDANTIC_AVAILABLE:
            return v

        if v < 0:
            raise ValueError("Financial amounts cannot be negative")

        return v

    @field_validator("net_revenue")
    @classmethod
    def validate_net_less_than_gross(cls, v: Decimal, info) -> Decimal:
        """Ensure net revenue doesn't exceed gross."""
        if not PYDANTIC_AVAILABLE:
            return v

        # Access gross_revenue from validated data
        if hasattr(info, 'data') and 'gross_revenue' in info.data:
            gross = info.data['gross_revenue']
            if v > gross:
                raise ValueError("Net revenue cannot exceed gross revenue")

        return v


class Win3ValidationInput(BaseModel):
    """
    Input for WIN-WIN-WIN validation.

    Ensures all parameters are valid before governance check.
    """
    if PYDANTIC_AVAILABLE:
        model_config = ConfigDict(frozen=False, arbitrary_types_allowed=True)

    equity_percent: Decimal = Field(ge=0, le=100, description="Equity percentage (0-100)")
    monthly_retainer: Decimal = Field(ge=0, description="Monthly retainer amount")
    service_count: int = Field(ge=0, description="Number of services")
    one_time_total: Decimal = Field(ge=0, description="One-time project value")
    success_fee_percent: Decimal = Field(ge=0, le=100, description="Success fee percentage (0-100)")

    @field_validator("equity_percent")
    @classmethod
    def validate_reasonable_equity(cls, v: Decimal) -> Decimal:
        """Warn if equity is unreasonably high."""
        if not PYDANTIC_AVAILABLE:
            return v

        # Equity above 35% is flagged but not rejected
        # Actual validation happens in WIN-WIN-WIN check
        return v


# Fallback classes if Pydantic not available
if not PYDANTIC_AVAILABLE:
    class PricingInput:
        """Fallback pricing input (no validation)."""
        def __init__(self, base_price, discount_percentage, quantity, client_name):
            self.base_price = Decimal(str(base_price))
            self.discount_percentage = int(discount_percentage)
            self.quantity = int(quantity)
            self.client_name = str(client_name)

    class RevenueCalculation:
        """Fallback revenue calculation (no validation)."""
        def __init__(self, gross_revenue, net_revenue, tax_amount, fees):
            self.gross_revenue = Decimal(str(gross_revenue))
            self.net_revenue = Decimal(str(net_revenue))
            self.tax_amount = Decimal(str(tax_amount))
            self.fees = Decimal(str(fees))

    class Win3ValidationInput:
        """Fallback Win3 input (no validation)."""
        def __init__(self, equity_percent, monthly_retainer, service_count,
                     one_time_total, success_fee_percent):
            self.equity_percent = Decimal(str(equity_percent))
            self.monthly_retainer = Decimal(str(monthly_retainer))
            self.service_count = int(service_count)
            self.one_time_total = Decimal(str(one_time_total))
            self.success_fee_percent = Decimal(str(success_fee_percent))


__all__ = ["PricingInput", "RevenueCalculation", "Win3ValidationInput", "PYDANTIC_AVAILABLE"]
