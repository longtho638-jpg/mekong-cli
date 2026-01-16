"""
Finance Module - Service Logic
"""
import logging
from typing import Dict, List

from .entities import ProfitLoss, FinancialRatio

logger = logging.getLogger(__name__)

class FinancialReportsService:
    """
    Financial Reports System.
    
    Orchestrates financial data aggregation, ratio calculation, and CFO-level reporting.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.pnl_history: List[ProfitLoss] = []
        self.ratios: Dict[str, FinancialRatio] = {}
        
        logger.info(f"Financial Reports system initialized for {agency_name}")
        self._init_demo_data()
    
    def _init_demo_data(self):
        """Seed the system with sample historical financial records."""
        logger.info("Loading demo financial history...")
        try:
            # Add latest
            self.add_pnl("Dec 2025", 85000.0, 25000.0, 35000.0)
            # Add previous manually
            self.pnl_history.append(ProfitLoss(
                "Nov 2025", 78000.0, 23000.0, 55000.0, 33000.0, 22000.0, 22000.0
            ))
        except Exception as e:
            logger.error(f"Demo data error: {e}")
    
    def add_pnl(
        self,
        period: str,
        revenue: float,
        cogs: float,
        op_expenses: float
    ) -> ProfitLoss:
        """Register a new Profit & Loss statement for a specific period."""
        if revenue < 0 or cogs < 0 or op_expenses < 0:
            raise ValueError("Financial figures must be non-negative")

        gross = revenue - cogs
        income = gross - op_expenses
        
        pnl = ProfitLoss(
            period=period, revenue=revenue, cogs=cogs,
            gross_profit=gross, operating_expenses=op_expenses,
            operating_income=income, net_income=income
        )
        self.pnl_history.insert(0, pnl)
        self.recalculate_all_ratios()
        logger.info(f"P&L added for {period}: Net ${income:,.0f}")
        return pnl
    
    def recalculate_all_ratios(self):
        """Update financial KPIs based on the latest history."""
        if not self.pnl_history: return
        
        latest = self.pnl_history[0]
        rev = max(1.0, latest.revenue)
        
        self.ratios["gross_margin"] = FinancialRatio("Gross Margin", (latest.gross_profit / rev) * 100, 70, "%")
        self.ratios["net_margin"] = FinancialRatio("Net Margin", (latest.net_income / rev) * 100, 25, "%")
        
        if len(self.pnl_history) > 1:
            prev_rev = max(1.0, self.pnl_history[1].revenue)
            growth = ((latest.revenue - prev_rev) / prev_rev) * 100
            self.ratios["growth"] = FinancialRatio("Revenue Growth", growth, 10, "%")
            
        logger.debug("Financial ratios updated.")

    def format_dashboard(self) -> str:
        """Render the CFO Financial Dashboard (Delegated to Presenter)."""
        # Avoid circular import at module level
        from .presentation import FinancePresenter
        return FinancePresenter.format_dashboard(self)
