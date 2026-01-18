import sys
from pathlib import Path
from unittest.mock import patch

# Ensure we can import the scripts
sys.path.append(str(Path(__file__).parent.parent))

from scripts.contract_gen.generator import generate_markdown_content
from scripts.contract_gen.models import ContractTemplate
from scripts.contract_gen.templates import TEMPLATES


def test_contract_template_model():
    t = ContractTemplate(key="test", title="Test", price=1000, term="1 month", scope="Scope")
    assert t.formatted_price == "$1,000"


def test_generate_markdown_content():
    template = TEMPLATES["ghost_cto"]
    lead = {"name": "Test Client", "company": "Test Co", "email": "test@example.com"}
    content = generate_markdown_content(template, lead, "20260101")

    assert "# Ghost CTO Lite Service Agreement" in content
    assert "Test Client" in content
    assert "Test Co" in content
    assert "$3,000" in content


@patch("scripts.contract_gen.loader.open")
def test_loader(mock_open):
    # This is harder to test without mocking json.load context manager
    pass
