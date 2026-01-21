from typing import Dict, List, Optional
from pydantic import BaseModel, Field

class RevenueConfig(BaseModel):
    """Configuration for Revenue Automation"""

    # Currency Settings
    default_currency: str = Field("USD", description="Base currency for reporting")
    supported_currencies: List[str] = ["USD", "VND", "EUR"]

    # Alert Thresholds
    churn_warning_threshold: float = Field(5.0, description="Churn rate % to trigger warning")
    churn_critical_threshold: float = Field(8.0, description="Churn rate % to trigger critical alert")
    mrr_drop_threshold: float = Field(10.0, description="MRR drop % to trigger alert")

    # Collection Settings
    dunning_retries: int = 3
    dunning_period_days: int = 14
    grace_period_days: int = 3

    # Invoice Settings
    auto_invoice_generation: bool = True
    invoice_due_days: int = 7
    tax_rate: float = 0.0

    # Integration Settings
    stripe_enabled: bool = False
    paypal_enabled: bool = False
    sepay_enabled: bool = False

    class Config:
        env_prefix = "REVENUE_"

# Default Configuration
config = RevenueConfig()
