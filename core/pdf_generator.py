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

import uuid
import logging
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class DocumentType(Enum):
    """Supported document types for PDF generation."""
    PROPOSAL = "proposal"
    CONTRACT = "contract"
    INVOICE = "invoice"
    REPORT = "report"
    AGREEMENT = "agreement"


@dataclass
class PDFDocument:
    """A generated PDF document record entity."""
    id: str
    type: DocumentType
    title: str
    client_name: str
    content: Dict[str, Any]
    pages: int = 1
    generated_at: datetime = field(default_factory=datetime.now)

    def __post_init__(self):
        if not self.title or not self.client_name:
            raise ValueError("Title and client name are required")


class PDFGenerator:
    """
    PDF Generation System.
    
    Orchestrates the creation, versioning, and formatting of agency documents.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.documents: List[PDFDocument] = []
        logger.info(f"PDF Generator initialized for {agency_name}")
    
    def generate_document(
        self,
        doc_type: DocumentType,
        client: str,
        title: str,
        payload: Dict[str, Any],
        pages: int = 1
    ) -> PDFDocument:
        """Execute document generation logic."""
        doc = PDFDocument(
            id=f"PDF-{uuid.uuid4().hex[:6].upper()}",
            type=doc_type, title=title, client_name=client,
            content=payload, pages=pages
        )
        self.documents.append(doc)
        logger.info(f"PDF Generated: {title} ({doc_type.value})")
        return doc
    
    def format_preview(self, doc: PDFDocument) -> str:
        """Render an ASCII preview of the document record."""
        icons = {
            DocumentType.PROPOSAL: "📝", DocumentType.CONTRACT: "📄",
            DocumentType.INVOICE: "💳", DocumentType.REPORT: "📊"
        }
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📄 PDF DOCUMENT PREVIEW{' ' * 34}║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  {icons.get(doc.type, '📄')} Type: {doc.type.value.upper():<45}  ║",
            f"║  📋 Title: {doc.title[:42]:<42}  ║",
            f"║  👤 Client: {doc.client_name[:41]:<41}  ║",
            f"║  📑 Pages: {doc.pages:<42}  ║",
            "║                                                           ║",
            "║  [📥 Download PDF] [📧 Send to Client] [🎨 Edit Template] ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Polished!         ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ]
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("📄 Initializing PDF System...")
    print("=" * 60)
    
    try:
        gen = PDFGenerator("Saigon Digital Hub")
        # Seed
        doc = gen.generate_document(
            DocumentType.PROPOSAL, "Sunrise Realty", "SEO Overhaul", 
            {"services": ["Ads", "SEO"]}, 3
        )
        print("\n" + gen.format_preview(doc))
        
    except Exception as e:
        logger.error(f"PDF Error: {e}")
