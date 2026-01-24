"""
🔌 MCP Manager - Model Context Protocol Server Management
=========================================================

Manages the installation, configuration, and execution of MCP servers.
Enables "Zero-Prompt" installation of tools like Supabase MCP.

Usage:
    from antigravity.core.mcp_manager import MCPManager
    manager = MCPManager()
    manager.install_server("supabase", "npx", ["-y", "@supabase/mcp"])
"""

import json
import logging
import subprocess
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional

from typing_extensions import TypedDict


class MCPConfigDict(TypedDict, total=False):
    """MCP configuration dictionary type."""

    mcpServers: Dict[str, Any]


logger = logging.getLogger(__name__)

# Default MCP config locations
PROJECT_MCP_CONFIG = Path(".claude/mcp.json")  # Project local
USER_MCP_CONFIG = (
    Path.home() / "Library/Application Support/Claude/claude_desktop_config.json"
)  # macOS default


@dataclass
class MCPServerConfig:
    command: str
    args: List[str]
    env: Dict[str, str] = field(default_factory=dict)


class MCPManager:
    """
    🔌 MCP Server Manager

    Handles configuration and installation of MCP servers.
    """

    def __init__(self, config_path: Optional[Path] = None):
        # Prefer project config if it exists, otherwise use user config or default to project
        if config_path:
            self.config_path = config_path
        elif PROJECT_MCP_CONFIG.exists():
            self.config_path = PROJECT_MCP_CONFIG
        else:
            self.config_path = PROJECT_MCP_CONFIG  # Default to creating local

        self.config: MCPConfigDict = self._load_config()

    def _load_config(self) -> MCPConfigDict:
        """Load MCP configuration from disk."""
        if not self.config_path.exists():
            # If checking for example file
            example_path = self.config_path.with_name(".mcp.json.example")
            if example_path.exists():
                return json.loads(example_path.read_text())
            return {"mcpServers": {}}

        try:
            return json.loads(self.config_path.read_text())
        except Exception as e:
            logger.error(f"⚠️ Error loading MCP config: {e}")
            return {"mcpServers": {}}

    def _save_config(self):
        """Save MCP configuration to disk."""
        self.config_path.parent.mkdir(parents=True, exist_ok=True)
        self.config_path.write_text(json.dumps(self.config, indent=2))
        logger.info(f"✅ MCP config updated: {self.config_path}")

    def add_server(self, name: str, config: MCPServerConfig):
        """Add or update an MCP server configuration."""
        if "mcpServers" not in self.config:
            self.config["mcpServers"] = {}

        server_entry = {
            "command": config.command,
            "args": config.args,
            "env": config.env,
        }
        self.config["mcpServers"][name] = server_entry
        self._save_config()

        # Update Tool Catalog (Lazy probe - in real scenario we would connect and list tools)
        from .registry.mcp_catalog import mcp_catalog

        # For now, we register the server config without tools to mark it as unprobed.
        mcp_catalog.register_server(name, server_entry, None)

    def install_supabase(self, project_ref: str, api_key: str):
        """
        Specialized installer for Supabase MCP.
        Uses npx for zero-setup execution.
        """
        # Determine args based on whether it's npx or uvx
        # We'll use npx as standard for Node.js based MCPs

        server_config = MCPServerConfig(
            command="npx",
            args=["-y", "@supabase/mcp"],  # Official package
            env={"SUPABASE_URL": f"https://{project_ref}.supabase.co", "SUPABASE_KEY": api_key},
        )

        self.add_server("supabase", server_config)
        logger.info(f"🎉 Supabase MCP installed! (Project: {project_ref})")

    def install_from_url(self, url: str):
        """
        Attempt to install an MCP server from a Git URL.
        Clone -> Install Deps -> Register
        """
        repo_name = url.split("/")[-1].replace(".git", "")
        install_dir = Path(".claude/servers") / repo_name

        if install_dir.exists():
            logger.warning(f"⚠️ Server directory exists: {install_dir}")
        else:
            logger.info(f"⬇️ Cloning {url}...")
            subprocess.run(["git", "clone", url, str(install_dir)], check=True)

        # Detect project type
        if (install_dir / "package.json").exists():
            logger.info("📦 Detected Node.js project. Installing dependencies...")
            subprocess.run(["npm", "install"], cwd=install_dir, check=True)
            subprocess.run(["npm", "run", "build"], cwd=install_dir, check=False)  # Try build

            # Assume entry point is build/index.js or src/index.ts executed via node
            # This is heuristic and might need adjustment per repo
            main_file = install_dir / "build/index.js"
            if not main_file.exists():
                main_file = install_dir / "dist/index.js"

            if main_file.exists():
                cmd = "node"
                args = [str(main_file.absolute())]
            else:
                # Fallback to npx ts-node if source exists
                cmd = "npx"
                args = ["ts-node", str((install_dir / "src/index.ts").absolute())]

        elif (install_dir / "pyproject.toml").exists() or (
            install_dir / "requirements.txt"
        ).exists():
            logger.info("🐍 Detected Python project. Setting up venv...")
            subprocess.run([sys.executable, "-m", "venv", ".venv"], cwd=install_dir, check=True)

            pip_cmd = str(install_dir / ".venv/bin/pip")
            if (install_dir / "requirements.txt").exists():
                subprocess.run(
                    [pip_cmd, "install", "-r", "requirements.txt"], cwd=install_dir, check=True
                )
            if (install_dir / "pyproject.toml").exists():
                subprocess.run([pip_cmd, "install", "."], cwd=install_dir, check=True)

            # Assume entry point - needs heuristic or user input usually
            # For now, default to running the module if typical structure
            cmd = str(install_dir / ".venv/bin/python")
            args = ["main.py"]  # Placeholder

        else:
            logger.error("❌ Could not detect project type (Node/Python). Manual setup required.")
            return

        self.add_server(repo_name, MCPServerConfig(command=cmd, args=args))
        logger.info(f"✅ Installed {repo_name} from source.")


# Global instance
mcp_manager = MCPManager()
