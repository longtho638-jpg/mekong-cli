"""
Proxy for entity imports to handle both package and direct execution for Analytics.
"""
try:
    from ...presenters.analytics import AnalyticsPresenter
    from ...repositories.analytics import AnalyticsRepository
    from ...services.analytics import (
        AnalyticsCalculationEngine,
        MetricPeriod,
        RevenueEntry,
        RevenueType,
    )
except ImportError:
    try:
        from core.presenters.analytics import AnalyticsPresenter
        from core.repositories.analytics import AnalyticsRepository
        from core.services.analytics import (
            AnalyticsCalculationEngine,
            MetricPeriod,
            RevenueEntry,
            RevenueType,
        )
    except ImportError:
        from presenters.analytics_presenter import AnalyticsPresenter
        from repositories.analytics_repository import AnalyticsRepository
        from services.analytics_service import (
            AnalyticsCalculationEngine,
            MetricPeriod,
            RevenueEntry,
        )
