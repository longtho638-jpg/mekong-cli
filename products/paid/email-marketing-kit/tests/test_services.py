import pytest
from unittest.mock import MagicMock, patch
from app.services.template import template_service, TemplateService

def test_html_to_text():
    html = "<p>Hello <b>World</b></p>"
    text = template_service.html_to_text(html)
    assert text == "Hello\nWorld"

def test_render_success():
    template = "Hello {{ name }}"
    context = {"name": "Alice"}
    result = template_service.render(template, context)
    assert result == "Hello Alice"

def test_render_missing_variable():
    # StrictUndefined should raise error
    template = "Hello {{ name }}"
    context = {}
    with pytest.raises(ValueError) as exc:
        template_service.render(template, context)
    assert "Template rendering failed" in str(exc.value)

@patch("subprocess.Popen")
def test_compile_mjml_success(mock_popen):
    # Mock successful MJML compilation
    process_mock = MagicMock()
    process_mock.communicate.return_value = ("<html>Compiled</html>", "")
    process_mock.returncode = 0
    mock_popen.return_value = process_mock

    mjml = "<mjml>...</mjml>"
    result = template_service.compile_mjml(mjml)
    assert result == "<html>Compiled</html>"

    # Verify command args
    args, _ = mock_popen.call_args
    assert args[0][0] == "mjml"

@patch("subprocess.Popen")
def test_compile_mjml_failure(mock_popen):
    # Mock failed MJML compilation
    process_mock = MagicMock()
    process_mock.communicate.return_value = ("", "Syntax Error")
    process_mock.returncode = 1
    mock_popen.return_value = process_mock

    mjml = "<mjml>...</mjml>"
    with pytest.raises(ValueError) as exc:
        template_service.compile_mjml(mjml)
    assert "MJML Error" in str(exc.value)

@patch("subprocess.Popen")
def test_compile_mjml_not_installed(mock_popen):
    # Mock FileNotFoundError (mjml not found)
    mock_popen.side_effect = FileNotFoundError

    mjml = "<mjml>Content</mjml>"
    result = template_service.compile_mjml(mjml)
    assert "<!-- MJML Not Installed -->" in result
    assert "<mjml>Content</mjml>" in result

def test_process_template_content_html_only():
    html = "<p>Test</p>"
    final_html = template_service.process_template_content(body_html=html)
    assert final_html == html

@patch.object(TemplateService, "compile_mjml")
def test_process_template_content_mjml(mock_compile):
    mock_compile.return_value = "<html>MJML</html>"

    final_html = template_service.process_template_content(body_mjml="<mjml></mjml>")
    assert final_html == "<html>MJML</html>"
    mock_compile.assert_called_once()
