import shutil
import subprocess
from pathlib import Path
import typer
from rich.console import Console

from core.config import get_settings
from core.constants import APP_NAME

try:
    from deploy_automation import run_deploy
    from license import LicenseTier, LicenseValidator
except ImportError:
    run_deploy = None
    LicenseTier = None
    LicenseValidator = None

settings = get_settings()
TEMPLATE_REPO_STARTER = settings.TEMPLATE_REPO_STARTER
TEMPLATE_REPO_PRO = settings.TEMPLATE_REPO_PRO

console = Console()

def _get_license_validator():
    """Lazy load license validator."""
    if LicenseValidator is None:
        console.print("[red]Error: license module not found.[/red]")
        raise typer.Exit(code=1)
    return LicenseValidator()

def init(project_name: str):
    """
    Initialize a new Hybrid Agent project from the Golden Template.
    """
    console.print(f"[bold blue]{APP_NAME}:[/bold blue] Initializing {project_name}...")
    
    target_dir = Path.cwd() / project_name
    
    if target_dir.exists():
        console.print(f"[bold red]Error:[/bold red] Directory {project_name} already exists!")
        raise typer.Exit(code=1)

    # Check license tier
    validator = _get_license_validator()
    tier = validator.get_tier()
    
    # Determine template repo
    is_pro = tier in [LicenseTier.PRO, LicenseTier.ENTERPRISE]
    template_repo = TEMPLATE_REPO_PRO if is_pro else TEMPLATE_REPO_STARTER
    
    if is_pro:
        console.print("   🔑 Pro/Enterprise tier detected")
        console.print("   📦 Cloning Pro template (10 niches, white-label)...")
    else:
        console.print("   🆓 Starter tier (Upgrade for Pro features)")
        console.print("   📦 Cloning Starter template (1 niche, basic features)...")

    try:
        subprocess.run(["git", "clone", template_repo, str(project_name)], check=True)
        console.print("   ✅ Template setup complete")
        
        # Remove template git history
        git_dir = target_dir / ".git"
        if git_dir.exists():
            shutil.rmtree(git_dir)
            console.print("   ✅ Removed old git history")
            
        console.print(f"\n[bold green]🚀 Project {project_name} created successfully![/bold green]")
        
        if tier == LicenseTier.STARTER:
            console.print("\n   💡 [yellow]Want 10 niches + white-label? Upgrade to Pro:[/yellow]")
            console.print("      [cyan]mekong activate --key mk_live_pro_xxxxx[/cyan]")
        
        console.print(f"\nNext steps:\n  cd {project_name}\n  mekong setup-vibe")
        
    except subprocess.CalledProcessError as e:
        console.print(f"[bold red]Failed to clone template:[/bold red] {e}")
        raise typer.Exit(code=1)
    except Exception as e:
        console.print(f"[bold red]Failed:[/bold red] {e}")
        raise typer.Exit(code=1)

def deploy_cmd():
    """
    Deploy the Hybrid Agent to Google Cloud Run.
    """
    if run_deploy:
        run_deploy()
    else:
        console.print("[red]Deploy module not found.[/red]")
