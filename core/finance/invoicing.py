"""
Invoicing Service
=================
"""

import json
import os
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List

from core.config import get_settings


class InvoiceService:
    def __init__(self):
        settings = get_settings()
        self.data_dir = Path.home() / settings.LICENSE_DIR_NAME
        self.invoices_file = self.data_dir / "invoices.json"
        self.invoices_output_dir = self.data_dir / "invoices"
        self._ensure_dir()
        self.paypal_me = os.getenv("PAYPAL_ME_LINK", "https://paypal.me/yourname")

    def _ensure_dir(self):
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.invoices_output_dir.mkdir(parents=True, exist_ok=True)

    def load_invoices(self) -> List[Dict[str, Any]]:
        if self.invoices_file.exists():
            try:
                with open(self.invoices_file) as f:
                    return json.load(f)
            except json.JSONDecodeError:
                return []
        return []

    def save_invoices(self, invoices: List[Dict[str, Any]]):
        with open(self.invoices_file, "w") as f:
            json.dump(invoices, f, indent=2)

    def generate_invoice_id(self) -> str:
        invoices = self.load_invoices()
        year = datetime.now().year
        count = sum(1 for i in invoices if str(year) in i.get("id", "")) + 1
        return f"INV-{year}-{count:04d}"

    def create_invoice(self, client: str, amount: float, description: str) -> Dict[str, Any]:
        invoice_id = self.generate_invoice_id()
        due_date = (datetime.now() + timedelta(days=14)).strftime("%Y-%m-%d")

        invoice = {
            "id": invoice_id,
            "client": client,
            "amount": amount,
            "description": description,
            "status": "pending",
            "created": datetime.now().isoformat(),
            "due_date": due_date,
            "paid_date": None,
            "payment_link": f"{self.paypal_me}/{amount}",
        }

        invoices = self.load_invoices()
        invoices.append(invoice)
        self.save_invoices(invoices)
        self._generate_markdown(invoice)
        return invoice

    def _generate_markdown(self, invoice: Dict[str, Any]):
        path = self.invoices_output_dir / f"{invoice['id']}.md"
        content = f"""# 🏯 INVOICE {invoice["id"]}

**To**: {invoice["client"]}  
**Date**: {invoice["created"][:10]}  
**Due**: {invoice["due_date"]}

---

| Description | Amount |
|:---|---:|
| {invoice["description"]} | **${invoice["amount"]:,.2f}** |

---

## Total: **${invoice["amount"]:,.2f} USD**

**Payment Link**: [{invoice["payment_link"]}]({invoice["payment_link"]})
"""
        with open(path, "w") as f:
            f.write(content)

    def update_status(self, invoice_id: str, status: str) -> bool:
        invoices = self.load_invoices()
        for inv in invoices:
            if inv["id"] == invoice_id:
                inv["status"] = status
                if status == "paid":
                    inv["paid_date"] = datetime.now().isoformat()
                self.save_invoices(invoices)
                return True
        return False
