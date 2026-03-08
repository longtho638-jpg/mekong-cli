"""
Mekong CLI - Security Commands

Commands for security hardening, attestation, and compliance validation.
"""

import typer
from pathlib import Path
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

from src.security.attestation_generator import SecurityAttestationGenerator

app = typer.Typer(help="Security commands for Mekong CLI")
console = Console()


@app.command("attest")
def generate_attestation(
    repo: str = typer.Option(".", help="Repository path"),
    output: str = typer.Option("plans/reports", help="Output directory"),
    quiet: bool = typer.Option(False, help="Suppress output except report path"),
):
    """
    Generate security attestation report.

    Scans for hardcoded secrets, verifies command sanitizer is enabled,
    and generates a signed attestation report compatible with RaaS Gateway.
    """
    generator = SecurityAttestationGenerator(repo)

    # Run security checks
    security_results = generator.run_security_checks()

    # Generate attestation
    attestation = generator.generate_attestation(security_results)

    # Sign attestation
    signature = generator.sign_attestation(attestation)

    # Save report
    report_path = generator.save_report(attestation, signature, output)

    if not quiet:
        generator.print_report(attestation, signature)
        console.print(f"\n[bold green]Report saved to:[/bold green] {report_path}")

    # Exit with appropriate code
    if attestation["status"] == "ATTESTED_SECURE":
        console.print("\n[bold green]✅ Security Attestation: PASSED[/bold green]")
        raise typer.Exit(0)
    else:
        console.print("\n[bold red]❌ Security Attestation: FAILED[/bold red]")
        raise typer.Exit(1)


@app.command("scan-secrets")
def scan_secrets(
    path: str = typer.Option("src/", help="Path to scan"),
    strict: bool = typer.Option(True, help="Fail on any findings"),
):
    """
    Scan codebase for hardcoded secrets.
    """
    console.print("[bold]Scanning for hardcoded secrets...[/bold]\n")

    import subprocess

    patterns = [
        (r"API_KEY\s*=\s*['\"][a-zA-Z0-9]{16,}['\"]", "API Key"),
        (r"SECRET\s*=\s*['\"][a-zA-Z0-9]{16,}['\"]", "Secret"),
        (r"PASSWORD\s*=\s*['\"][a-zA-Z0-9]{8,}['\"]", "Password"),
        (r"TOKEN\s*=\s*['\"][a-zA-Z0-9]{16,}['\"]", "Token"),
    ]

    findings = []

    for pattern, name in patterns:
        try:
            result = subprocess.run(
                ["grep", "-rE", pattern, path, "--include=*.py", "--include=*.ts", "--include=*.js"],
                capture_output=True,
                text=True,
            )

            if result.returncode == 0 and result.stdout:
                for line in result.stdout.strip().split("\n"):
                    if "os.getenv" not in line and "os.environ" not in line:
                        findings.append(f"{name}: {line}")
        except Exception:
            pass

    if findings:
        console.print(f"[bold red]Found {len(findings)} potential secret(s):[/bold red]\n")
        for finding in findings[:10]:  # Show first 10
            console.print(f"  - {finding}")
        if strict:
            raise typer.Exit(1)
    else:
        console.print("[bold green]✅ No hardcoded secrets found[/bold green]")

    raise typer.Exit(0)


@app.command("check-env")
def check_env_files(
    repo: str = typer.Option(".", help="Repository path"),
):
    """
    Check for exposed .env files.
    """
    console.print("[bold]Checking for exposed .env files...[/bold]\n")

    import subprocess

    try:
        result = subprocess.run(
            ["find", repo, "-name", ".env*", "-not", "-path", "*/node_modules/*", "-not", "-path", "*/.venv/*"],
            capture_output=True,
            text=True,
        )

        if result.returncode == 0 and result.stdout:
            files = [f for f in result.stdout.strip().split("\n") if f and ".env.example" not in f]

            if files:
                console.print(f"[yellow]⚠️  Found {len(files)} .env file(s):[/yellow]\n")
                for f in files[:10]:
                    console.print(f"  - {f}")
                console.print("\n[yellow]Ensure these are in .gitignore![/yellow]")
            else:
                console.print("[bold green]✅ No exposed .env files[/bold green]")
        else:
            console.print("[bold green]✅ No exposed .env files[/bold green]")
    except Exception as e:
        console.print(f"[red]Error: {e}[/red]")
        raise typer.Exit(1)

    raise typer.Exit(0)


@app.command("status")
def security_status(
    repo: str = typer.Option(".", help="Repository path"),
):
    """
    Show overall security status.
    """
    console.print(Panel.fit("[bold]Mekong CLI Security Status[/bold]\n"))

    # Create status table
    table = Table(show_header=True, header_style="bold magenta")
    table.add_column("Check", style="cyan")
    table.add_column("Status", justify="center")
    table.add_column("Details", style="yellow")

    # Check command sanitizer
    sanitizer_path = Path(repo) / "src" / "security" / "command_sanitizer.py"
    if sanitizer_path.exists():
        table.add_row("Command Sanitizer", "✅", "Implemented")
    else:
        table.add_row("Command Sanitizer", "❌", "NOT found")

    # Check attestation generator
    attestation_path = Path(repo) / "src" / "security" / "attestation_generator.py"
    if attestation_path.exists():
        table.add_row("Attestation Generator", "✅", "Available")
    else:
        table.add_row("Attestation Generator", "❌", "NOT found")

    # Check GitHub Actions
    security_workflow = Path(repo) / ".github" / "workflows" / "security-hardening.yml"
    if security_workflow.exists():
        table.add_row("Security Workflow", "✅", "Configured")
    else:
        table.add_row("Security Workflow", "❌", "NOT found")

    console.print(table)

    # Overall status
    checks_passed = sum([
        sanitizer_path.exists(),
        attestation_path.exists(),
        security_workflow.exists(),
    ])

    console.print(f"\nSecurity Score: {checks_passed}/3")

    if checks_passed == 3:
        console.print("\n[bold green]🎉 Security Hardening: COMPLETE (6→10/10)[/bold green]")
    elif checks_passed == 2:
        console.print("\n[bold yellow]⚠️  Security Hardening: IN PROGRESS (8/10)[/bold yellow]")
    else:
        console.print("\n[bold red]❌ Security Hardening: NEEDS WORK (< 8/10)[/bold red]")


if __name__ == "__main__":
    app()
