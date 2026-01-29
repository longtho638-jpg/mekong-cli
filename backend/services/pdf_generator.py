"""
PDF Generator Service
=====================

Generates executive summary PDF reports using ReportLab.
Includes charts, key metrics, and strategic insights.
"""

import io
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.graphics.charts.lineplots import LinePlot
from reportlab.graphics.shapes import Drawing
from reportlab.graphics.widgets.markers import makeMarker
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    Image,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

logger = logging.getLogger(__name__)


class PDFGenerator:
    """Service for generating PDF reports."""

    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()

    def _setup_custom_styles(self):
        """Define custom paragraph styles."""
        self.styles.add(
            ParagraphStyle(
                name="ReportTitle",
                parent=self.styles["Heading1"],
                fontSize=24,
                leading=30,
                alignment=TA_CENTER,
                spaceAfter=20,
                textColor=colors.HexColor("#1a365d"),
            )
        )

        self.styles.add(
            ParagraphStyle(
                name="SectionTitle",
                parent=self.styles["Heading2"],
                fontSize=16,
                leading=20,
                spaceBefore=15,
                spaceAfter=10,
                textColor=colors.HexColor("#2d3748"),
                borderPadding=(0, 0, 5, 0),
                borderWidth=0,
                borderColor=colors.HexColor("#e2e8f0"),
            )
        )

        self.styles.add(
            ParagraphStyle(
                name="MetricLabel",
                parent=self.styles["Normal"],
                fontSize=10,
                textColor=colors.HexColor("#718096"),
                alignment=TA_CENTER,
            )
        )

        self.styles.add(
            ParagraphStyle(
                name="MetricValue",
                parent=self.styles["Normal"],
                fontSize=18,
                leading=22,
                textColor=colors.HexColor("#2d3748"),
                alignment=TA_CENTER,
                fontName="Helvetica-Bold",
            )
        )

        self.styles.add(
            ParagraphStyle(
                name="InsightText",
                parent=self.styles["Normal"],
                fontSize=10,
                leading=14,
                textColor=colors.HexColor("#4a5568"),
            )
        )

    def generate_executive_report(
        self,
        metrics: Dict[str, Any],
        trends: List[Dict[str, Any]],
        insights: List[str],
        start_date: str,
        end_date: str,
    ) -> bytes:
        """
        Generate Executive Summary PDF.

        Args:
            metrics: Key KPIs (MRR, ARR, Churn, etc.)
            trends: List of daily/weekly data points for charts
            insights: Automated strategic insights
            start_date: Report start date string
            end_date: Report end date string

        Returns:
            PDF bytes
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer, pagesize=letter, rightMargin=50, leftMargin=50, topMargin=50, bottomMargin=50
        )

        elements = []

        # 1. Header
        elements.append(Paragraph("Executive Summary Report", self.styles["ReportTitle"]))
        elements.append(Paragraph(f"Period: {start_date} to {end_date}", self.styles["Normal"]))
        elements.append(
            Paragraph(
                f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}", self.styles["Normal"]
            )
        )
        elements.append(Spacer(1, 20))

        # 2. Key Metrics Grid
        elements.append(Paragraph("Key Performance Indicators", self.styles["SectionTitle"]))
        elements.append(Spacer(1, 10))

        # Format metrics
        mrr = f"${metrics.get('mrr', 0):,.2f}"
        arr = f"${metrics.get('arr', 0):,.2f}"
        churn = f"{metrics.get('customer_churn_rate', 0):.2f}%"
        ltv = f"${metrics.get('avg_ltv', 0):,.2f}"
        active_subs = str(metrics.get("active_subscribers", 0))
        new_subs = str(metrics.get("new_subscribers", 0))

        # Create a 2x3 grid for metrics
        metric_data = [
            [
                self._create_metric_cell("MRR", mrr),
                self._create_metric_cell("ARR", arr),
                self._create_metric_cell("Active Subscribers", active_subs),
            ],
            [
                self._create_metric_cell("Churn Rate", churn),
                self._create_metric_cell("Avg LTV", ltv),
                self._create_metric_cell("New Subscribers", new_subs),
            ],
        ]

        metric_table = Table(metric_data, colWidths=[2.3 * inch, 2.3 * inch, 2.3 * inch])
        metric_table.setStyle(
            TableStyle(
                [
                    ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
                    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f7fafc")),
                    ("PADDING", (0, 0), (-1, -1), 15),
                ]
            )
        )
        elements.append(metric_table)
        elements.append(Spacer(1, 20))

        # 3. Revenue Trend Chart
        elements.append(Paragraph("Revenue Trend (30 Days)", self.styles["SectionTitle"]))
        elements.append(Spacer(1, 10))

        if trends:
            chart = self._create_revenue_chart(trends)
            elements.append(chart)
        else:
            elements.append(Paragraph("No trend data available.", self.styles["Normal"]))

        elements.append(Spacer(1, 20))

        # 4. Strategic Insights
        elements.append(Paragraph("Strategic Insights & Alerts", self.styles["SectionTitle"]))
        elements.append(Spacer(1, 5))

        if insights:
            for insight in insights:
                # Color code insights based on content (simple heuristic)
                if "critical" in insight.lower() or "alert" in insight.lower():
                    pass  # bullet_color = colors.red

                elements.append(
                    Paragraph(f"• {insight}", self.styles["InsightText"], bulletText="•")
                )
                elements.append(Spacer(1, 3))
        else:
            elements.append(Paragraph("No strategic alerts at this time.", self.styles["Normal"]))

        # 5. Footer (Disclaimer)
        elements.append(Spacer(1, 40))
        elements.append(
            Paragraph(
                "Confidential - Internal Use Only",
                ParagraphStyle(
                    "Footer",
                    parent=self.styles["Normal"],
                    fontSize=8,
                    textColor=colors.gray,
                    alignment=TA_CENTER,
                ),
            )
        )

        # Build PDF
        doc.build(elements)
        buffer.seek(0)
        return buffer.getvalue()

    def _create_metric_cell(self, label: str, value: str):
        """Helper to create a cell with label and value."""
        return [
            Paragraph(label, self.styles["MetricLabel"]),
            Spacer(1, 5),
            Paragraph(value, self.styles["MetricValue"]),
        ]

    def _create_revenue_chart(self, trends: List[Dict[str, Any]]) -> Drawing:
        """Create a simple line chart for revenue."""
        drawing = Drawing(400, 200)

        data = []
        # dates = []

        # Extract data (last 10-15 points to fit)
        # Assuming trends is sorted by date
        display_trends = trends[-15:] if len(trends) > 15 else trends

        revenue_values = [t.get("mrr", 0) for t in display_trends]
        data.append(tuple(revenue_values))

        # Line Chart
        lc = LinePlot()
        lc.x = 50
        lc.y = 50
        lc.height = 125
        lc.width = 300
        lc.data = data
        lc.joinedLines = 1
        lc.lines[0].symbol = makeMarker("FilledCircle")
        lc.lines[0].strokeColor = colors.HexColor("#3182ce")

        # Axis config
        lc.xValueAxis.valueMin = 0
        lc.xValueAxis.valueMax = len(revenue_values)
        lc.xValueAxis.labelTextFormat = (
            lambda x: ""
        )  # Hide X labels for simplicity or format properly

        lc.yValueAxis.valueMin = 0
        lc.yValueAxis.valueMax = max(revenue_values) * 1.1 if revenue_values else 100

        drawing.add(lc)

        return drawing


# Singleton instance
pdf_generator = PDFGenerator()
