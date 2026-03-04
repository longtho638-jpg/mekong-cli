"""Lint command - Static analysis and code quality checks"""

import typer
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
import subprocess
import sys
from pathlib import Path
import os

app = typer.Typer()
console = Console()


@app.command()
def run(
    fix: bool = typer.Option(False, "--fix", help="Automatically fix issues where possible"),
    verbose: bool = typer.Option(False, "--verbose", "-v", help="Verbose output"),
    format_only: bool = typer.Option(False, "--format", help="Format code only"),
    check_type: bool = typer.Option(False, "--type-check", help="Run type checker only"),
    security_check: bool = typer.Option(False, "--security", help="Run security checks only"),
    python: bool = typer.Option(True, "--python/--no-python", help="Check Python files"),
    js: bool = typer.Option(True, "--js/--no-js", help="Check JavaScript/TypeScript files"),
    all_files: bool = typer.Option(False, "--all", help="Check all file types including docs/configs"),
):
    """Run linting tools on project files"""

    if security_check:
        run_security_scan()
        return

    if check_type:
        run_type_checker()
        return

    if format_only:
        run_formatter(fix)
        return

    # Determine files to check
    targets = []
    if python:
        targets.extend(get_python_files(all_files))
    if js:
        targets.extend(get_js_files(all_files))

    if not targets:
        console.print("[yellow]⚠️  No files found to lint[/yellow]")
        return

    console.print(f"[bold]🔍 Linting {len(targets)} files...[/bold]")

    # Run formatter first
    if fix:
        run_formatter(fix=True)

    # Run linters
    issues_found = False

    if python:
        if run_python_linter(fix, verbose):
            issues_found = True

    if js:
        if run_js_linter(fix, verbose):
            issues_found = True

    if not issues_found:
        console.print("[green]✅ No issues found![/green]")
    else:
        console.print("[red]❌ Some issues found and fixed (where possible)[/red]")


def get_python_files(include_extra: bool):
    """Get list of Python files to lint"""
    files = list(Path('.').glob('**/*.py'))

    if include_extra:
        files.extend(Path('.').glob('**/*.pyi'))
        files.extend([Path(f) for f in ['.pylintrc', 'setup.py', 'pyproject.toml', 'requirements.txt'] if Path(f).exists()])

    # Filter out virtual environments and build artifacts
    filtered_files = []
    for f in files:
        if not any(part.startswith('.') or part in ['__pycache__', 'venv', '.venv', 'node_modules', 'dist', 'build'] for part in f.parts):
            filtered_files.append(str(f))

    return filtered_files


def get_js_files(include_extra: bool):
    """Get list of JavaScript/TypeScript files to lint"""
    files = []
    files.extend(Path('.').glob('**/*.js'))
    files.extend(Path('.').glob('**/*.jsx'))
    files.extend(Path('.').glob('**/*.ts'))
    files.extend(Path('.').glob('**/*.tsx'))

    if include_extra:
        files.extend([Path(f) for f in ['package.json', 'package-lock.json', 'tsconfig.json', '.eslintrc', '.babelrc'] if Path(f).exists()])

    # Filter out node_modules and build artifacts
    filtered_files = []
    for f in files:
        if not any(part in ['node_modules', 'dist', 'build', '.next'] for part in f.parts):
            filtered_files.append(str(f))

    return filtered_files


def run_formatter(fix: bool = True):
    """Run code formatters"""
    console.print("[blue]🎨 Formatting code...[/blue]")

    # Check for and run Black for Python
    if Path('.').glob('**/*.py'):
        try:
            cmd = [sys.executable, "-m", "black"]
            if not fix:
                cmd.append("--diff")
            cmd.extend(get_python_files(False))

            result = subprocess.run(cmd, check=False, capture_output=True, text=True)
            if result.returncode == 0:
                console.print("[green]✅ Python code formatted[/green]")
            else:
                if fix:
                    console.print(f"[yellow]⚠️  Black made changes[/yellow]")
                else:
                    console.print(f"[yellow]⚠️  Black would make changes[/yellow]")
                    if result.stdout:
                        console.print(Panel(result.stdout, title="Black Diff"))
        except FileNotFoundError:
            console.print("[dim]Black not found. Install with: pip install black[/dim]")

    # Check for and run Prettier for JS/TS
    if any(Path('.').glob('**/*.{js,jsx,ts,tsx}')):
        try:
            cmd = ["prettier"]
            if fix:
                cmd.append("--write")
            else:
                cmd.append("--check")
            cmd.extend(get_js_files(False))

            result = subprocess.run(cmd, check=False, capture_output=True, text=True)
            if result.returncode == 0:
                console.print("[green]✅ JavaScript/TypeScript code formatted[/green]")
            else:
                if fix:
                    console.print(f"[yellow]⚠️  Prettier made changes[/yellow]")
                else:
                    console.print(f"[yellow]⚠️  Prettier would make changes[/yellow]")
                    if result.stdout:
                        console.print(Panel(result.stdout, title="Prettier Output"))
        except FileNotFoundError:
            console.print("[dim]Prettier not found. Install with: npm install -g prettier[/dim]")


def run_python_linter(fix: bool, verbose: bool):
    """Run Python linters"""
    issues_found = False

    # Run flake8
    try:
        cmd = ["flake8"]
        cmd.extend(get_python_files(False))

        result = subprocess.run(cmd, check=False, capture_output=True, text=True)
        if result.returncode != 0:
            issues_found = True
            console.print("[yellow]⚠️  Flake8 found issues[/yellow]")
            if verbose or result.stdout:
                console.print(Panel(result.stdout, title="Flake8 Output"))
    except FileNotFoundError:
        console.print("[dim]Flake8 not found. Install with: pip install flake8[/dim]")

    # Run ruff (modern, fast linter)
    try:
        cmd = ["ruff", "check"]
        if fix:
            cmd.append("--fix")
        cmd.extend(get_python_files(False))

        result = subprocess.run(cmd, check=False, capture_output=True, text=True)
        if result.returncode != 0:
            issues_found = True
            console.print(f"[yellow]⚠️  Ruff found issues ({'fixed' if fix else 'to fix'})[/yellow]")
            if verbose or (not fix and result.stdout):
                console.print(Panel(result.stdout, title="Ruff Output"))
    except FileNotFoundError:
        console.print("[dim]Ruff not found. Install with: pip install ruff[/dim]")

    return issues_found


def run_js_linter(fix: bool, verbose: bool):
    """Run JavaScript linters"""
    issues_found = False

    js_files = get_js_files(False)
    if not js_files:
        return False

    # Run ESLint
    try:
        cmd = ["eslint"]
        if fix:
            cmd.append("--fix")
        cmd.extend(js_files)

        result = subprocess.run(cmd, check=False, capture_output=True, text=True)
        if result.returncode != 0:
            issues_found = True
            console.print(f"[yellow]⚠️  ESLint found issues ({'fixed' if fix else 'to fix'})[/yellow]")
            if verbose or (not fix and result.stdout):
                console.print(Panel(result.stdout, title="ESLint Output"))
    except FileNotFoundError:
        console.print("[dim]ESLint not found. Install with: npm install -g eslint[/dim]")

    # Run jshint if available
    try:
        cmd = ["jshint"]
        cmd.extend(js_files)

        result = subprocess.run(cmd, check=False, capture_output=True, text=True)
        if result.returncode != 0:
            issues_found = True
            console.print("[yellow]⚠️  JSHint found issues[/yellow]")
            if verbose or result.stdout:
                console.print(Panel(result.stdout, title="JSHint Output"))
    except FileNotFoundError:
        console.print("[dim]JSHint not found. Install with: npm install -g jshint[/dim]")

    return issues_found


def run_type_checker():
    """Run type checker"""
    console.print("[blue]🏷️  Running type checker...[/blue]")

    # Run mypy for Python
    if Path('.').glob('**/*.py'):
        try:
            cmd = [sys.executable, "-m", "mypy"]
            # Add common Python source directories
            py_paths = [".", "src", "lib", "tests"]  # Common Python source directories
            existing_paths = [p for p in py_paths if Path(p).exists()]
            cmd.extend(existing_paths)

            result = subprocess.run(cmd, check=False, capture_output=True, text=True)
            if result.returncode == 0:
                console.print("[green]✅ Type checking passed[/green]")
            else:
                console.print("[red]❌ Type checking failed[/red]")
                if result.stdout:
                    console.print(Panel(result.stdout, title="MyPy Output"))
        except FileNotFoundError:
            console.print("[dim]MyPy not found. Install with: pip install mypy[/dim]")

    # Run TypeScript compiler for TS
    if any(Path('.').glob('**/*.ts')):
        try:
            cmd = ["tsc", "--noEmit"]  # --noEmit to check types without compiling
            result = subprocess.run(cmd, check=False, capture_output=True, text=True)
            if result.returncode == 0:
                console.print("[green]✅ TypeScript type checking passed[/green]")
            else:
                console.print("[red]❌ TypeScript type checking failed[/red]")
                if result.stdout or result.stderr:
                    output = result.stdout or result.stderr
                    console.print(Panel(output, title="TypeScript Output"))
        except FileNotFoundError:
            console.print("[dim]TypeScript compiler not found. Install with: npm install -g typescript[/dim]")


def run_security_scan():
    """Run security vulnerability scans"""
    console.print("[blue]🔒 Running security scan...[/blue]")

    # Run bandit for Python security issues
    if Path('.').glob('**/*.py'):
        try:
            cmd = ["bandit", "-r", "."]
            result = subprocess.run(cmd, check=False, capture_output=True, text=True)
            if result.returncode == 0:
                console.print("[green]✅ Security scan passed[/green]")
            else:
                console.print("[red]⚠️  Security issues found[/red]")
                if result.stdout:
                    console.print(Panel(result.stdout, title="Bandit Security Report"))
        except FileNotFoundError:
            console.print("[dim]Bandit not found. Install with: pip install bandit[/dim]")

    # Run npm audit for JavaScript dependencies
    if Path("package-lock.json").exists() or Path("yarn.lock").exists():
        try:
            cmd = ["npm", "audit"]
            result = subprocess.run(cmd, check=False, capture_output=True, text=True)
            if result.returncode == 0:
                console.print("[green]✅ Dependency audit passed[/green]")
            else:
                console.print("[yellow]⚠️  Dependency vulnerabilities found[/yellow]")
                if result.stdout:
                    console.print(Panel(result.stdout, title="NPM Audit Report"))
        except FileNotFoundError:
            console.print("[dim]npm not found or package-lock.json/yarn.lock missing[/dim]")


@app.command()
def autofix():
    """Apply automatic fixes to code"""
    console.print("[bold]🔧 Running automatic fixes...[/bold]")
    run_formatter(fix=True)
    run_python_linter(fix=True, verbose=False)


@app.command()
def check_formatting():
    """Check if code is properly formatted"""
    console.print("[bold]🔍 Checking code formatting...[/bold]")

    # Check Python formatting with Black
    if Path('.').glob('**/*.py'):
        try:
            cmd = [sys.executable, "-m", "black", "--check"]
            cmd.extend(get_python_files(False))

            result = subprocess.run(cmd, check=False, capture_output=True, text=True)
            if result.returncode == 0:
                console.print("[green]✅ Python code is properly formatted[/green]")
            else:
                console.print("[red]❌ Python code needs formatting[/red]")
        except FileNotFoundError:
            console.print("[dim]Black not found. Install with: pip install black[/dim]")

    # Check JS/TS formatting with Prettier
    if any(Path('.').glob('**/*.{js,jsx,ts,tsx}')):
        try:
            cmd = ["prettier", "--check"]
            cmd.extend(get_js_files(False))

            result = subprocess.run(cmd, check=False, capture_output=True, text=True)
            if result.returncode == 0:
                console.print("[green]✅ JavaScript/TypeScript code is properly formatted[/green]")
            else:
                console.print("[red]❌ JavaScript/TypeScript code needs formatting[/red]")
        except FileNotFoundError:
            console.print("[dim]Prettier not found. Install with: npm install -g prettier[/dim]")


@app.command()
def report():
    """Generate a linting report"""
    console.print(Panel("[bold]Linting Report[/bold]", title="Code Quality Status"))

    table = Table(title="Analysis Results")
    table.add_column("Tool", style="cyan")
    table.add_column("Status", style="magenta")
    table.add_column("Issues Found", style="dim")

    # Check Python formatting
    python_formatted = True
    if list(Path('.').glob('**/*.py')):
        try:
            result = subprocess.run([
                sys.executable, "-m", "black", "--check"
            ] + get_python_files(False), check=False, capture_output=True, text=True)
            python_formatted = result.returncode == 0
            status = "✅ OK" if python_formatted else "❌ Needs fix"
            issues = "0" if python_formatted else "See black output"
            table.add_row("Python Format", status, issues)
        except FileNotFoundError:
            table.add_row("Python Format", "❌ Not available", "Install black")

    # Check Python linting
    try:
        result = subprocess.run([
            "ruff", "check"
        ] + get_python_files(False), check=False, capture_output=True, text=True)
        python_linted = result.returncode == 0
        status = "✅ OK" if python_linted else "❌ Issues found"
        issues = "0" if python_linted else f"{result.stdout.count('error') if result.stdout else '?'}"
        table.add_row("Python Lint", status, issues)
    except FileNotFoundError:
        table.add_row("Python Lint", "❌ Not available", "Install ruff")

    # Check type checking
    try:
        result = subprocess.run([
            sys.executable, "-m", "mypy", "."
        ], check=False, capture_output=True, text=True)
        types_ok = result.returncode == 0
        status = "✅ OK" if types_ok else "❌ Type errors"
        issues = "0" if types_ok else f"{result.stdout.count('error') if result.stdout else '?'}"
        table.add_row("Type Check", status, issues)
    except FileNotFoundError:
        table.add_row("Type Check", "❌ Not available", "Install mypy")

    console.print(table)


if __name__ == "__main__":
    app()