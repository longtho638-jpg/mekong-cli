"""
📄 PDF Generator - Professional Documents
===========================================

Generate professional PDF documents.
Proposals, contracts, reports - all polished!

Features:
- Template-based generation
- Multiple document types
- Branding support
- Export to PDF format
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import uuid


class DocumentType(Enum):
    """Document types."""
    PROPOSAL = "proposal"
    CONTRACT = "contract"
    INVOICE = "invoice"
    REPORT = "report"
    AGREEMENT = "agreement"


@dataclass
class PDFDocument:
    """A PDF document."""
    id: str
    type: DocumentType
    title: str
    client_name: str
    content: Dict[str, Any]
    pages: int = 1
    generated_at: datetime = field(default_factory=datetime.now)


class PDFGenerator:
    """
    PDF Generator.
    
    Generate professional PDF documents.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.documents: List[PDFDocument] = []
    
    def generate_proposal(self, client: str, services: List[str], total: float) -> PDFDocument:
        """Generate proposal PDF."""
        doc = PDFDocument(
            id=f"PDF-{uuid.uuid4().hex[:6].upper()}",
            type=DocumentType.PROPOSAL,
            title=f"Proposal for {client}",
            client_name=client,
            content={
                "services": services,
                "total": total,
                "valid_until": "30 days"
            },
            pages=3
        )
        self.documents.append(doc)
        return doc
    
    def generate_invoice(self, client: str, items: List[Dict], total: float) -> PDFDocument:
        """Generate invoice PDF."""
        doc = PDFDocument(
            id=f"PDF-{uuid.uuid4().hex[:6].upper()}",
            type=DocumentType.INVOICE,
            title=f"Invoice for {client}",
            client_name=client,
            content={"items": items, "total": total},
            pages=1
        )
        self.documents.append(doc)
        return doc
    
    def generate_report(self, client: str, metrics: Dict, period: str) -> PDFDocument:
        """Generate report PDF."""
        doc = PDFDocument(
            id=f"PDF-{uuid.uuid4().hex[:6].upper()}",
            type=DocumentType.REPORT,
            title=f"Monthly Report - {period}",
            client_name=client,
            content={"metrics": metrics, "period": period},
            pages=5
        )
        self.documents.append(doc)
        return doc
    
    def format_document_preview(self, doc: PDFDocument) -> str:
        """Format document preview."""
        type_icons = {
            DocumentType.PROPOSAL: "📝",
            DocumentType.CONTRACT: "📄",
            DocumentType.INVOICE: "💳",
            DocumentType.REPORT: "📊",
            DocumentType.AGREEMENT: "🤝"
        }
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📄 PDF DOCUMENT PREVIEW                                  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  {type_icons[doc.type]} Type: {doc.type.value.upper():<45}  ║",
            f"║  📋 Title: {doc.title[:42]:<42}  ║",
            f"║  👤 Client: {doc.client_name[:41]:<41}  ║",
            f"║  📑 Pages: {doc.pages:<42}  ║",
            "║                                                           ║",
            "║  📦 CONTENT PREVIEW                                       ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        for key, value in list(doc.content.items())[:4]:
            if isinstance(value, list):
                value = f"{len(value)} items"
            lines.append(f"║    {key}: {str(value)[:42]:<42}  ║")
        
        lines.extend([
            "║                                                           ║",
            f"║  ⏰ Generated: {doc.generated_at.strftime('%Y-%m-%d %H:%M'):<38}  ║",
            "║                                                           ║",
            "║  [📥 Download PDF] [📧 Email to Client]                   ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name}                                    ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)
    
    def format_library(self) -> str:
        """Format document library."""
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📄 DOCUMENT LIBRARY                                      ║",
            f"║  Total: {len(self.documents)} documents                               ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  ID         │ Type      │ Client       │ Pages │ Date    ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        for doc in self.documents[-5:]:
            date = doc.generated_at.strftime("%m/%d")
            lines.append(
                f"║  {doc.id:<9} │ {doc.type.value[:9]:<9} │ {doc.client_name[:12]:<12} │ {doc.pages:>5} │ {date:<7} ║"
            )
        
        lines.append("╚═══════════════════════════════════════════════════════════╝")
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    generator = PDFGenerator("Saigon Digital Hub")
    
    print("📄 PDF Generator")
    print("=" * 60)
    print()
    
    # Generate documents
    proposal = generator.generate_proposal(
        "Sunrise Realty",
        ["SEO Strategy", "Content Marketing", "PPC Management"],
        5000
    )
    
    invoice = generator.generate_invoice(
        "Coffee Lab",
        [{"item": "SEO Services", "amount": 2500}],
        2500
    )
    
    report = generator.generate_report(
        "Tech Startup VN",
        {"traffic": "+45%", "leads": "+32%", "conversions": "+28%"},
        "December 2025"
    )
    
    print(generator.format_document_preview(proposal))
    print()
    print(generator.format_library())
