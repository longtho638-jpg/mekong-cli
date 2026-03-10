"""
Analytics Queries — ROIaaS Phase 5

Query builders for dashboard metrics:
- API call volume (daily/weekly/monthly)
- Active license keys
- Top endpoints
- Revenue estimation
"""

from typing import List, Dict, Any, Optional

from src.db.database import DatabaseConnection


class AnalyticsQueries:
    """Analytics query builders for ROIaaS dashboard."""

    def __init__(self, db: Optional[DatabaseConnection] = None) -> None:
        """Initialize with database connection."""
        self._db = db or DatabaseConnection()

    async def get_daily_usage(
        self,
        start_date: str,
        end_date: str,
    ) -> List[Dict[str, Any]]:
        """
        Get API calls per day for date range.

        Args:
            start_date: YYYY-MM-DD format
            end_date: YYYY-MM-DD format

        Returns:
            List of {date, calls, unique_licenses}
        """
        query = """
            SELECT
                date::text,
                COALESCE(SUM(commands_count), 0) as calls,
                COUNT(DISTINCT key_id) as unique_licenses
            FROM usage_records
            WHERE date BETWEEN $1 AND $2
            GROUP BY date
            ORDER BY date ASC
        """
        return await self._db.fetch_all(query, (start_date, end_date))

    async def get_weekly_usage(self) -> List[Dict[str, Any]]:
        """
        Get API calls per week (last 12 weeks).

        Returns:
            List of {week_start, calls, unique_licenses}
        """
        query = """
            SELECT
                date_trunc('week', date)::date as week_start,
                COALESCE(SUM(commands_count), 0) as calls,
                COUNT(DISTINCT key_id) as unique_licenses
            FROM usage_records
            WHERE date >= CURRENT_DATE - INTERVAL '12 weeks'
            GROUP BY week_start
            ORDER BY week_start ASC
        """
        return await self._db.fetch_all(query)

    async def get_monthly_usage(self) -> List[Dict[str, Any]]:
        """
        Get API calls per month (last 12 months).

        Returns:
            List of {month, calls, unique_licenses}
        """
        query = """
            SELECT
                date_trunc('month', date)::date as month,
                COALESCE(SUM(commands_count), 0) as calls,
                COUNT(DISTINCT key_id) as unique_licenses
            FROM usage_records
            WHERE date >= CURRENT_DATE - INTERVAL '12 months'
            GROUP BY month
            ORDER BY month ASC
        """
        return await self._db.fetch_all(query)

    async def get_active_licenses(self) -> List[Dict[str, Any]]:
        """
        Get all active license keys with usage data.

        Returns:
            List of {license_key, tier, email, status, total_commands, last_active}
        """
        query = """
            SELECT
                l.license_key,
                l.tier,
                l.email,
                l.status,
                l.created_at,
                COALESCE(SUM(u.commands_count), 0) as total_commands,
                MAX(u.date) as last_active
            FROM licenses l
            LEFT JOIN usage_records u ON l.key_id = u.key_id
            WHERE l.status = 'active'
            GROUP BY l.id, l.license_key, l.tier, l.email, l.status, l.created_at
            ORDER BY total_commands DESC
        """
        return await self._db.fetch_all(query)

    async def get_top_endpoints(self, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get most used endpoints.

        Args:
            limit: Number of top endpoints to return

        Returns:
            List of {endpoint, calls, avg_duration}
        """
        query = """
            SELECT
                endpoint,
                COUNT(*) as calls,
                AVG(duration_ms) as avg_duration
            FROM api_logs
            WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY endpoint
            ORDER BY calls DESC
            LIMIT $1
        """
        try:
            return await self._db.fetch_all(query, (limit,))
        except Exception:
            # Fallback if api_logs table doesn't exist
            return []

    async def get_revenue_summary(self) -> Dict[str, Any]:
        """
        Get estimated MRR from subscription data.

        Returns:
            {total_mrr, by_tier, active_subscriptions}
        """
        # Get MRR by tier (estimated based on tier pricing)
        tier_pricing = {
            'free': 0,
            'trial': 0,
            'starter': 29,
            'growth': 79,
            'pro': 199,
            'enterprise': 499,
        }

        query = """
            SELECT
                tier,
                COUNT(*) as count,
                SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_count
            FROM licenses
            GROUP BY tier
        """
        results = await self._db.fetch_all(query)

        total_mrr = 0
        by_tier = {}

        for row in results:
            tier = row['tier']
            price = tier_pricing.get(tier, 0)
            mrr = price * row['active_count']
            total_mrr += mrr
            by_tier[tier] = {
                'count': row['count'],
                'active': row['active_count'],
                'mrr': mrr,
            }

        return {
            'total_mrr': total_mrr,
            'by_tier': by_tier,
            'active_subscriptions': sum(r['active_count'] for r in results),
        }

    async def get_license_tier_distribution(self) -> Dict[str, Any]:
        """
        Get count of licenses by tier.

        Returns:
            {total, by_tier: {tier: count}}
        """
        query = """
            SELECT
                tier,
                status,
                COUNT(*) as count
            FROM licenses
            GROUP BY tier, status
            ORDER BY tier
        """
        results = await self._db.fetch_all(query)

        by_tier: Dict[str, int] = {}
        by_status: Dict[str, int] = {}
        total = 0

        for row in results:
            tier = row['tier']
            status = row['status']

            by_tier[tier] = by_tier.get(tier, 0) + row['count']
            by_status[status] = by_status.get(status, 0) + row['count']
            total += row['count']

        return {
            'total': total,
            'by_tier': by_tier,
            'by_status': by_status,
        }

    async def get_license_health_summary(self) -> Dict[str, Any]:
        """
        Get license health summary by status.

        Returns:
            Dict with counts by status: ACTIVE, SUSPENDED, REVOKED, EXPIRED, INVALID
        """
        query = """
            SELECT
                status,
                COUNT(*) as count
            FROM licenses
            GROUP BY status
            ORDER BY status
        """
        results = await self._db.fetch_all(query)

        by_status: Dict[str, int] = {}
        total = 0

        for row in results:
            status = row['status']
            count = int(row['count'])
            by_status[status.upper()] = count
            total += count

        # Get additional health metrics
        expiring_soon_query = """
            SELECT COUNT(*) as count
            FROM licenses
            WHERE status = 'active'
              AND expires_at IS NOT NULL
              AND expires_at BETWEEN NOW() AND NOW() + INTERVAL '7 days'
        """
        expiring_soon = await self._db.fetch_one(expiring_soon_query)

        expired_query = """
            SELECT COUNT(*) as count
            FROM licenses
            WHERE status = 'active'
              AND expires_at < NOW()
        """
        expired = await self._db.fetch_one(expired_query)

        return {
            'total': total,
            'by_status': by_status,
            'active_count': by_status.get('ACTIVE', 0),
            'suspended_count': by_status.get('SUSPENDED', 0),
            'revoked_count': by_status.get('REVOKED', 0),
            'expired_count': by_status.get('EXPIRED', 0),
            'invalid_count': by_status.get('INVALID', 0),
            'expiring_soon_count': int(expiring_soon['count']) if expiring_soon else 0,
            'expired_but_active_count': int(expired['count']) if expired else 0,
        }

    async def get_expired_licenses_for_renewal(self, days: int = 7) -> List[Dict[str, Any]]:
        """
        Get expired or expiring licenses that need renewal prompts.

        Args:
            days: Look ahead/behind window in days (default: 7)

        Returns:
            List of license records needing renewal attention
        """
        query = """
            SELECT
                license_key,
                email,
                org_name,
                tier,
                status,
                expires_at,
                created_at,
                CASE
                    WHEN expires_at < NOW() THEN 'expired'
                    WHEN expires_at <= NOW() + INTERVAL '%s days' THEN 'expiring_soon'
                    ELSE 'active'
                END as renewal_status,
                CASE
                    WHEN expires_at < NOW() THEN EXTRACT(DAY FROM NOW() - expires_at)::int
                    ELSE EXTRACT(DAY FROM expires_at - NOW())::int
                END as days_since_or_until_expiry
            FROM licenses
            WHERE status = 'active'
              AND expires_at IS NOT NULL
              AND (
                  expires_at < NOW()
                  OR expires_at <= NOW() + INTERVAL '%s days'
              )
            ORDER BY expires_at ASC
        """ % (days, days)

        results = await self._db.fetch_all(query)
        return [dict(row) for row in results]
