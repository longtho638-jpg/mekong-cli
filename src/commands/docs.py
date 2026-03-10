"""Docs command - Generate, serve, and manage documentation"""

import typer
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
import subprocess
from pathlib import Path
import os
import webbrowser

app = typer.Typer()
console = Console()


@app.command()
def generate(
    format_type: str = typer.Option("html", "--format", "-f", help="Output format: html, pdf, epub, md"),
    source: str = typer.Option("./", "--source", "-s", help="Source directory containing docs"),
    output: str = typer.Option("./docs/_build", "--output", "-o", help="Output directory"),
    verbose: bool = typer.Option(False, "--verbose", "-v", help="Verbose output"),
):
    """Generate documentation from source files"""

    console.print(f"[bold]📚 Generating {format_type.upper()} documentation...[/bold]")

    # Check if Sphinx is available for advanced documentation generation
    try:
        if Path("conf.py").exists() or Path("source/conf.py").exists():
            # Use Sphinx if conf.py exists
            cmd = ["sphinx-build", "-b", format_type, source, output]
            if verbose:
                cmd.append("-v")

            console.print(f"[dim]Running: {' '.join(cmd)}[/dim]")
            result = subprocess.run(cmd, check=True, capture_output=not verbose, text=True)

            if result.returncode == 0:
                console.print(f"[green]✅ {format_type.upper()} documentation generated at {output}[/green]")
            else:
                console.print("[red]❌ Documentation generation failed[/red]")
                if result.stderr:
                    console.print(Panel(result.stderr, title="Error"))
        else:
            # Fallback to simple documentation generation
            generate_simple_docs(format_type, source, output)

    except FileNotFoundError:
        console.print("[yellow]⚠️  Sphinx not found, generating simple documentation[/yellow]")
        generate_simple_docs(format_type, source, output)
    except subprocess.CalledProcessError as e:
        console.print("[red]❌ Documentation generation failed![/red]")
        if e.stderr:
            console.print(Panel(e.stderr, title="Error"))


def generate_simple_docs(format_type: str, source: str, output: str):
    """Generate simple documentation for different formats"""
# source_path = Path(source)  # Removed unused variable
    output_path = Path(output)
    output_path.mkdir(parents=True, exist_ok=True)

    if format_type == "html":
        # Create simple HTML documentation
        html_content = """
<!DOCTYPE html>
<html>
<head>
    <title>Project Documentation</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1, h2 { color: #2c3e50; }
        .toc { background-color: #f8f9fa; padding: 20px; margin: 20px 0; }
        .section { margin: 30px 0; }
    </style>
</head>
<body>
    <h1>Project Documentation</h1>
    <div class="toc">
        <h2>Table of Contents</h2>
        <ul>
            <li><a href="#intro">Introduction</a></li>
            <li><a href="#installation">Installation</a></li>
            <li><a href="#usage">Usage</a></li>
            <li><a href="#api">API Reference</a></li>
        </ul>
    </div>

    <div class="section">
        <h2 id="intro">Introduction</h2>
        <p>Your project documentation goes here.</p>
    </div>

    <div class="section">
        <h2 id="installation">Installation</h2>
        <p>Instructions for installing your project.</p>
    </div>

    <div class="section">
        <h2 id="usage">Usage</h2>
        <p>Instructions for using your project.</p>
    </div>

    <div class="section">
        <h2 id="api">API Reference</h2>
        <p>API documentation for your project.</p>
    </div>
</body>
</html>
        """

        with open(output_path / "index.html", "w") as f:
            f.write(html_content)

        console.print(f"[green]✅ Simple HTML documentation generated at {output_path / 'index.html'}[/green]")

    elif format_type == "md":
        # Create README-style documentation
        md_content = "# Project Documentation\n\n## Introduction\n\nYour project introduction goes here.\n\n## Installation\n\nInstructions for installing your project.\n\n## Usage\n\nInstructions for using your project.\n\n## API Reference\n\nAPI documentation for your project.\n\n## Contributing\n\nGuidelines for contributing to your project.\n\n## License\n\nYour project license information.\n"

        with open(output_path / "README.md", "w") as f:
            f.write(md_content)

        console.print(f"[green]✅ Markdown documentation generated at {output_path / 'README.md'}[/green]")

    else:
        console.print(f"[yellow]⚠️  Format {format_type} not supported in simple mode. Use Sphinx for advanced formats.[/yellow]")


@app.command()
def serve(
    host: str = typer.Option("127.0.0.1", "--host", "-H", help="Host to serve on"),
    port: int = typer.Option(8000, "--port", "-p", help="Port to serve on"),
    open_browser: bool = typer.Option(True, "--open", "-o", help="Open browser automatically"),
):
    """Serve documentation locally"""

    docs_path = Path("./docs/_build/html")
    if not docs_path.exists():
        docs_path = Path("./docs")

    if not docs_path.exists():
        console.print("[red]❌ Documentation directory not found. Generate docs first.[/red]")
        return

    console.print(f"[bold]🌐 Serving documentation at http://{host}:{port}[/bold]")

    try:
        import http.server
        import socketserver

        os.chdir(docs_path)

        class Handler(http.server.SimpleHTTPRequestHandler):
            def __init__(self, *args, **kwargs):
                super().__init__(*args, directory=".", **kwargs)

        with socketserver.TCPServer((host, port), Handler) as httpd:
            console.print(f"[green]✅ Documentation server started at http://{host}:{port}[/green]")
            console.print("[dim]Press Ctrl+C to stop the server[/dim]")

            if open_browser:
                webbrowser.open(f"http://{host}:{port}")

            try:
                httpd.serve_forever()
            except KeyboardInterrupt:
                console.print("\n[yellow]⚠️  Server stopped by user[/yellow]")

    except ImportError:
        console.print("[red]❌ Failed to start documentation server[/red]")
        console.print("[dim]Try installing a simple HTTP server: python -m http.server {port}[/dim]")


@app.command()
def check_links():
    """Check for broken links in documentation"""

    console.print("[bold]🔗 Checking for broken links in documentation...[/bold]")

    # Find all markdown and HTML files in documentation
    docs_dirs = [Path("./docs"), Path("./doc"), Path("./documentation")]
    all_docs = []

    for docs_dir in docs_dirs:
        if docs_dir.exists():
            all_docs.extend(docs_dir.glob("**/*.md"))
            all_docs.extend(docs_dir.glob("**/*.html"))
            all_docs.extend(docs_dir.glob("**/*.rst"))

    if not all_docs:
        console.print("[yellow]⚠️  No documentation files found[/yellow]")
        return

    broken_links = []
    total_links = 0

    for doc_file in all_docs:
        with open(doc_file, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()

        # Find potential links in the document
        import re
        link_patterns = [
            r'\[.*?\]\((.*?)\)',  # Markdown links: [text](link)
            r'href="(.*?)"',      # HTML href attributes
            r'src="(.*?)"',       # HTML src attributes
        ]

        for pattern in link_patterns:
            matches = re.findall(pattern, content)
            for match in matches:
                total_links += 1
                # Skip absolute URLs
                if match.startswith(('http://', 'https://', '#')):
                    continue

                # Check if local file exists
                link_path = doc_file.parent / match
                if not link_path.exists():
                    broken_links.append((doc_file.name, match))

    if broken_links:
        console.print(f"[red]❌ Found {len(broken_links)} broken links out of {total_links} total links[/red]")

        table = Table(title="Broken Links")
        table.add_column("Document", style="cyan")
        table.add_column("Link", style="red")

        for doc, link in broken_links[:10]:  # Limit to first 10
            table.add_row(doc, link)

        console.print(table)

        if len(broken_links) > 10:
            console.print(f"[dim]... and {len(broken_links) - 10} more[/dim]")
    else:
        console.print(f"[green]✅ All {total_links} links are valid[/green]")


@app.command()
def validate():
    """Validate documentation structure and content"""

    console.print("[bold]🔍 Validating documentation...[/bold]")

    validation_results = []

    # Check for common documentation files
    common_docs = [
        "README.md",
        "CONTRIBUTING.md",
        "LICENSE",
        "CHANGELOG.md",
        "docs/index.md",
        "docs/README.md",
        "doc/README.md",
    ]

    for doc in common_docs:
        exists = Path(doc).exists()
        status = "✅" if exists else "❌"
        validation_results.append((doc, status, "Exists" if exists else "Missing"))

    # Check for API documentation
    api_docs = list(Path(".").glob("**/api*.md")) + list(Path(".").glob("**/API*.md"))
    api_status = "✅" if api_docs else "⚠️ "
    api_msg = f"Found {len(api_docs)} API docs" if api_docs else "No API docs found"
    validation_results.append(("API Documentation", api_status, api_msg))

    # Check for tutorials
    tutorial_docs = list(Path(".").glob("**/tutorial*.md")) + list(Path(".").glob("**/guide*.md"))
    tutorial_status = "✅" if tutorial_docs else "⚠️ "
    tutorial_msg = f"Found {len(tutorial_docs)} tutorials/guides" if tutorial_docs else "No tutorials/guides found"
    validation_results.append(("Tutorials/Guides", tutorial_status, tutorial_msg))

    table = Table(title="Documentation Validation")
    table.add_column("Component", style="cyan")
    table.add_column("Status", style="magenta")
    table.add_column("Info", style="dim")

    for item, status, info in validation_results:
        table.add_row(item, status, info)

    console.print(table)


@app.command()
def publish(
    platform: str = typer.Argument(..., help="Platform to publish to: github-pages, netlify, custom"),
    source: str = typer.Option("./docs/_build/html", "--source", "-s", help="Source directory to publish"),
    verbose: bool = typer.Option(False, "--verbose", "-v", help="Verbose output"),
):
    """Publish documentation to various platforms"""

    console.print(f"[bold]🚀 Publishing documentation to {platform}...[/bold]")

    if platform == "github-pages":
        publish_to_github_pages(source, verbose)
    elif platform == "netlify":
        publish_to_netlify(source, verbose)
    elif platform == "custom":
        publish_to_custom(source, verbose)
    else:
        console.print(f"[red]❌ Unsupported platform: {platform}[/red]")
        console.print("[dim]Supported platforms: github-pages, netlify, custom[/dim]")


def publish_to_github_pages(source: str, verbose: bool):
    """Publish documentation to GitHub Pages"""

    if not Path(".git").exists():
        console.print("[red]❌ Not in a git repository[/red]")
        return

    try:
        # Create or switch to gh-pages branch
        subprocess.run(["git", "checkout", "gh-pages"], check=False, capture_output=not verbose)

        # If gh-pages doesn't exist, create it
        result = subprocess.run(["git", "show-ref", "--verify", "--quiet", "refs/heads/gh-pages"],
                               capture_output=True)
        if result.returncode != 0:
            # Create orphaned gh-pages branch
            subprocess.run(["git", "checkout", "--orphan", "gh-pages"], check=True,
                          capture_output=not verbose)

        # Clear existing content
        import shutil
        for item in Path(".").iterdir():
            if item.name != ".git":
                if item.is_dir():
                    shutil.rmtree(item)
                else:
                    item.unlink()

        # Copy new documentation
        source_path = Path(source)
        if source_path.exists():

            for item in source_path.rglob("*"):
                if item.is_file():
                    dest_path = Path(".") / item.relative_to(source_path)
                    dest_path.parent.mkdir(parents=True, exist_ok=True)
                    import shutil
                    shutil.copy2(item, dest_path)

        # Add and commit
        subprocess.run(["git", "add", "."], check=True, capture_output=not verbose)
        subprocess.run(["git", "commit", "-m", "Update documentation"],
                      check=True, capture_output=not verbose)

        # Push to GitHub Pages
        subprocess.run(["git", "push", "origin", "gh-pages"],
                      check=True, capture_output=not verbose)

        console.print("[green]✅ Documentation published to GitHub Pages![/green]")
        console.print("[dim]Visit: https://<username>.github.io/<repository>[/dim]")

        # Return to main branch
        subprocess.run(["git", "checkout", "-"], check=False, capture_output=not verbose)

    except subprocess.CalledProcessError as e:
        console.print("[red]❌ GitHub Pages publishing failed![/red]")
        if e.stderr:
            console.print(Panel(e.stderr, title="Error"))
    except Exception as e:
        console.print(f"[red]❌ Error during GitHub Pages publishing: {str(e)}[/red]")


def publish_to_netlify(source: str, verbose: bool):
    """Publish documentation to Netlify"""

    try:
        # Check if netlify CLI is available
        result = subprocess.run(["netlify", "--version"],
                               capture_output=True, text=True, check=False)
        if result.returncode != 0:
            console.print("[red]❌ Netlify CLI not found. Install with: npm install -g netlify-cli[/red]")
            return

        # Deploy using netlify
        cmd = ["netlify", "deploy", "--dir", source]
        if verbose:
            cmd.append("--verbose")

        result = subprocess.run(cmd, check=True, capture_output=not verbose, text=True)

        console.print("[green]✅ Documentation published to Netlify![/green]")
        if result.stdout:
            console.print(Panel(result.stdout, title="Netlify Response"))

    except subprocess.CalledProcessError as e:
        console.print("[red]❌ Netlify publishing failed![/red]")
        if e.stderr:
            console.print(Panel(e.stderr, title="Error"))
    except Exception as e:
        console.print(f"[red]❌ Error during Netlify publishing: {str(e)}[/red]")


def publish_to_custom(source: str, verbose: bool):
    """Publish documentation using custom method"""

    custom_publish_script = os.environ.get("CUSTOM_DOCS_PUBLISH_SCRIPT", "./publish-docs.sh")

    if not Path(custom_publish_script).exists():
        console.print(f"[red]❌ Custom publish script not found: {custom_publish_script}[/red]")
        console.print("[dim]Set CUSTOM_DOCS_PUBLISH_SCRIPT env var or create ./publish-docs.sh[/dim]")
        return

    try:
        cmd = ["bash", custom_publish_script, source]
        result = subprocess.run(cmd, check=True, capture_output=not verbose, text=True)

        console.print("[green]✅ Documentation published using custom method![/green]")
        if result.stdout:
            console.print(Panel(result.stdout, title="Publish Script Output"))

    except subprocess.CalledProcessError as e:
        console.print("[red]❌ Custom publishing failed![/red]")
        if e.stderr:
            console.print(Panel(e.stderr, title="Error"))
    except Exception as e:
        console.print(f"[red]❌ Error during custom publishing: {str(e)}[/red]")


@app.command()
def template(
    type_name: str = typer.Argument(..., help="Template type: api, tutorial, guide, changelog"),
    output: str = typer.Option("./docs", "--output", "-o", help="Output directory"),
):
    """Generate documentation templates"""

    console.print(f"[bold]📄 Generating {type_name} documentation template...[/bold]")

    output_path = Path(output)
    output_path.mkdir(parents=True, exist_ok=True)

    if type_name == "api":
        template_content = """# API Reference

## Base URL
`https://api.yourapp.com/v1`

## Authentication
All API requests require an API key in the `Authorization` header:

```
Authorization: Bearer YOUR_API_KEY
```

## Endpoints

### GET /endpoint
Description of the endpoint

#### Parameters
- param1 (required): Description
- param2 (optional): Description

#### Response
```json
{
  "status": "success",
  "data": {}
}
```
"""
        filename = "api-reference.md"

    elif type_name == "tutorial":
        template_content = """# Tutorial: [Tutorial Name]

## Prerequisites
- Prerequisite 1
- Prerequisite 2

## Step 1: [Step Title]
Description of the first step.

```bash
# Example command
command here
```

## Step 2: [Step Title]
Description of the second step.

## Conclusion
Summary of what was covered.
"""
        filename = "tutorial-template.md"

    elif type_name == "guide":
        template_content = """# Guide: [Guide Topic]

## Overview
Brief overview of the guide topic.

## When to Use This Guide
- Situation 1
- Situation 2

## How to Use This Guide
Detailed instructions.

## Examples
Practical examples.

## Best Practices
- Best practice 1
- Best practice 2

## Troubleshooting
Common issues and solutions.
"""
        filename = "guide-template.md"

    elif type_name == "changelog":
        template_content = """# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- New features

### Changed
- Changes to existing functionality

### Deprecated
- Soon-to-be removed features

### Removed
- Removed features

### Fixed
- Bug fixes

### Security
- Security improvements
"""
        filename = "CHANGELOG-template.md"

    else:
        console.print(f"[red]❌ Unknown template type: {type_name}[/red]")
        console.print("[dim]Available types: api, tutorial, guide, changelog[/dim]")
        return

    template_path = output_path / filename
    with open(template_path, "w") as f:
        f.write(template_content)

    console.print(f"[green]✅ {type_name.capitalize()} template created at {template_path}[/green]")


if __name__ == "__main__":
    app()
