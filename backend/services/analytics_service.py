"""Analytics service for tracking user activity and system metrics.

Tracks:
- API calls per user/day
- BizPlan generations (template vs AI)
- Feature usage by tier
- Daily/weekly/monthly aggregations
- Export to JSON
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from collections import defaultdict
import json

from backend.models.user import User
from backend.models.analytics_event import AnalyticsEvent
from backend.models.enums import SubscriptionTier


class AnalyticsService:
    """Service for tracking and analyzing user activity."""

    def __init__(self, db_session):
        """Initialize analytics service.

        Args:
            db_session: Database session for queries
        """
        self.db = db_session

    def track_event(
        self,
        user_id: str,
        event_type: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> AnalyticsEvent:
        """Track a user event.

        Args:
            user_id: User identifier
            event_type: Type of event (e.g., 'api_call', 'bizplan_generation')
            metadata: Additional event data

        Returns:
            Created analytics event

        Example:
            track_event('user123', 'bizplan_generation', {
                'method': 'ai',
                'template': 'saas',
                'tier': 'growth'
            })
        """
        event = AnalyticsEvent(
            user_id=user_id,
            event_type=event_type,
            metadata=metadata or {},
            timestamp=datetime.utcnow()
        )

        self.db.add(event)
        self.db.commit()

        return event

    def track_api_call(
        self,
        user_id: str,
        endpoint: str,
        method: str,
        status_code: int,
        response_time_ms: Optional[float] = None
    ) -> AnalyticsEvent:
        """Track an API call.

        Args:
            user_id: User identifier
            endpoint: API endpoint path
            method: HTTP method
            status_code: Response status code
            response_time_ms: Response time in milliseconds

        Returns:
            Created analytics event
        """
        return self.track_event(
            user_id=user_id,
            event_type='api_call',
            metadata={
                'endpoint': endpoint,
                'method': method,
                'status_code': status_code,
                'response_time_ms': response_time_ms
            }
        )

    def track_bizplan_generation(
        self,
        user_id: str,
        method: str,
        template: Optional[str] = None,
        tier: Optional[str] = None,
        success: bool = True
    ) -> AnalyticsEvent:
        """Track a business plan generation.

        Args:
            user_id: User identifier
            method: Generation method ('template' or 'ai')
            template: Template used (if method='template')
            tier: User subscription tier
            success: Whether generation succeeded

        Returns:
            Created analytics event
        """
        return self.track_event(
            user_id=user_id,
            event_type='bizplan_generation',
            metadata={
                'method': method,
                'template': template,
                'tier': tier,
                'success': success
            }
        )

    def track_feature_usage(
        self,
        user_id: str,
        feature: str,
        tier: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> AnalyticsEvent:
        """Track feature usage by tier.

        Args:
            user_id: User identifier
            feature: Feature name
            tier: User subscription tier
            metadata: Additional feature-specific data

        Returns:
            Created analytics event
        """
        event_metadata = {'feature': feature, 'tier': tier}
        if metadata:
            event_metadata.update(metadata)

        return self.track_event(
            user_id=user_id,
            event_type='feature_usage',
            metadata=event_metadata
        )

    def get_user_stats(
        self,
        user_id: str,
        period: str = 'daily',
        days: int = 30
    ) -> Dict[str, Any]:
        """Get statistics for a specific user.

        Args:
            user_id: User identifier
            period: Aggregation period ('daily', 'weekly', 'monthly')
            days: Number of days to look back

        Returns:
            User statistics dictionary

        Example:
            {
                'user_id': 'user123',
                'period': 'daily',
                'date_range': {'start': '2025-01-01', 'end': '2025-01-24'},
                'total_events': 150,
                'api_calls': {
                    'total': 100,
                    'by_endpoint': {...},
                    'avg_response_time_ms': 45.2
                },
                'bizplan_generations': {
                    'total': 25,
                    'by_method': {'ai': 15, 'template': 10},
                    'by_template': {'saas': 8, 'ecommerce': 2},
                    'success_rate': 0.96
                },
                'feature_usage': {
                    'total': 25,
                    'by_feature': {...},
                    'by_tier': {...}
                },
                'activity_timeline': [...]
            }
        """
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)

        # Get all events for user in period
        events = self.db.query(AnalyticsEvent).filter(
            AnalyticsEvent.user_id == user_id,
            AnalyticsEvent.timestamp >= start_date,
            AnalyticsEvent.timestamp <= end_date
        ).all()

        # Initialize stats
        stats = {
            'user_id': user_id,
            'period': period,
            'date_range': {
                'start': start_date.isoformat(),
                'end': end_date.isoformat()
            },
            'total_events': len(events),
            'api_calls': self._aggregate_api_calls(events),
            'bizplan_generations': self._aggregate_bizplan_generations(events),
            'feature_usage': self._aggregate_feature_usage(events),
            'activity_timeline': self._build_activity_timeline(events, period)
        }

        return stats

    def get_global_stats(
        self,
        period: str = 'daily',
        days: int = 30
    ) -> Dict[str, Any]:
        """Get global system statistics.

        Args:
            period: Aggregation period ('daily', 'weekly', 'monthly')
            days: Number of days to look back

        Returns:
            Global statistics dictionary

        Example:
            {
                'period': 'daily',
                'date_range': {'start': '2025-01-01', 'end': '2025-01-24'},
                'total_users': 50,
                'total_events': 5000,
                'active_users': {
                    'daily': 35,
                    'weekly': 42,
                    'monthly': 50
                },
                'api_calls': {
                    'total': 3500,
                    'by_endpoint': {...},
                    'avg_response_time_ms': 52.3
                },
                'bizplan_generations': {
                    'total': 850,
                    'by_method': {'ai': 500, 'template': 350},
                    'success_rate': 0.95
                },
                'feature_usage_by_tier': {
                    'free': {...},
                    'growth': {...},
                    'agency': {...}
                },
                'activity_timeline': [...]
            }
        """
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)

        # Get all events in period
        events = self.db.query(AnalyticsEvent).filter(
            AnalyticsEvent.timestamp >= start_date,
            AnalyticsEvent.timestamp <= end_date
        ).all()

        # Get user counts
        total_users = self.db.query(User).count()

        # Active users (different periods)
        active_daily = len(set(
            e.user_id for e in events
            if e.timestamp >= end_date - timedelta(days=1)
        ))
        active_weekly = len(set(
            e.user_id for e in events
            if e.timestamp >= end_date - timedelta(days=7)
        ))
        active_monthly = len(set(e.user_id for e in events))

        stats = {
            'period': period,
            'date_range': {
                'start': start_date.isoformat(),
                'end': end_date.isoformat()
            },
            'total_users': total_users,
            'total_events': len(events),
            'active_users': {
                'daily': active_daily,
                'weekly': active_weekly,
                'monthly': active_monthly
            },
            'api_calls': self._aggregate_api_calls(events),
            'bizplan_generations': self._aggregate_bizplan_generations(events),
            'feature_usage_by_tier': self._aggregate_feature_usage_by_tier(events),
            'activity_timeline': self._build_activity_timeline(events, period)
        }

        return stats

    def export_to_json(
        self,
        stats: Dict[str, Any],
        filepath: Optional[str] = None
    ) -> str:
        """Export statistics to JSON.

        Args:
            stats: Statistics dictionary to export
            filepath: Optional file path to write JSON

        Returns:
            JSON string
        """
        json_str = json.dumps(stats, indent=2, default=str)

        if filepath:
            with open(filepath, 'w') as f:
                f.write(json_str)

        return json_str

    # Private helper methods

    def _aggregate_api_calls(self, events: List[AnalyticsEvent]) -> Dict[str, Any]:
        """Aggregate API call events."""
        api_events = [e for e in events if e.event_type == 'api_call']

        if not api_events:
            return {
                'total': 0,
                'by_endpoint': {},
                'by_method': {},
                'by_status_code': {},
                'avg_response_time_ms': None
            }

        by_endpoint = defaultdict(int)
        by_method = defaultdict(int)
        by_status_code = defaultdict(int)
        response_times = []

        for event in api_events:
            meta = event.metadata

            endpoint = meta.get('endpoint', 'unknown')
            by_endpoint[endpoint] += 1

            method = meta.get('method', 'unknown')
            by_method[method] += 1

            status_code = meta.get('status_code', 0)
            by_status_code[str(status_code)] += 1

            if 'response_time_ms' in meta:
                response_times.append(meta['response_time_ms'])

        avg_response_time = (
            sum(response_times) / len(response_times)
            if response_times else None
        )

        return {
            'total': len(api_events),
            'by_endpoint': dict(by_endpoint),
            'by_method': dict(by_method),
            'by_status_code': dict(by_status_code),
            'avg_response_time_ms': avg_response_time
        }

    def _aggregate_bizplan_generations(
        self,
        events: List[AnalyticsEvent]
    ) -> Dict[str, Any]:
        """Aggregate business plan generation events."""
        bizplan_events = [e for e in events if e.event_type == 'bizplan_generation']

        if not bizplan_events:
            return {
                'total': 0,
                'by_method': {},
                'by_template': {},
                'success_rate': None
            }

        by_method = defaultdict(int)
        by_template = defaultdict(int)
        successes = 0

        for event in bizplan_events:
            meta = event.metadata

            method = meta.get('method', 'unknown')
            by_method[method] += 1

            template = meta.get('template')
            if template:
                by_template[template] += 1

            if meta.get('success', False):
                successes += 1

        success_rate = successes / len(bizplan_events) if bizplan_events else None

        return {
            'total': len(bizplan_events),
            'by_method': dict(by_method),
            'by_template': dict(by_template),
            'success_rate': success_rate
        }

    def _aggregate_feature_usage(
        self,
        events: List[AnalyticsEvent]
    ) -> Dict[str, Any]:
        """Aggregate feature usage events."""
        feature_events = [e for e in events if e.event_type == 'feature_usage']

        if not feature_events:
            return {
                'total': 0,
                'by_feature': {},
                'by_tier': {}
            }

        by_feature = defaultdict(int)
        by_tier = defaultdict(int)

        for event in feature_events:
            meta = event.metadata

            feature = meta.get('feature', 'unknown')
            by_feature[feature] += 1

            tier = meta.get('tier', 'unknown')
            by_tier[tier] += 1

        return {
            'total': len(feature_events),
            'by_feature': dict(by_feature),
            'by_tier': dict(by_tier)
        }

    def _aggregate_feature_usage_by_tier(
        self,
        events: List[AnalyticsEvent]
    ) -> Dict[str, Dict[str, int]]:
        """Aggregate feature usage grouped by tier."""
        feature_events = [e for e in events if e.event_type == 'feature_usage']

        tier_features = defaultdict(lambda: defaultdict(int))

        for event in feature_events:
            meta = event.metadata
            tier = meta.get('tier', 'unknown')
            feature = meta.get('feature', 'unknown')
            tier_features[tier][feature] += 1

        return {
            tier: dict(features)
            for tier, features in tier_features.items()
        }

    def _build_activity_timeline(
        self,
        events: List[AnalyticsEvent],
        period: str
    ) -> List[Dict[str, Any]]:
        """Build activity timeline aggregated by period.

        Args:
            events: List of events to aggregate
            period: Aggregation period ('daily', 'weekly', 'monthly')

        Returns:
            List of timeline entries with event counts
        """
        if not events:
            return []

        # Determine grouping function
        if period == 'daily':
            key_fn = lambda dt: dt.date().isoformat()
        elif period == 'weekly':
            key_fn = lambda dt: f"{dt.year}-W{dt.isocalendar()[1]:02d}"
        else:  # monthly
            key_fn = lambda dt: f"{dt.year}-{dt.month:02d}"

        # Group events by period
        timeline = defaultdict(lambda: defaultdict(int))

        for event in events:
            period_key = key_fn(event.timestamp)
            timeline[period_key]['total'] += 1
            timeline[period_key][event.event_type] += 1

        # Convert to sorted list
        return [
            {'period': period_key, **counts}
            for period_key, counts in sorted(timeline.items())
        ]
