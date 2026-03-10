"""
Mekong CLI - Recipe Executor

Executes recipes parsed from Markdown files.
Returns ExecutionResult for orchestrator integration.
"""

import subprocess
import time
from rich.console import Console
from rich.panel import Panel
from rich.text import Text

from src.core.parser import Recipe, RecipeStep
from src.core.verifier import ExecutionResult


class RecipeExecutor:
    """Executes a Recipe step by step, returning structured results."""

    def __init__(self, recipe: Recipe) -> None:
        """Initialize RecipeExecutor with a parsed recipe.

        Args:
            recipe: The Recipe object containing steps to execute.
        """
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
        elif step_type == "tool":
            return self._execute_tool_step(step)
        elif step_type == "browse":
            return self._execute_browse_step(step)
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

    def _execute_tool_step(self, step: RecipeStep) -> ExecutionResult:
        """Execute step via AGI v2 ToolRegistry."""
        tool_name = step.params.get("tool_name", "") if step.params else ""
        tool_args = step.params.get("tool_args", {}) if step.params else {}

        if not tool_name:
            # Try to infer tool from step description
            tool_name = step.description.strip()

        self.console.print(f"[cyan][🔧 Tool] Executing:[/cyan] {tool_name}")

        try:
            from src.core.tool_registry import ToolRegistry

            registry = ToolRegistry()
            result = registry.execute(tool_name, tool_args)

            output = result.get("output", "")
            success = result.get("success", False)
            duration = result.get("duration_ms", 0)

            status_color = "green" if success else "red"
            self.console.print(
                f"[{status_color}]Tool {'succeeded' if success else 'failed'} "
                f"({duration:.0f}ms)[/{status_color}]"
            )

            if output:
                self.console.print(
                    Panel(
                        str(output)[:1000],
                        title=f"Tool: {tool_name}",
                        border_style=status_color,
                        expand=False,
                    )
                )

            return ExecutionResult(
                exit_code=0 if success else 1,
                stdout=str(output),
                stderr=result.get("error", ""),
                metadata={
                    "mode": "tool",
                    "tool_name": tool_name,
                    "duration_ms": duration,
                },
            )

        except Exception as e:
            self.console.print(f"[bold red]Tool Error:[/bold red] {str(e)}")
            return ExecutionResult(
                exit_code=1,
                stdout="",
                stderr=str(e),
                error=e,
                metadata={"mode": "tool", "tool_name": tool_name},
            )

    def _execute_browse_step(self, step: RecipeStep) -> ExecutionResult:
        """Execute step via AGI v2 BrowserAgent."""
        url = step.params.get("url", "") if step.params else ""
        browse_action = step.params.get("action", "analyze") if step.params else "analyze"

        if not url:
            url = step.description.strip()

        self.console.print(f"[cyan][🌐 Browse] {browse_action}:[/cyan] {url}")

        try:
            from src.core.browser_agent import BrowserAgent

            agent = BrowserAgent()

            if browse_action == "check":
                result = agent.check_status(url)
                status_color = "green" if result.success else "red"
                output = f"HTTP {result.status_code} ({result.duration_ms:.0f}ms)"
            elif browse_action == "links":
                result = agent.get_links(url)
                output = f"Found {len(result.links)} links:\n" + "\n".join(
                    result.links[:10]
                )
            else:  # analyze
                result = agent.analyze_page(url)
                output = (
                    f"Title: {result.title}\n"
                    f"Status: {result.status_code}\n"
                    f"Links: {len(result.links)}\n"
                    f"Load Time: {result.load_time_ms:.0f}ms\n\n"
                    f"{result.text_content[:500]}"
                )
                status_color = "green" if result.status_code < 400 else "red"

            self.console.print(
                Panel(
                    output[:1000],
                    title=f"Browse: {url[:60]}",
                    border_style="cyan",
                    expand=False,
                )
            )

            return ExecutionResult(
                exit_code=0 if result.success else 1,
                stdout=output,
                stderr="",
                metadata={
                    "mode": "browse",
                    "url": url,
                    "action": browse_action,
                },
            )

        except Exception as e:
            self.console.print(f"[bold red]Browse Error:[/bold red] {str(e)}")
            return ExecutionResult(
                exit_code=1,
                stdout="",
                stderr=str(e),
                error=e,
                metadata={"mode": "browse", "url": url},
            )

    def _execute_shell_step(self, step: RecipeStep) -> ExecutionResult:
        """Execute shell command step with automatic retry on failure."""
        command = step.description.strip()

        if not command:
            self.console.print("[yellow]Skipping empty step[/yellow]")
            return ExecutionResult(
                exit_code=0,
                stdout="[SKIPPED] Empty command",
                stderr="",
                metadata={"mode": "shell", "skipped": True},
            )

        max_attempts = step.params.get("retry", 1) + 1 if step.params else 2
        retry_delay = step.params.get("retry_delay", 2) if step.params else 2

        for attempt in range(1, max_attempts + 1):
            if attempt > 1:
                self.console.print(
                    f"[yellow]Retry {attempt - 1}/{max_attempts - 1} after {retry_delay}s...[/yellow]"
                )
                time.sleep(retry_delay)

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
                    metadata={
                        "mode": "shell",
                        "command": command,
                        "attempt": attempt,
                    },
                )

            except subprocess.CalledProcessError as e:
                # Retry if not on last attempt
                if attempt < max_attempts:
                    self.console.print(
                        f"[yellow]Step {step.order} failed (exit {e.returncode})[/yellow]"
                    )
                    continue

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
                    metadata={
                        "mode": "shell",
                        "command": command,
                        "attempt": attempt,
                    },
                )
            except Exception as e:
                self.console.print(f"[bold red]Unexpected error:[/bold red] {str(e)}")
                return ExecutionResult(
                    exit_code=1,
                    stdout="",
                    stderr=str(e),
                    error=e,
                    metadata={
                        "mode": "shell",
                        "command": command,
                        "attempt": attempt,
                    },
                )

        # Should not reach here, but safety fallback
        return ExecutionResult(
            exit_code=1,
            stdout="",
            stderr="Max retries exhausted",
            metadata={"mode": "shell", "command": command, "attempt": max_attempts},
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
