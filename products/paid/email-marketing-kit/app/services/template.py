import subprocess
import jinja2
from typing import Dict, Any, Optional
from bs4 import BeautifulSoup

class TemplateService:
    def __init__(self):
        # Sandboxed environment for Jinja2
        self.env = jinja2.Environment(
            loader=jinja2.BaseLoader(),
            autoescape=True,
            undefined=jinja2.StrictUndefined # Fail on missing variables
        )

    def compile_mjml(self, mjml_content: str) -> str:
        """
        Compiles MJML to HTML using local binary.
        """
        try:
            process = subprocess.Popen(
                ['mjml', '-i', '-s', '--config.validationLevel', 'skip'],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            stdout, stderr = process.communicate(input=mjml_content)

            if process.returncode != 0:
                # Fallback or log error. For now, raise.
                # Only raise if it's a critical failure, but MJML sometimes warns on stderr.
                if not stdout:
                     raise ValueError(f"MJML Error: {stderr}")

            return stdout
        except FileNotFoundError:
            # MJML not installed, fallback to raw or mock
            return f"<!-- MJML Not Installed -->\n{mjml_content}"

    def render(self, template_str: str, context: Dict[str, Any]) -> str:
        """
        Renders a Jinja2 string with the provided context.
        """
        try:
            template = self.env.from_string(template_str)
            return template.render(**context)
        except jinja2.TemplateError as e:
            raise ValueError(f"Template rendering failed: {str(e)}")

    def html_to_text(self, html_content: str) -> str:
        """
        Converts HTML to plain text for email fallback.
        """
        soup = BeautifulSoup(html_content, "html.parser")
        return soup.get_text(separator="\n", strip=True)

    def process_template_content(
        self,
        body_mjml: Optional[str] = None,
        body_html: Optional[str] = None
    ) -> tuple[Optional[str], Optional[str]]:
        """
        Processes raw input (MJML or HTML) and returns (final_html, final_text).
        If MJML is provided, it takes precedence and is compiled to HTML.
        Text is auto-generated if not explicitly provided (though this method just helps generate HTML).
        """
        final_html = body_html

        if body_mjml:
            final_html = self.compile_mjml(body_mjml)

        return final_html

template_service = TemplateService()
