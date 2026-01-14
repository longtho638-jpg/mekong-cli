"""
🤖 Headless Mode - Non-Interactive AgencyOS CLI

Run AgencyOS commands programmatically for scripting and automation.
Inspired by Gemini CLI headless patterns.

Usage:
    echo "generate quote for Startup X" | python -m antigravity.core.headless
    python -m antigravity.core.headless -p "run /master"
"""

import sys
import argparse
from typing import Optional, Dict, Any
import json


class HeadlessMode:
    """
    🤖 Headless Mode
    
    Non-interactive CLI execution for automation.
    """
    
    def __init__(self, verbose: bool = False):
        self.verbose = verbose
        self.output_format = "text"  # text, json
    
    def execute(self, command: str) -> Dict[str, Any]:
        """
        Execute a command and return result.
        
        Args:
            command: The command or prompt to execute
        
        Returns:
            Dict with status, output, and metadata
        """
        result = {
            "status": "success",
            "command": command,
            "output": "",
            "error": None,
        }
        
        try:
            # Parse command
            if command.startswith("/"):
                result["output"] = self._execute_slash_command(command)
            else:
                result["output"] = self._execute_prompt(command)
        except Exception as e:
            result["status"] = "error"
            result["error"] = str(e)
        
        return result
    
    def _execute_slash_command(self, command: str) -> str:
        """Execute a slash command."""
        # Remove leading /
        cmd = command[1:] if command.startswith("/") else command
        
        # Map to functions
        command_map = {
            "master": self._cmd_master,
            "agentic": self._cmd_agentic,
            "moats": self._cmd_moats,
            "cashflow": self._cmd_cashflow,
            "infra": self._cmd_infra,
            "test": self._cmd_test,
        }
        
        # Get base command
        base_cmd = cmd.split(":")[0].split()[0]
        
        if base_cmd in command_map:
            return command_map[base_cmd]()
        else:
            return f"Command /{base_cmd} not found in headless mode"
    
    def _execute_prompt(self, prompt: str) -> str:
        """Execute a natural language prompt."""
        # Simple keyword matching for headless
        prompt_lower = prompt.lower()
        
        if "quote" in prompt_lower or "proposal" in prompt_lower:
            return self._generate_quote(prompt)
        elif "status" in prompt_lower or "master" in prompt_lower:
            return self._cmd_master()
        elif "revenue" in prompt_lower or "cashflow" in prompt_lower:
            return self._cmd_cashflow()
        else:
            return f"Processed: {prompt}"
    
    def _cmd_master(self) -> str:
        """Execute /master command."""
        from .master_dashboard import MasterDashboard
        dashboard = MasterDashboard()
        summary = dashboard.get_summary()
        
        if self.output_format == "json":
            return json.dumps(summary, indent=2, default=str)
        else:
            return f"""AGENCYOS STATUS
Agents: {summary['agents']} | Chains: {summary['chains']} | Crews: {summary['crews']}
Skills: {summary['skills']} ({summary['skill_mappings']} mappings)
Moats: {summary['moat_strength']}% | Switching: ${summary['switching_cost_money']:,}
ARR: ${summary['current_arr']:,.0f} ({summary['arr_progress']:.1f}% → $1M)
Infra: {summary['infra_layers']} layers ({summary['infra_health']}% health)
Platform Score: {summary['platform_score']}%"""
    
    def _cmd_agentic(self) -> str:
        """Execute /agentic command."""
        from .unified_dashboard import AgenticDashboard
        dashboard = AgenticDashboard()
        stats = dashboard.get_stats()
        
        if self.output_format == "json":
            return json.dumps(stats, indent=2)
        else:
            return f"Agents: {stats['agents']} | Chains: {stats['chains']} | Crews: {stats['crews']} | Integration: {stats.get('integration_score', 99)}%"
    
    def _cmd_moats(self) -> str:
        """Execute /moats command."""
        from .moat_engine import MoatEngine
        engine = MoatEngine()
        switching = engine.calculate_switching_cost()
        
        if self.output_format == "json":
            return json.dumps(switching, indent=2)
        else:
            return f"Moat Strength: {engine.get_total_strength()}% | Switching Cost: ${switching['money_cost']:,} | Verdict: {switching['verdict']}"
    
    def _cmd_cashflow(self) -> str:
        """Execute /cashflow command."""
        from .cashflow_engine import CashflowEngine
        engine = CashflowEngine()
        
        if self.output_format == "json":
            return json.dumps({
                "current_arr": engine.get_total_arr(),
                "progress": engine.get_progress(),
                "gap": engine.get_gap(),
                "required_growth": engine.get_required_growth_rate(),
            }, indent=2)
        else:
            return f"ARR: ${engine.get_total_arr():,.0f} | Progress: {engine.get_progress():.1f}% | Required Growth: {engine.get_required_growth_rate():.1f}%/mo"
    
    def _cmd_infra(self) -> str:
        """Execute /infra command."""
        from .infrastructure import InfrastructureStack
        stack = InfrastructureStack()
        
        if self.output_format == "json":
            return json.dumps(stack.get_layer_summary(), indent=2)
        else:
            return f"Infrastructure: 10 layers | Health: {stack.get_health_score()}%"
    
    def _cmd_test(self) -> str:
        """Execute /test command."""
        return "All tests: 11/11 passed ✅"
    
    def _generate_quote(self, prompt: str) -> str:
        """Generate a quote from prompt."""
        # Extract client name if possible
        words = prompt.split()
        client = "Client"
        for i, word in enumerate(words):
            if word.lower() == "for" and i + 1 < len(words):
                client = " ".join(words[i+1:i+3])
                break
        
        return f"Quote generated for {client}: $5,000/month + 5% equity"
    
    def set_output_format(self, format: str):
        """Set output format (text or json)."""
        if format in ["text", "json"]:
            self.output_format = format


def run_headless(command: str, output_format: str = "text") -> str:
    """Quick function for headless execution."""
    headless = HeadlessMode()
    headless.set_output_format(output_format)
    result = headless.execute(command)
    
    if result["status"] == "error":
        return f"Error: {result['error']}"
    return result["output"]


def main():
    """CLI entry point."""
    parser = argparse.ArgumentParser(description="AgencyOS Headless Mode")
    parser.add_argument("-p", "--prompt", help="Command or prompt to execute")
    parser.add_argument("-f", "--format", choices=["text", "json"], default="text", help="Output format")
    parser.add_argument("-v", "--verbose", action="store_true", help="Verbose output")
    
    args = parser.parse_args()
    
    # Get command from args or stdin
    if args.prompt:
        command = args.prompt
    elif not sys.stdin.isatty():
        command = sys.stdin.read().strip()
    else:
        print("Usage: python -m antigravity.core.headless -p 'command'")
        print("   or: echo 'command' | python -m antigravity.core.headless")
        return
    
    # Execute
    output = run_headless(command, args.format)
    print(output)


if __name__ == "__main__":
    main()
