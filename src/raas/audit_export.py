"""
Audit Export Module — ROIaaS Phase 7

Export compliance audit logs to CSV, JSON, and PDF formats.
Query violation_events, rate_limit_events, and validation_logs tables.
"""

import re
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime, timezone
from dataclasses import dataclass, field
import csv
import json
import logging

from src.db.database import get_database, DatabaseConnection

logger = logging.getLogger(__name__)


ExportFormat = Literal["csv", "json", "pdf"]


@dataclass
class ExportFilter:
    """Filter criteria for audit log export.

    Attributes:
        date_from: Start date (inclusive)
        date_to: End date (inclusive)
        license_key: Filter by specific license key ID
        event_type: Filter by event type (violation, rate_limit, validation)
        tenant_id: Filter by tenant ID
        limit: Maximum records to export
    """
    date_from: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    date_to: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    license_key: Optional[str] = None
    event_type: Optional[str] = None
    tenant_id: Optional[str] = None
    limit: int = 10000


class AuditExporter:
    """Export audit logs to various formats for compliance reporting.

    Features:
    - Query violation_events, rate_limit_events, validation_logs
    - Filter by date range, license key, event type
    - Export to CSV, JSON, PDF formats
    - Include report metadata and summary statistics
    """

    def __init__(self, db: Optional[DatabaseConnection] = None) -> None:
        """Initialize exporter with database connection.

        Args:
            db: Database connection instance
        """
        self._db = db or get_database()

    def _validate_filters(self, filters: ExportFilter) -> None:
        """Validate filter inputs to prevent SQL injection.

        Args:
            filters: ExportFilter to validate

        Raises:
            ValueError: If validation fails
        """
        # Validate license_key (alphanumeric, hyphens, underscores only)
        if filters.license_key:
            if not re.match(r'^[a-zA-Z0-9_-]{1,255}$', filters.license_key):
                raise ValueError(
                    "license_key must contain only alphanumeric characters, "
                    "hyphens, and underscores (max 255 chars)"
                )

        # Validate tenant_id (alphanumeric, hyphens, underscores only)
        if filters.tenant_id:
            if not re.match(r'^[a-zA-Z0-9_-]{1,255}$', filters.tenant_id):
                raise ValueError(
                    "tenant_id must contain only alphanumeric characters, "
                    "hyphens, and underscores (max 255 chars)"
                )

        # Validate limit
        if filters.limit < 1 or filters.limit > 100000:
            raise ValueError("limit must be between 1 and 100000")

        # Validate date range
        if filters.date_from > filters.date_to:
            raise ValueError("date_from must be before or equal to date_to")

    async def query_events(
        self,
        filters: ExportFilter
    ) -> Dict[str, List[Dict[str, Any]]]:
        """Query audit events based on filters.

        Args:
            filters: ExportFilter with query criteria

        Returns:
            Dict with keys: violation_events, rate_limit_events, validation_logs
        """
        # Input validation for SQL injection prevention
        self._validate_filters(filters)

        events = {
            "violation_events": [],
            "rate_limit_events": [],
            "validation_logs": [],
        }

        # Build WHERE clause
        where_clauses = []
        params_base = []
        param_idx = 1

        if filters.license_key or filters.tenant_id:
            key_id = filters.license_key or filters.tenant_id
            where_clauses.append(f"key_id = ${param_idx}")
            params_base.append(key_id)
            param_idx += 1

        date_from = filters.date_from.isoformat()
        date_to = filters.date_to.isoformat()

        # Query violation_events
        violation_query = f"""
            SELECT * FROM violation_events
            WHERE {' AND '.join(where_clauses)}
              AND occurred_at >= ${param_idx}
              AND occurred_at <= ${param_idx + 1}
            ORDER BY occurred_at DESC
            LIMIT ${param_idx + 2}
        """
        params = tuple(params_base) + (date_from, date_to, filters.limit)
        results = await self._db.fetch_all(violation_query, params)
        events["violation_events"] = [dict(row) for row in results]

        # Query rate_limit_events
        rate_query = f"""
            SELECT * FROM rate_limit_events
            WHERE tenant_id = ${1 if filters.license_key or filters.tenant_id else -1}
              AND created_at >= ${2 if filters.license_key or filters.tenant_id else 1}
              AND created_at <= ${3 if filters.license_key or filters.tenant_id else 2}
            ORDER BY created_at DESC
            LIMIT ${4 if filters.license_key or filters.tenant_id else 3}
        """
        rate_params = params_base + [date_from, date_to, filters.limit] if params_base else [date_from, date_to, filters.limit]
        if not filters.license_key and not filters.tenant_id:
            rate_query = """
                SELECT * FROM rate_limit_events
                WHERE created_at >= $1 AND created_at <= $2
                ORDER BY created_at DESC
                LIMIT $3
            """
        rate_results = await self._db.fetch_all(rate_query, tuple(rate_params))
        events["rate_limit_events"] = [dict(row) for row in rate_results]

        # Query license_validation_logs
        validation_query = f"""
            SELECT * FROM license_validation_logs
            WHERE {' AND '.join(where_clauses)}
              AND validated_at >= ${param_idx}
              AND validated_at <= ${param_idx + 1}
            ORDER BY validated_at DESC
            LIMIT ${param_idx + 2}
        """
        validation_params = tuple(params_base) + (date_from, date_to, filters.limit)
        validation_results = await self._db.fetch_all(validation_query, validation_params)
        events["validation_logs"] = [dict(row) for row in validation_results]

        return events

    def _generate_summary(self, events: Dict[str, List[Dict[str, Any]]]) -> Dict[str, Any]:
        """Generate summary statistics for exported data.

        Args:
            events: Dict of event lists from query_events

        Returns:
            Summary statistics dictionary
        """
        return {
            "export_timestamp": datetime.now(timezone.utc).isoformat(),
            "violation_count": len(events["violation_events"]),
            "rate_limit_count": len(events["rate_limit_events"]),
            "validation_count": len(events["validation_logs"]),
            "total_records": sum(len(v) for v in events.values()),
        }

    async def export_json(
        self,
        filters: ExportFilter,
        include_summary: bool = True
    ) -> str:
        """Export audit logs to JSON format.

        Args:
            filters: ExportFilter with query criteria
            include_summary: Include summary statistics in output

        Returns:
            JSON string with audit data
        """
        events = await self.query_events(filters)

        output = {"events": events}

        if include_summary:
            output["summary"] = self._generate_summary(events)

        return json.dumps(output, indent=2, default=str)

    async def export_csv(
        self,
        filters: ExportFilter,
        output_path: str
    ) -> str:
        """Export audit logs to CSV format.

        Creates separate CSV files for each event type.

        Args:
            filters: ExportFilter with query criteria
            output_path: Base path for output files (without extension)

        Returns:
            List of created file paths
        """
        events = await self.query_events(filters)
        created_files = []

        for event_type, records in events.items():
            if not records:
                continue

            file_path = f"{output_path}_{event_type}.csv"
            with open(file_path, "w", newline="", encoding="utf-8") as f:
                writer = csv.DictWriter(f, fieldnames=records[0].keys())
                writer.writeheader()
                writer.writerows(records)

            created_files.append(file_path)

        # Write summary file
        summary_path = f"{output_path}_summary.csv"
        summary = self._generate_summary(events)
        with open(summary_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(["Metric", "Value"])
            for key, value in summary.items():
                writer.writerow([key, value])
            writer.writerow(["Generated At", datetime.now(timezone.utc).isoformat()])

        created_files.append(summary_path)
        return output_path

    async def export_pdf(
        self,
        filters: ExportFilter,
        output_path: str,
        title: str = "Compliance Audit Report"
    ) -> str:
        """Export audit logs to PDF format.

        Note: Requires reportlab or weasyprint for PDF generation.
        Falls back to HTML if PDF libraries not available.

        Args:
            filters: ExportFilter with query criteria
            output_path: Output file path (.pdf or .html)
            title: Report title

        Returns:
            Output file path
        """
        events = await self.query_events(filters)
        summary = self._generate_summary(events)

        # Generate HTML content
        html_content = self._generate_html_report(events, summary, title)

        # Try to generate PDF with reportlab
        try:
            from reportlab.lib.pagesizes import letter
            from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table
            from reportlab.lib.styles import getSampleStyleSheet

            doc = SimpleDocTemplate(output_path, pagesize=letter)
            styles = getSampleStyleSheet()
            story = []

            # Title
            story.append(Paragraph(title, styles["Heading1"]))
            story.append(Spacer(1, 12))

            # Summary
            story.append(Paragraph("Summary Statistics", styles["Heading2"]))
            summary_data = [[k, str(v)] for k, v in summary.items()]
            summary_table = Table(summary_data)
            story.append(summary_table)
            story.append(Spacer(1, 12))

            # Event counts by type
            for event_type, records in events.items():
                story.append(Paragraph(f"{event_type.replace('_', ' ').title()}: {len(records)} records", styles["Heading3"]))
                if records:
                    # Add first 50 records as sample
                    for record in records[:50]:
                        record_text = " | ".join(f"{k}: {v}" for k, v in list(record.items())[:5])
                        story.append(Paragraph(record_text, styles["Normal"]))
                    if len(records) > 50:
                        story.append(Paragraph(f"... and {len(records) - 50} more records", styles["Italic"]))
                story.append(Spacer(1, 12))

            doc.build(story)
            return output_path

        except ImportError:
            # Fallback to HTML
            html_path = output_path.replace(".pdf", ".html")
            with open(html_path, "w", encoding="utf-8") as f:
                f.write(html_content)
            return html_path

    def _generate_html_report(
        self,
        events: Dict[str, List[Dict[str, Any]]],
        summary: Dict[str, Any],
        title: str
    ) -> str:
        """Generate HTML report content.

        Args:
            events: Dict of event lists
            summary: Summary statistics
            title: Report title

        Returns:
            HTML string
        """
        html = f"""<!DOCTYPE html>
<html>
<head>
    <title>{title}</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 40px; }}
        h1 {{ color: #333; }}
        h2 {{ color: #666; border-bottom: 1px solid #ccc; }}
        table {{ border-collapse: collapse; width: 100%; margin: 20px 0; }}
        th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
        th {{ background-color: #4CAF50; color: white; }}
        tr:nth-child(even) {{ background-color: #f2f2f2; }}
        .summary {{ background: #f9f9f9; padding: 20px; border-radius: 5px; }}
        .timestamp {{ color: #999; font-size: 12px; }}
    </style>
</head>
<body>
    <h1>{title}</h1>
    <p class="timestamp">Generated: {summary["export_timestamp"]}</p>

    <div class="summary">
        <h2>Summary</h2>
        <table>
            <tr><th>Metric</th><th>Value</th></tr>
"""
        for key, value in summary.items():
            if key != "export_timestamp":
                html += f"            <tr><td>{key}</td><td>{value}</td></tr>\n"

        html += """        </table>
    </div>
"""

        for event_type, records in events.items():
            html += f"""
    <h2>{event_type.replace('_', ' ').title()} ({len(records)} records)</h2>
"""
            if records:
                html += """    <table>
        <tr>
"""
                # Header row
                for col in list(records[0].keys())[:8]:
                    html += f"            <th>{col}</th>\n"
                html += """        </tr>
"""
                # Data rows (max 100 for readability)
                for record in records[:100]:
                    html += "        <tr>\n"
                    for col in list(record.keys())[:8]:
                        val = str(record[col])[:50] + "..." if len(str(record[col])) > 50 else record[col]
                        html += f"            <td>{val}</td>\n"
                    html += "        </tr>\n"
                html += """    </table>
"""
                if len(records) > 100:
                    html += f"    <p><em>... and {len(records) - 100} more records</em></p>\n"

        html += """
</body>
</html>"""
        return html


__all__ = [
    "AuditExporter",
    "ExportFilter",
    "ExportFormat",
]
