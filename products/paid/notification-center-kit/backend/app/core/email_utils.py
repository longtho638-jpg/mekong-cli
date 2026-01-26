import os
from jinja2 import Environment, FileSystemLoader, select_autoescape

TEMPLATE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "email-templates")

env = Environment(
    loader=FileSystemLoader(TEMPLATE_DIR),
    autoescape=select_autoescape(['html', 'xml'])
)

def render_email_template(template_name: str, context: dict) -> str:
    """
    Renders a Jinja2 template with the given context.
    """
    template = env.get_template(template_name)
    return template.render(**context)
