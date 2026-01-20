"""
Money Maker Governance Logic.
"""
from .models import Quote, Win3Result


class Win3Governance:
    """
    WIN-WIN-WIN Governance Engine.

    Ensures the deal benefits Owner, Agency, and Client.
    """

    def validate(self, quote: Quote) -> Win3Result:
        """
        WIN-WIN-WIN Governance Check.

        Ensures the deal benefits Owner, Agency, and Client.
        """
        warnings = []
        score = 100

        # OWNER WIN check
        if quote.equity_percent <= 0 and quote.monthly_retainer < 1000:
            warnings.append("Low owner alignment (no equity + low cashflow)")
            score -= 30

        # AGENCY WIN check
        if quote.monthly_retainer < 2000 and quote.success_fee_percent < 1:
            warnings.append("Agency risk: Recurring revenue below sustainability threshold")
            score -= 20

        # CLIENT WIN check
        if not quote.services:
            warnings.append("Zero client value: No services defined")
            score -= 50

        # Ethical boundaries
        if quote.equity_percent > 35:
            warnings.append("Equity too high: Risk of founder demotivation")
            score -= 20

        is_valid = score >= 65 and not any("Zero " in w for w in warnings)

        return Win3Result(
            is_valid=is_valid,
            score=max(0, score),
            details={
                "owner": f"Equity {quote.equity_percent}% | ${quote.monthly_retainer}/mo",
                "agency": f"Retainer ${quote.monthly_retainer}/mo | {quote.success_fee_percent}% success",
                "client": f"{len(quote.services)} Modules | ${quote.one_time_total} Project Value",
            },
            warnings=warnings,
        )
