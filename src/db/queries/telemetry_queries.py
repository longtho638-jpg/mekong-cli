"""
Telemetry Queries

Query builders for CLI telemetry analytics:
- Event type breakdown
- CLI version distribution
- Session statistics
- Command success rate
"""

from typing import List, Dict, Any, Optional

from src.db.database import DatabaseConnection


class TelemetryQueries:
    """Telemetry query builders for CLI analytics."""

    def __init__(self, db: Optional[DatabaseConnection] = None) -> None:
        """Initialize with database connection."""
        self._db = db or DatabaseConnection()

    async def get_telemetry_events(
        self,
        event_type: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        limit: int = 100,
    ) -> List[Dict[str, Any]]:
        """
        Get telemetry events with optional filters.

        Args:
            event_type: Filter by event type (e.g., 'session_started', 'command_executed')
            start_date: YYYY-MM-DD format
            end_date: YYYY-MM-DD format
            limit: Max events to return

        Returns:
            List of telemetry event records
        """
        conditions = []
        params = []

        if event_type:
            conditions.append("event_type = $" + str(len(params) + 1))
            params.append(event_type)

        if start_date:
            conditions.append("timestamp >= $" + str(len(params) + 1))
            params.append(start_date)

        if end_date:
            conditions.append("timestamp <= $" + str(len(params) + 1))
            params.append(end_date + " 23:59:59")

        where_clause = ""
        if conditions:
            where_clause = "WHERE " + " AND ".join(conditions)

        query = f"""
            SELECT
                id,
                event_type,
                anonymous_id,
                session_id,
                timestamp,
                cli_version,
                properties,
                created_at
            FROM telemetry_events
            {where_clause}
            ORDER BY timestamp DESC
            LIMIT ${len(params) + 1}
        """
        params.append(limit)

        return await self._db.fetch_all(query, tuple(params))

    async def get_cli_version_distribution(self) -> List[Dict[str, Any]]:
        """
        Get CLI version distribution from telemetry data.

        Returns:
            List of {cli_version, count, percentage}
        """
        query = """
            SELECT
                cli_version,
                COUNT(*) as count,
                ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
            FROM telemetry_events
            WHERE cli_version IS NOT NULL
            GROUP BY cli_version
            ORDER BY count DESC
        """
        return await self._db.fetch_all(query)

    async def get_session_statistics(self, range_days: int = 30) -> Dict[str, Any]:
        """
        Get session statistics for date range.

        Args:
            range_days: Number of days to analyze

        Returns:
            Dict with session stats: total_sessions, avg_duration, avg_commands, etc.
        """
        # Get session-level stats
        query = """
            SELECT
                session_id,
                COUNT(*) as command_count,
                MAX(timestamp) - MIN(timestamp) as session_duration
            FROM telemetry_events
            WHERE event_type = 'command_executed'
              AND timestamp >= NOW() - INTERVAL '%s days'
            GROUP BY session_id
        """ % range_days

        sessions = await self._db.fetch_all(query)

        if not sessions:
            return {
                "total_sessions": 0,
                "avg_duration_seconds": 0,
                "avg_commands_per_session": 0,
                "total_commands": 0,
            }

        total_sessions = len(sessions)
        total_commands = sum(s["command_count"] for s in sessions)

        # Calculate average duration (convert to seconds)
        total_duration_seconds = 0
        for s in sessions:
            if s["session_duration"]:
                try:
                    total_duration_seconds += s["session_duration"].total_seconds()
                except Exception:
                    pass

        return {
            "total_sessions": total_sessions,
            "avg_duration_seconds": round(total_duration_seconds / total_sessions, 2) if total_sessions else 0,
            "avg_commands_per_session": round(total_commands / total_sessions, 2) if total_sessions else 0,
            "total_commands": total_commands,
        }

    async def get_command_success_rate(
        self,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Get command success/failure ratio.

        Args:
            start_date: YYYY-MM-DD format
            end_date: YYYY-MM-DD format

        Returns:
            Dict with success_count, failure_count, success_rate
        """
        conditions = ["event_type = 'command_executed'"]
        params = []

        if start_date:
            conditions.append("timestamp >= $" + str(len(params) + 1))
            params.append(start_date)

        if end_date:
            conditions.append("timestamp <= $" + str(len(params) + 1))
            params.append(end_date + " 23:59:59")

        where_clause = "WHERE " + " AND ".join(conditions)

        query = f"""
            SELECT
                COUNT(*) FILTER (WHERE (properties->>'exit_code')::int = 0) as success_count,
                COUNT(*) FILTER (WHERE (properties->>'exit_code')::int != 0) as failure_count,
                COUNT(*) as total
            FROM telemetry_events
            {where_clause}
        """

        result = await self._db.fetch_one(query, tuple(params))

        success = int(result["success_count"]) if result["success_count"] else 0
        failure = int(result["failure_count"]) if result["failure_count"] else 0
        total = int(result["total"]) if result["total"] else 0

        return {
            "success_count": success,
            "failure_count": failure,
            "total": total,
            "success_rate": round((success / total * 100), 2) if total > 0 else 0,
        }

    async def get_telemetry_daily_stats(
        self,
        start_date: str,
        end_date: str,
    ) -> List[Dict[str, Any]]:
        """
        Get daily telemetry statistics.

        Args:
            start_date: YYYY-MM-DD format
            end_date: YYYY-MM-DD format

        Returns:
            List of {date, event_type, event_count, unique_users, unique_sessions}
        """
        query = """
            SELECT
                DATE(timestamp) as date,
                event_type,
                COUNT(*) as event_count,
                COUNT(DISTINCT anonymous_id) as unique_users,
                COUNT(DISTINCT session_id) as unique_sessions
            FROM telemetry_events
            WHERE timestamp BETWEEN $1 AND $2
            GROUP BY DATE(timestamp), event_type
            ORDER BY date ASC, event_type
        """
        return await self._db.fetch_all(query, (start_date, end_date))

    async def get_error_events(
        self,
        limit: int = 50,
    ) -> List[Dict[str, Any]]:
        """
        Get recent error events.

        Args:
            limit: Max events to return

        Returns:
            List of error event records
        """
        query = """
            SELECT
                id,
                anonymous_id,
                session_id,
                timestamp,
                cli_version,
                properties->>'error_type' as error_type,
                properties->>'error_message_hash' as error_message_hash,
                properties->>'command' as command
            FROM telemetry_events
            WHERE event_type = 'error_occurred'
            ORDER BY timestamp DESC
            LIMIT $1
        """
        return await self._db.fetch_all(query, (limit,))
