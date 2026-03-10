"""Security command - Audit, scan, and secure applications"""

import typer
from rich.console import Console
from rich.table import Table
import subprocess
import sys
from pathlib import Path
import json
from datetime import datetime
from typing import Optional, List, Dict, Union

app = typer.Typer()
console = Console()


@app.command()
def scan(
    path: str = typer.Argument(".", help="Path to scan"),
    tool: str = typer.Option("auto", "--tool", "-t", help="Tool to use: bandit, semgrep, safety, auto"),
    format_output: str = typer.Option("table", "--format", "-f", help="Output format: table, json, sarif"),
    severity: str = typer.Option("all", "--severity", "-s", help="Severity level: low, medium, high, critical, all"),
    exclude: Optional[str] = typer.Option(None, "--exclude", "-e", help="Exclude patterns"),
) -> None:
    """Scan project for security vulnerabilities."""

    console.print(f"[bold]🔍 Scanning {path} for security vulnerabilities...[/bold]")

    scan_results = []

    if tool == "auto" or tool == "bandit":
        bandit_results = scan_with_bandit(path, severity)
        if bandit_results:
            scan_results.extend(bandit_results)

    if tool == "auto" or tool == "safety":
        safety_results = scan_with_safety(path)
        if safety_results:
            scan_results.extend(safety_results)

    if tool == "auto" or tool == "semgrep":
        semgrep_results = scan_with_semgrep(path, severity)
        if semgrep_results:
            scan_results.extend(semgrep_results)

    if format_output == "json":
        output_json = {
            "timestamp": datetime.now().isoformat(),
            "path": path,
            "tool": tool,
            "results": scan_results,
            "summary": {
                "total": len(scan_results),
                "critical": len([r for r in scan_results if r.get('severity') == 'CRITICAL']),
                "high": len([r for r in scan_results if r.get('severity') == 'HIGH']),
                "medium": len([r for r in scan_results if r.get('severity') == 'MEDIUM']),
                "low": len([r for r in scan_results if r.get('severity') == 'LOW']),
            }
        }
        console.print_json(data=output_json)
    else:
        # Display in table format
        display_scan_results(scan_results)


def scan_with_bandit(path: str, severity: str) -> List[Dict[str, Union[str, int]]]:
    """Scan with Bandit (Python security scanner)"""
    try:
        result = subprocess.run([
            sys.executable, "-m", "bandit",
            "-r", path,
            "-f", "json"
        ], capture_output=True, text=True, check=False)

        if result.returncode == 0 or result.returncode == 1:  # 1 means issues found
            data = json.loads(result.stdout)
            issues = data.get("results", [])

            bandit_results = []
            for issue in issues:
                sev_map = {"LOW": "LOW", "MEDIUM": "MEDIUM", "HIGH": "HIGH"}
                issue_severity = sev_map.get(issue.get("issue_severity", "").upper(), "MEDIUM")

                if severity == "all" or issue_severity.lower() == severity.lower():
                    bandit_results.append({
                        "tool": "Bandit",
                        "file": issue.get("filename", ""),
                        "line": issue.get("line_number", 0),
                        "severity": issue_severity,
                        "code": issue.get("test_id", ""),
                        "message": issue.get("issue_text", ""),
                        "confidence": issue.get("issue_confidence", ""),
                    })

            return bandit_results
        else:
            console.print(f"[yellow]⚠️  Bandit scan failed: {result.stderr}[/yellow]")
            return []

    except FileNotFoundError:
        console.print("[dim]Bandit not found. Install with: pip install bandit[/dim]")
        return []
    except json.JSONDecodeError:
        console.print("[yellow]⚠️  Bandit output format not recognized[/yellow]")
        return []


def scan_with_safety(path: str) -> List[Dict[str, Union[str, int]]]:
    """Scan dependencies with Safety (dependency vulnerability scanner)."""
    try:
        # First, try to generate a requirements.txt if none exists
        req_files = list(Path(path).glob("**/requirements*.txt")) + \
                   list(Path(path).glob("**/Pipfile")) + \
                   list(Path(path).glob("**/pyproject.toml"))

        if not req_files:
            console.print("[yellow]⚠️  No dependency files found, skipping Safety scan[/yellow]")
            return []

        # Use the first found requirements file
        req_file = str(req_files[0])

        result = subprocess.run([
            sys.executable, "-m", "safety", "check",
            "-r", req_file,
            "--format", "json"
        ], capture_output=True, text=True, check=False)

        if result.returncode == 0 or result.returncode == 1:  # 1 means vulnerabilities found
            try:
                issues = json.loads(result.stdout)
                safety_results = []

                for issue in issues:
                    safety_results.append({
                        "tool": "Safety",
                        "file": req_file,
                        "line": 0,
                        "severity": issue.get("analyzed_version", {}).get("vulnerabilities", [{}])[0].get("cvssv3", {}).get("base_severity", "HIGH") if issue.get("analyzed_version", {}).get("vulnerabilities") else "MEDIUM",
                        "code": issue.get("name", ""),
                        "message": issue.get("vulnerabilities", [{}])[0].get("description", "") if issue.get("vulnerabilities") else "",
                        "confidence": "HIGH",
                    })

                return safety_results
            except json.JSONDecodeError:
                console.print("[yellow]⚠️  Safety output format not recognized[/yellow]")
                return []
        else:
            console.print(f"[yellow]⚠️  Safety scan failed: {result.stderr}[/yellow]")
            return []

    except FileNotFoundError:
        console.print("[dim]Safety not found. Install with: pip install safety[/dim]")
        return []


def scan_with_semgrep(path: str, severity: str) -> List[Dict[str, Union[str, int]]]:
    """Scan with Semgrep (static analysis tool)."""
    try:
        result = subprocess.run([
            "semgrep", "--config=auto",
            "--json",
            path
        ], capture_output=True, text=True, check=False)

        if result.returncode == 0 or result.returncode == 1:  # 1 means findings found
            data = json.loads(result.stdout)
            issues = data.get("results", [])

            semgrep_results = []
            for issue in issues:
                sev = issue.get("extra", {}).get("severity", "MEDIUM").upper()
                if severity == "all" or sev.lower() == severity.lower():
                    semgrep_results.append({
                        "tool": "Semgrep",
                        "file": issue.get("path", ""),
                        "line": issue.get("start", {}).get("line", 0),
                        "severity": sev,
                        "code": issue.get("check_id", ""),
                        "message": issue.get("extra", {}).get("message", ""),
                        "confidence": issue.get("extra", {}).get("confidence", "MEDIUM"),
                    })

            return semgrep_results
        else:
            console.print(f"[yellow]⚠️  Semgrep scan failed: {result.stderr}[/yellow]")
            return []

    except FileNotFoundError:
        console.print("[dim]Semgrep not found. Install with: pip install semgrep[/dim]")
        return []
    except json.JSONDecodeError:
        console.print("[yellow]⚠️  Semgrep output format not recognized[/yellow]")
        return []


def display_scan_results(results: List[Dict[str, Union[str, int]]]) -> None:  # type: ignore[misc]
    """Display scan results in a table."""
    if not results:
        console.print("[green]✅ No security issues found![/green]")
        return

    console.print(f"[bold]📊 Found {len(results)} security issues:[/bold]")

    # Group by severity
    critical_issues = [r for r in results if r['severity'] == 'CRITICAL']
    high_issues = [r for r in results if r['severity'] == 'HIGH']
    medium_issues = [r for r in results if r['severity'] == 'MEDIUM']
    low_issues = [r for r in results if r['severity'] == 'LOW']

    # Show summary
    summary_table = Table(title="Security Issues Summary")
    summary_table.add_column("Severity", style="cyan")
    summary_table.add_column("Count", style="magenta", justify="right")

    if critical_issues:
        summary_table.add_row("🔴 CRITICAL", str(len(critical_issues)))
    if high_issues:
        summary_table.add_row("🟠 HIGH", str(len(high_issues)))
    if medium_issues:
        summary_table.add_row("🟡 MEDIUM", str(len(medium_issues)))
    if low_issues:
        summary_table.add_row("🔵 LOW", str(len(low_issues)))

    console.print(summary_table)

    # Show detailed results
    results_table = Table(title="Security Issues Detail")
    results_table.add_column("Tool", style="cyan")
    results_table.add_column("Severity", style="magenta")
    results_table.add_column("File:Line", style="yellow")
    results_table.add_column("Issue", style="dim")

    # Sort by severity (critical, high, medium, low)
    severity_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
    sorted_results = sorted(results, key=lambda x: severity_order.get(x['severity'], 4))  # type: ignore[arg-type]

    for result in sorted_results:  # type: ignore[assignment]
        severity_style = {
            "CRITICAL": "red bold",
            "HIGH": "red",
            "MEDIUM": "yellow",
            "LOW": "blue"
        }.get(result['severity'], "white")

        results_table.add_row(
            str(result['tool']),  # type: ignore[arg-type]
            f"[{severity_style}]{result['severity']}[/{severity_style}]",
            f"{result['file']}:{result['line']}",
            result['message'][:60] + "..." if len(result['message']) > 60 else result['message']
        )

    console.print(results_table)


@app.command()
def scan_secrets(
    path: str = typer.Argument(".", help="Path to scan for secrets"),
    include_filenames: bool = typer.Option(False, "--include-filenames", help="Include filenames in output"),
    entropy_threshold: float = typer.Option(4.5, "--entropy", help="Entropy threshold for detection"),
):
    """Scan for hardcoded secrets and credentials"""

    console.print(f"[bold]🔑 Scanning {path} for hardcoded secrets...[/bold]")

    secrets_found = []

    # Common patterns for secrets
    secret_patterns = [
        r'["\'](?:password|passwd|pwd|secret|token|key|api_key|api-key)["\'][\s:]=[\s\'"]*[^\'"\s]{8,}',
        r'(?:api_key|secret_key|aws_access|aws_secret|client_secret|private_key)[\s:]=[\s\'"]*[^\'"\s]{8,}',
        r'https?://[^\s\'"]*:[^\s\'"@]*@[^\s\'"]*',  # URLs with credentials
        r'BEGIN (?:RSA |EC |DSA |PGP |SSH )?(?:PRIVATE|PUBLIC) KEY',
    ]

    import re

    for file_path in Path(path).rglob("*"):
        if file_path.is_file() and file_path.suffix.lower() in ['.py', '.js', '.ts', '.json', '.yml', '.yaml', '.env', '.txt']:
            try:
                file_content = file_path.read_text(encoding='utf-8')
                for pattern in secret_patterns:
                    matches = re.finditer(pattern, file_content, re.IGNORECASE)
                    for match in matches:
                        secrets_found.append({
                            "file": str(file_path),
                            "line_num": file_content[:match.start()].count('\n') + 1,
                            "match": match.group()[:50] + "..." if len(match.group()) > 50 else match.group(),
                            "pattern": pattern
                        })
            except UnicodeDecodeError:
                # Skip binary files
                continue
            except PermissionError:
                continue

    if secrets_found:
        console.print(f"[red]❌ Found {len(secrets_found)} potential secrets![/red]")

        secrets_table = Table(title="Potential Secrets Found")
        secrets_table.add_column("File", style="cyan")
        secrets_table.add_column("Line", style="magenta", justify="right")
        secrets_table.add_column("Match", style="yellow")

        for secret in secrets_found:
            secrets_table.add_row(
                secret["file"] if include_filenames else Path(secret["file"]).name,
                str(secret["line_num"]),
                secret["match"]
            )

        console.print(secrets_table)

        console.print("\n[yellow]⚠️  IMPORTANT: Rotate these credentials and DO NOT commit them to version control![/yellow]")
    else:
        console.print("[green]✅ No obvious secrets found![/green]")


@app.command()
def audit_config() -> None:
    """Audit configuration files for security issues."""

    console.print("[bold]🛡️  Auditing configuration files for security issues...[/bold]")

    findings = []

    # Check for common security misconfigurations
    config_files = list(Path(".").glob("**/{settings,config,configuration}.py")) + \
                  list(Path(".").glob("**/config.json")) + \
                  list(Path(".").glob("**/appsettings.json")) + \
                  list(Path(".").glob("**/application.properties")) + \
                  list(Path(".").glob("**/.env*")) + \
                  list(Path(".").glob("**/docker-compose*.yml")) + \
                  list(Path(".").glob("**/docker-compose*.yaml"))

    for config_file in config_files:
        content = config_file.read_text()

        # Check for DEBUG=True in Django settings
        if config_file.suffix == ".py" and "DEBUG = True" in content:
            findings.append({
                "file": str(config_file),
                "issue": "DEBUG mode enabled in production",
                "severity": "HIGH",
                "recommendation": "Set DEBUG = False for production"
            })

        # Check for SECRET_KEY with default/weak values
        if "SECRET_KEY =" in content and ("changeme" in content or "your-secret-key" in content or "dev-key" in content):
            findings.append({
                "file": str(config_file),
                "issue": "Weak or default SECRET_KEY detected",
                "severity": "HIGH",
                "recommendation": "Use a strong, randomly generated secret key"
            })

        # Check for exposed credentials in compose files
        if "docker-compose" in config_file.name and ("password:" in content or "secret:" in content) and "${" not in content:
            findings.append({
                "file": str(config_file),
                "issue": "Credentials exposed in Docker Compose file",
                "severity": "HIGH",
                "recommendation": "Use environment variables or Docker secrets"
            })

    if findings:
        console.print(f"[red]❌ Found {len(findings)} security misconfigurations![/red]")

        config_table = Table(title="Configuration Issues")
        config_table.add_column("File", style="cyan")
        config_table.add_column("Severity", style="magenta")
        config_table.add_column("Issue", style="yellow")
        config_table.add_column("Recommendation", style="dim")

        severity_colors = {"LOW": "blue", "MEDIUM": "yellow", "HIGH": "red", "CRITICAL": "red bold"}

        for finding in findings:
            severity_color = severity_colors.get(finding["severity"], "white")
            config_table.add_row(
                Path(finding["file"]).name,
                f"[{severity_color}]{finding['severity']}[/{severity_color}]",
                finding["issue"],
                finding["recommendation"]
            )

        console.print(config_table)
    else:
        console.print("[green]✅ No configuration security issues found![/green]")


@app.command()
def generate_report(output_file: str = typer.Option("security-report.json", "--output", "-o", help="Output file for report")):
    """Generate comprehensive security report"""

    console.print(f"[bold]📜 Generating security report: {output_file}...[/bold]")

    report_data = {
        "generated_at": datetime.now().isoformat(),
        "project_root": str(Path(".").absolute()),
        "report_type": "Security Assessment",
        "sections": {}
    }

    # Add dependency audit
    try:
        # Try to get pip freeze output for dependency list
        result = subprocess.run([sys.executable, "-m", "pip", "freeze"],
                              capture_output=True, text=True, check=True)
        report_data["sections"]["dependencies"] = result.stdout.split('\n')
    except Exception:
        report_data["sections"]["dependencies"] = ["Could not retrieve dependency list"]

    # Add file permissions info
    perms_info = []
    for file_path in Path(".").glob("**/*.py"):
        if file_path.is_file():
            stat = file_path.stat()
            perms_info.append({
                "file": str(file_path),
                "size": stat.st_size,
                "permissions": oct(stat.st_mode)[-3:]
            })

    report_data["sections"]["file_permissions"] = perms_info[:20]  # Limit to first 20 files

    # Add git security check
    if Path(".git").exists():
        try:
            result = subprocess.run(["git", "remote", "-v"],
                                  capture_output=True, text=True, check=True)
            report_data["sections"]["git_remotes"] = result.stdout
        except Exception:
            report_data["sections"]["git_remotes"] = "Could not retrieve git remotes"

    # Write report
    with open(output_file, 'w') as f:
        json.dump(report_data, f, indent=2)

    console.print(f"[green]✅ Security report generated: {output_file}[/green]")


@app.command()
def harden() -> None:
    """Suggest security hardening measures"""

    console.print("[bold]🔒 Security Hardening Recommendations:[/bold]")

    recommendations = [
        ("Update Dependencies", "Regularly update all dependencies to patch known vulnerabilities", "pip install --upgrade --upgrade-strategy eager"),
        ("Enable Two-Factor Authentication", "Add 2FA to all accounts and services", "Configure with your authentication provider"),
        ("Use Environment Variables", "Store sensitive data in environment variables, not code", "export SECRET_KEY='...'"),
        ("Implement Input Validation", "Validate all user inputs to prevent injection attacks", "Use validation libraries like Joi or express-validator"),
        ("Configure HTTPS", "Enforce HTTPS encryption for all connections", "Set up SSL/TLS certificates"),
        ("Enable Rate Limiting", "Protect against abuse and brute-force attacks", "Implement rate limiting middleware"),
        ("Minimize Attack Surface", "Disable unused services and close unnecessary ports", "Audit running services regularly"),
        ("Secure Session Management", "Implement secure session handling", "Use secure cookies with HttpOnly flag"),
        ("Log Security Events", "Maintain audit trails of security-relevant events", "Set up centralized logging"),
        ("Regular Security Testing", "Perform ongoing security assessments", "Schedule automated scans")
    ]

    rec_table = Table(title="Hardening Recommendations")
    rec_table.add_column("Area", style="cyan", width=20)
    rec_table.add_column("Recommendation", style="magenta", width=40)
    rec_table.add_column("Implementation", style="dim", width=30)

    for area, rec, impl in recommendations:
        rec_table.add_row(area, rec, impl)

    console.print(rec_table)

    # Additional specific checks for current project
    console.print("\n[bold]🔍 Project-Specific Checks:[/bold]")

    checks = []

    # Check if requirements.txt exists
    if Path("requirements.txt").exists():
        checks.append(("✅", "Dependencies tracked in requirements.txt"))
    else:
        checks.append(("❌", "Create requirements.txt with: pip freeze > requirements.txt"))

    # Check for .env file in .gitignore
    if Path(".gitignore").exists():
        gitignore_content = Path(".gitignore").read_text()
        if ".env" in gitignore_content or "*.env" in gitignore_content:
            checks.append(("✅", ".env file properly ignored"))
        else:
            checks.append(("⚠️", "Add .env to .gitignore to prevent credential leaks"))

    # Check for security-related packages
    if Path("requirements.txt").exists():
        req_content = Path("requirements.txt").read_text().lower()
        if "django" in req_content and "django-cors-headers" not in req_content:
            checks.append(("⚠️", "Consider adding django-cors-headers for CORS security"))

    check_table = Table()
    check_table.add_column("Status", style="cyan")
    check_table.add_column("Issue", style="magenta")

    for status, issue in checks:
        check_table.add_row(status, issue)

    console.print(check_table)


if __name__ == "__main__":
    app()
