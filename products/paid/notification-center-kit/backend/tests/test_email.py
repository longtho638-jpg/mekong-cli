import pytest
import os
from app.core.email_utils import render_email_template

def test_render_email_template():
    # Ensure the template exists (created in previous steps)
    template_name = "test_email.html"
    context = {"name": "Test User"}

    rendered = render_email_template(template_name, context)
    assert "Hello Test User" in rendered
    assert "<html>" in rendered
