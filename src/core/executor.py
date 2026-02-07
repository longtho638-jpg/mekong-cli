"""
Mekong CLI - Recipe Executor

Executes recipes parsed from Markdown files.
Returns ExecutionResult for orchestrator integration.
"""

import subprocess
from rich.console import Console
from rich.panel import Panel
from rich.text import Text

from src.core.parser import Recipe, RecipeStep
from src.core.verifier import ExecutionResult


class RecipeExecutor:
    """Executes a Recipe step by step, returning structured results."""

    def __init__(self, recipe: Recipe):
        self.recipe = recipe
        self.console = Console()

    def execute_step(self, step: RecipeStep) -> ExecutionResult:
        """
        Execute a single step.
        Supports multiple execution modes: shell, llm, api

        Returns:
            ExecutionResult with exit_code, stdout, stderr for verification
        """
        self.console.print(f"\n[bold blue]Step {step.order}:[/bold blue] {step.title}")

        # Determine execution mode from step params or description
        step_type = step.params.get("type", "shell") if step.params else "shell"

        # Handle different execution types
        if step_type == "llm":
            return self._execute_llm_step(step)
        elif step_type == "api":
            return self._execute_api_step(step)
        else:
            return self._execute_shell_step(step)

    def _execute_llm_step(self, step: RecipeStep) -> ExecutionResult:
        """Execute LLM generation step via Antigravity Proxy or OpenAI."""
        from src.core.llm_client import get_client

        self.console.print(f"[cyan][LLM] Generating:[/cyan] {step.description}")

        client = get_client()
        if not client.is_available:
            self.console.print("[yellow]⚠️  LLM offline — skipping step[/yellow]")
            return ExecutionResult(
                exit_code=0,
                stdout="[SKIPPED] LLM offline",
                stderr="",
                metadata={"mode": "llm", "skipped": True},
            )

        try:
            prompt = step.description
            system_prompt = step.params.get("system", "") if step.params else ""

            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})

            response = client.chat(messages)
            output = response.content[:2000]
            self.console.print(
                Panel(
                    output,
                    title=f"LLM Output ({response.model})",
                    border_style="cyan",
                    expand=False,
                )
            )
            return ExecutionResult(
                exit_code=0,
                stdout=response.content,
                stderr="",
                metadata={"mode": "llm", "model": response.model},
            )

        except Exception as e:
            self.console.print(f"[bold red]LLM Error:[/bold red] {str(e)}")
            return ExecutionResult(
                exit_code=1,
                stdout="",
                stderr=str(e),
                error=e,
                metadata={"mode": "llm"},
            )

    def _execute_api_step(self, step: RecipeStep) -> ExecutionResult:
        """Execute API call step."""
        import requests as req

        url = step.params.get("url", "") if step.params else ""
        method = (step.params.get("method", "GET") if step.params else "GET").upper()
        body = step.params.get("body", None) if step.params else None
        headers = step.params.get("headers", {}) if step.params else {}

        if not url:
            self.console.print(
                "[yellow]⚠️  No URL specified — skipping API step[/yellow]"
            )
            return ExecutionResult(
                exit_code=0,
                stdout="[SKIPPED] No URL",
                stderr="",
                metadata={"mode": "api", "skipped": True},
            )

        self.console.print(f"[cyan][API] {method}:[/cyan] {url}")

        try:
            response = req.request(method, url, json=body, headers=headers, timeout=30)
            status_color = "green" if response.ok else "red"
            self.console.print(
                f"[{status_color}]Status: {response.status_code}[/{status_color}]"
            )

            preview = response.text[:1000] if response.text else ""
            if preview:
                self.console.print(
                    Panel(preview, title="Response", border_style="dim", expand=False)
                )

            return ExecutionResult(
                exit_code=0 if response.ok else 1,
                stdout=response.text or "",
                stderr="" if response.ok else f"HTTP {response.status_code}",
                metadata={
                    "mode": "api",
                    "status_code": response.status_code,
                    "url": url,
                },
            )

        except req.exceptions.RequestException as e:
            self.console.print(f"[bold red]API Error:[/bold red] {str(e)}")
            return ExecutionResult(
                exit_code=1,
                stdout="",
                stderr=str(e),
                error=e,
                metadata={"mode": "api", "url": url},
            )

    def _execute_shell_step(self, step: RecipeStep) -> ExecutionResult:
        """Execute shell command step."""
        command = step.description.strip()

        if not command:
            self.console.print("[yellow]Skipping empty step[/yellow]")
            return ExecutionResult(
                exit_code=0,
                stdout="[SKIPPED] Empty command",
                stderr="",
                metadata={"mode": "shell", "skipped": True},
            )

        self.console.print(f"[dim]Running:[/dim] {command}")

        try:
            process = subprocess.run(
                command, shell=True, check=True, text=True, capture_output=True
            )

            if process.stdout:
                self.console.print(
                    Panel(
                        process.stdout.strip(),
                        title="Output",
                        border_style="green",
                        expand=False,
                    )
                )

            if process.stderr:
                self.console.print(
                    Panel(
                        process.stderr.strip(),
                        title="Stderr",
                        border_style="yellow",
                        expand=False,
                    )
                )

            return ExecutionResult(
                exit_code=process.returncode,
                stdout=process.stdout or "",
                stderr=process.stderr or "",
                metadata={"mode": "shell", "command": command},
            )

        except subprocess.CalledProcessError as e:
            self.console.print(
                f"[bold red]Error executing step {step.order}[/bold red]"
            )
            if e.stdout:
                self.console.print(
                    Panel(
                        e.stdout.strip(),
                        title="Output (Partial)",
                        border_style="yellow",
                        expand=False,
                    )
                )
            if e.stderr:
                self.console.print(
                    Panel(
                        e.stderr.strip(),
                        title="Error Output",
                        border_style="red",
                        expand=False,
                    )
                )
            return ExecutionResult(
                exit_code=e.returncode,
                stdout=e.stdout or "",
                stderr=e.stderr or "",
                error=e,
                metadata={"mode": "shell", "command": command},
            )
        except Exception as e:
            self.console.print(f"[bold red]Unexpected error:[/bold red] {str(e)}")
            return ExecutionResult(
                exit_code=1,
                stdout="",
                stderr=str(e),
                error=e,
                metadata={"mode": "shell", "command": command},
            )

    def run(self) -> bool:
        """Run the full recipe (legacy mode, returns bool for backward compat)."""
        self.console.print(
            Panel(
                Text(self.recipe.description, style="italic"),
                title=f"🚀 Running: {self.recipe.name}",
                border_style="cyan",
            )
        )

        for step in self.recipe.steps:
            result = self.execute_step(step)
            if result.exit_code != 0:
                self.console.print("\n[bold red]❌ Recipe execution failed.[/bold red]")
                return False

        self.console.print(
            f"\n[bold green]✨ Recipe '{self.recipe.name}' completed successfully![/bold green]"
        )
        return True
