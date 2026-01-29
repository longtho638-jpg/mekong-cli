import csv
import io
import json
import logging
from datetime import datetime
from typing import Any, BinaryIO, Dict, List, Literal, Optional

# Optional imports for formats that might not be installed in all envs
try:
    from openpyxl import Workbook
except ImportError:
    Workbook = None

try:
    from weasyprint import CSS, HTML
except ImportError:
    HTML = None

ExportFormat = Literal["csv", "json", "pdf", "xlsx"]

logger = logging.getLogger(__name__)


class ExportService:
    def export_data(
        self, data: List[Dict[str, Any]], format: ExportFormat, template_id: Optional[str] = None
    ) -> BinaryIO:
        """Main export dispatch"""
        if format == "csv":
            return self._export_csv(data)
        elif format == "json":
            return self._export_json(data)
        elif format == "pdf":
            return self._export_pdf(data, template_id)
        elif format == "xlsx":
            return self._export_xlsx(data)
        else:
            raise ValueError(f"Unsupported format: {format}")

    def _export_csv(self, data: List[Dict[str, Any]]) -> BinaryIO:
        # UTF-8 BOM for Excel compatibility
        output = io.StringIO()
        output.write("\ufeff")  # BOM

        if not data:
            return io.BytesIO(output.getvalue().encode("utf-8"))

        writer = csv.DictWriter(output, fieldnames=data[0].keys())
        writer.writeheader()
        writer.writerows(data)

        return io.BytesIO(output.getvalue().encode("utf-8"))

    def _export_json(self, data: List[Dict[str, Any]]) -> BinaryIO:
        # Pretty print with default serializer for dates
        def json_serial(obj):
            if isinstance(obj, (datetime, datetime.date)):
                return obj.isoformat()
            raise TypeError(f"Type {type(obj)} not serializable")

        json_str = json.dumps(data, indent=2, ensure_ascii=False, default=json_serial)
        return io.BytesIO(json_str.encode("utf-8"))

    def _export_pdf(self, data: List[Dict[str, Any]], template_id: Optional[str]) -> BinaryIO:
        if HTML is None:
            raise ImportError("WeasyPrint is not installed")

        # Basic HTML generation if no template system yet
        # In production, use Jinja2 templates

        headers = list(data[0].keys()) if data else []

        html_content = f"""
        <html>
        <head>
            <style>
                body {{ font-family: sans-serif; }}
                table {{ width: 100%; border-collapse: collapse; margin-top: 20px; }}
                th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 10px; }}
                th {{ background-color: #f2f2f2; }}
                h1 {{ color: #333; }}
                .meta {{ font-size: 10px; color: #666; margin-bottom: 20px; }}
            </style>
        </head>
        <body>
            <h1>Export Data</h1>
            <div class="meta">Generated on {datetime.utcnow().isoformat()}</div>
            <table>
                <thead>
                    <tr>
                        {"".join(f"<th>{h}</th>" for h in headers)}
                    </tr>
                </thead>
                <tbody>
                    {
            "".join(
                "<tr>" + "".join("<td>" + str(row.get(h, "")) + "</td>" for h in headers) + "</tr>"
                for row in data
            )
        }
                </tbody>
            </table>
        </body>
        </html>
        """

        return io.BytesIO(HTML(string=html_content).write_pdf())

    def _export_xlsx(self, data: List[Dict[str, Any]]) -> BinaryIO:
        if Workbook is None:
            raise ImportError("openpyxl is not installed")

        wb = Workbook()
        ws = wb.active

        if data:
            # Headers
            headers = list(data[0].keys())
            ws.append(headers)

            # Data rows
            for row in data:
                # Convert complex objects to string for Excel
                clean_row = []
                for h in headers:
                    val = row.get(h)
                    if isinstance(val, (dict, list)):
                        val = json.dumps(val)
                    elif val is None:
                        val = ""
                    clean_row.append(val)
                ws.append(clean_row)

        output = io.BytesIO()
        wb.save(output)
        output.seek(0)
        return output
