#!/usr/bin/env python3
"""
🤖 CC Agent CLI - Swarm Orchestration for AgencyOS
===================================================

Production-ready CLI for managing multi-agent swarms with robust error handling.

Commands:
- spawn <type> - Spawn agent (content/sales/support)
- status - Show all running agents
- kill <id> - Terminate specific agent
- swarm deploy <config.yaml> - Deploy agent swarm from config
- logs <id> - Stream agent logs

Usage:
    python scripts/cc_agent.py spawn content
    python scripts/cc_agent.py status
    python scripts/cc_agent.py swarm deploy config/swarm.yaml
    python scripts/cc_agent.py logs agent-001

Author: AgencyOS Team
License: MIT
"""

import argparse
import json
import logging
import os
import sys
import time
import uuid
from dataclasses import asdict, dataclass
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional

import yaml

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Constants
SWARM_STATE_DIR = Path.home() / ".agencyos" / "swarm"
SWARM_STATE_FILE = SWARM_STATE_DIR / "agents.json"
LOGS_DIR = SWARM_STATE_DIR / "logs"

# Ensure directories exist
SWARM_STATE_DIR.mkdir(parents=True, exist_ok=True)
LOGS_DIR.mkdir(parents=True, exist_ok=True)


class AgentType(Enum):
    """Supported agent types."""
    CONTENT = "content"
    SALES = "sales"
    SUPPORT = "support"
    DEVELOPER = "developer"
    MARKETER = "marketer"
    STRATEGIST = "strategist"

    @classmethod
    def from_string(cls, value: str) -> 'AgentType':
        """Convert string to AgentType with validation."""
        try:
            return cls(value.lower())
        except ValueError:
            valid_types = ', '.join([t.value for t in cls])
            raise ValueError(f"Invalid agent type '{value}'. Valid types: {valid_types}")


class AgentStatus(Enum):
    """Agent lifecycle states."""
    IDLE = "idle"
    RUNNING = "running"
    BUSY = "busy"
    PAUSED = "paused"
    STOPPED = "stopped"
    ERROR = "error"


@dataclass
class AgentInfo:
    """Agent information model."""
    id: str
    type: AgentType
    status: AgentStatus
    pid: Optional[int]
    spawned_at: str
    last_active: str
    tasks_completed: int = 0
    tasks_failed: int = 0
    current_task: Optional[str] = None
    metadata: Dict[str, Any] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        data = asdict(self)
        data['type'] = self.type.value
        data['status'] = self.status.value
        return data

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'AgentInfo':
        """Create from dictionary."""
        data['type'] = AgentType(data['type'])
        data['status'] = AgentStatus(data['status'])
        return cls(**data)


class SwarmStateManager:
    """Manages persistent swarm state."""

    def __init__(self, state_file: Path = SWARM_STATE_FILE):
        self.state_file = state_file
        self.agents: Dict[str, AgentInfo] = {}
        self._load_state()

    def _load_state(self) -> None:
        """Load swarm state from disk."""
        if not self.state_file.exists():
            logger.info("No existing swarm state found. Starting fresh.")
            return

        try:
            with open(self.state_file, 'r') as f:
                data = json.load(f)
                self.agents = {
                    agent_id: AgentInfo.from_dict(agent_data)
                    for agent_id, agent_data in data.get('agents', {}).items()
                }
            logger.info(f"Loaded {len(self.agents)} agents from state")
        except Exception as e:
            logger.error(f"Failed to load swarm state: {e}")
            logger.warning("Starting with empty state")
            self.agents = {}

    def _save_state(self) -> None:
        """Persist swarm state to disk."""
        try:
            data = {
                'agents': {
                    agent_id: agent.to_dict()
                    for agent_id, agent in self.agents.items()
                },
                'last_updated': datetime.now().isoformat()
            }

            # Atomic write
            temp_file = self.state_file.with_suffix('.tmp')
            with open(temp_file, 'w') as f:
                json.dump(data, f, indent=2)
            temp_file.replace(self.state_file)

            logger.debug(f"Saved state with {len(self.agents)} agents")
        except Exception as e:
            logger.error(f"Failed to save swarm state: {e}")
            raise

    def add_agent(self, agent: AgentInfo) -> None:
        """Add agent to state."""
        self.agents[agent.id] = agent
        self._save_state()

    def remove_agent(self, agent_id: str) -> Optional[AgentInfo]:
        """Remove agent from state."""
        agent = self.agents.pop(agent_id, None)
        if agent:
            self._save_state()
        return agent

    def update_agent(self, agent_id: str, **updates) -> Optional[AgentInfo]:
        """Update agent fields."""
        if agent_id not in self.agents:
            return None

        agent = self.agents[agent_id]
        for key, value in updates.items():
            if hasattr(agent, key):
                setattr(agent, key, value)

        agent.last_active = datetime.now().isoformat()
        self._save_state()
        return agent

    def get_agent(self, agent_id: str) -> Optional[AgentInfo]:
        """Get agent by ID."""
        return self.agents.get(agent_id)

    def list_agents(self, status: Optional[AgentStatus] = None) -> List[AgentInfo]:
        """List all agents, optionally filtered by status."""
        agents = list(self.agents.values())
        if status:
            agents = [a for a in agents if a.status == status]
        return agents


class AgentSpawner:
    """Handles agent spawning logic."""

    def __init__(self, state_manager: SwarmStateManager):
        self.state = state_manager

    def spawn(self, agent_type: AgentType, metadata: Optional[Dict[str, Any]] = None) -> AgentInfo:
        """Spawn a new agent."""
        agent_id = f"agent-{uuid.uuid4().hex[:8]}"

        logger.info(f"Spawning {agent_type.value} agent with ID: {agent_id}")

        # Create agent
        agent = AgentInfo(
            id=agent_id,
            type=agent_type,
            status=AgentStatus.IDLE,
            pid=os.getpid(),  # In production, this would be subprocess PID
            spawned_at=datetime.now().isoformat(),
            last_active=datetime.now().isoformat(),
            metadata=metadata or {}
        )

        # Register with state manager
        self.state.add_agent(agent)

        # Initialize log file
        log_file = LOGS_DIR / f"{agent_id}.log"
        with open(log_file, 'w') as f:
            f.write(f"[{datetime.now().isoformat()}] Agent spawned: {agent_type.value}\n")

        logger.info(f"✅ Agent {agent_id} spawned successfully")
        return agent


class AgentKiller:
    """Handles agent termination."""

    def __init__(self, state_manager: SwarmStateManager):
        self.state = state_manager

    def kill(self, agent_id: str, force: bool = False) -> bool:
        """Terminate an agent."""
        agent = self.state.get_agent(agent_id)

        if not agent:
            logger.error(f"Agent {agent_id} not found")
            return False

        logger.info(f"Terminating agent {agent_id} (type: {agent.type.value})")

        # Check if agent is busy
        if agent.status == AgentStatus.BUSY and not force:
            logger.warning(f"Agent {agent_id} is busy. Use --force to terminate anyway.")
            return False

        # Update status before removal
        self.state.update_agent(agent_id, status=AgentStatus.STOPPED)

        # Log termination
        log_file = LOGS_DIR / f"{agent_id}.log"
        if log_file.exists():
            with open(log_file, 'a') as f:
                f.write(f"[{datetime.now().isoformat()}] Agent terminated\n")

        # Remove from state
        self.state.remove_agent(agent_id)

        logger.info(f"✅ Agent {agent_id} terminated successfully")
        return True


class SwarmDeployer:
    """Deploys agent swarms from YAML config."""

    def __init__(self, state_manager: SwarmStateManager, spawner: AgentSpawner):
        self.state = state_manager
        self.spawner = spawner

    def deploy(self, config_file: Path) -> List[AgentInfo]:
        """Deploy swarm from configuration."""
        if not config_file.exists():
            raise FileNotFoundError(f"Config file not found: {config_file}")

        logger.info(f"Deploying swarm from config: {config_file}")

        # Load config
        try:
            with open(config_file, 'r') as f:
                config = yaml.safe_load(f)
        except Exception as e:
            raise ValueError(f"Invalid YAML config: {e}")

        # Validate config
        if 'agents' not in config:
            raise ValueError("Config must contain 'agents' key")

        deployed_agents = []

        # Deploy each agent
        for agent_config in config['agents']:
            try:
                agent_type = AgentType.from_string(agent_config['type'])
                count = agent_config.get('count', 1)
                metadata = agent_config.get('metadata', {})

                for i in range(count):
                    agent = self.spawner.spawn(agent_type, metadata)
                    deployed_agents.append(agent)

            except Exception as e:
                logger.error(f"Failed to deploy agent {agent_config.get('type')}: {e}")
                # Continue deploying other agents
                continue

        logger.info(f"✅ Deployed {len(deployed_agents)} agents")
        return deployed_agents


class LogStreamer:
    """Streams agent logs."""

    def __init__(self, state_manager: SwarmStateManager):
        self.state = state_manager

    def stream(self, agent_id: str, follow: bool = False) -> None:
        """Stream agent logs."""
        agent = self.state.get_agent(agent_id)

        if not agent:
            logger.error(f"Agent {agent_id} not found")
            sys.exit(1)

        log_file = LOGS_DIR / f"{agent_id}.log"

        if not log_file.exists():
            logger.warning(f"No log file found for agent {agent_id}")
            return

        # Read existing logs
        with open(log_file, 'r') as f:
            print(f.read(), end='')

        # Follow mode (tail -f style)
        if follow:
            logger.info(f"Following logs for {agent_id} (Ctrl+C to exit)")
            try:
                with open(log_file, 'r') as f:
                    f.seek(0, 2)  # Go to end of file
                    while True:
                        line = f.readline()
                        if line:
                            print(line, end='')
                        else:
                            time.sleep(0.1)
            except KeyboardInterrupt:
                logger.info("Stopped following logs")


class CCAgentCLI:
    """Main CLI interface."""

    def __init__(self):
        self.state = SwarmStateManager()
        self.spawner = AgentSpawner(self.state)
        self.killer = AgentKiller(self.state)
        self.deployer = SwarmDeployer(self.state, self.spawner)
        self.log_streamer = LogStreamer(self.state)

    def cmd_spawn(self, args) -> None:
        """Spawn a new agent."""
        try:
            agent_type = AgentType.from_string(args.type)
            metadata = json.loads(args.metadata) if args.metadata else None

            agent = self.spawner.spawn(agent_type, metadata)

            print(f"✅ Agent spawned successfully")
            print(f"   ID: {agent.id}")
            print(f"   Type: {agent.type.value}")
            print(f"   Status: {agent.status.value}")
            print(f"   PID: {agent.pid}")

        except ValueError as e:
            logger.error(str(e))
            sys.exit(1)
        except Exception as e:
            logger.error(f"Failed to spawn agent: {e}")
            sys.exit(1)

    def cmd_status(self, args) -> None:
        """Show agent status."""
        status_filter = AgentStatus(args.filter) if args.filter else None
        agents = self.state.list_agents(status=status_filter)

        if not agents:
            print("No agents running")
            return

        # Print table
        print(f"\n{'ID':<15} {'Type':<12} {'Status':<10} {'Tasks':<10} {'Last Active':<20}")
        print("-" * 75)

        for agent in sorted(agents, key=lambda a: a.spawned_at):
            tasks = f"{agent.tasks_completed}/{agent.tasks_failed}"
            print(f"{agent.id:<15} {agent.type.value:<12} {agent.status.value:<10} {tasks:<10} {agent.last_active[:19]:<20}")

        print(f"\nTotal agents: {len(agents)}")

    def cmd_kill(self, args) -> None:
        """Kill an agent."""
        success = self.killer.kill(args.agent_id, force=args.force)
        sys.exit(0 if success else 1)

    def cmd_swarm_deploy(self, args) -> None:
        """Deploy agent swarm from config."""
        try:
            config_file = Path(args.config)
            agents = self.deployer.deploy(config_file)

            print(f"✅ Swarm deployed successfully")
            print(f"   Agents: {len(agents)}")

            for agent in agents:
                print(f"   - {agent.id} ({agent.type.value})")

        except (FileNotFoundError, ValueError) as e:
            logger.error(str(e))
            sys.exit(1)
        except Exception as e:
            logger.error(f"Failed to deploy swarm: {e}")
            sys.exit(1)

    def cmd_logs(self, args) -> None:
        """Stream agent logs."""
        self.log_streamer.stream(args.agent_id, follow=args.follow)

    def run(self) -> None:
        """Run the CLI."""
        parser = argparse.ArgumentParser(
            description="CC Agent CLI - Swarm Orchestration",
            formatter_class=argparse.RawDescriptionHelpFormatter,
            epilog="""
Examples:
  %(prog)s spawn content
  %(prog)s spawn sales --metadata '{"campaign": "Q1"}'
  %(prog)s status
  %(prog)s status --filter running
  %(prog)s kill agent-abc123
  %(prog)s swarm deploy config/swarm.yaml
  %(prog)s logs agent-abc123 --follow
            """
        )

        subparsers = parser.add_subparsers(dest='command', help='Commands')

        # Spawn command
        spawn_parser = subparsers.add_parser('spawn', help='Spawn a new agent')
        spawn_parser.add_argument('type', help='Agent type (content/sales/support)')
        spawn_parser.add_argument('--metadata', help='Agent metadata as JSON')
        spawn_parser.set_defaults(func=self.cmd_spawn)

        # Status command
        status_parser = subparsers.add_parser('status', help='Show agent status')
        status_parser.add_argument('--filter', choices=[s.value for s in AgentStatus], help='Filter by status')
        status_parser.set_defaults(func=self.cmd_status)

        # Kill command
        kill_parser = subparsers.add_parser('kill', help='Terminate an agent')
        kill_parser.add_argument('agent_id', help='Agent ID to terminate')
        kill_parser.add_argument('--force', action='store_true', help='Force kill even if busy')
        kill_parser.set_defaults(func=self.cmd_kill)

        # Swarm command
        swarm_parser = subparsers.add_parser('swarm', help='Swarm operations')
        swarm_subparsers = swarm_parser.add_subparsers(dest='swarm_command')

        deploy_parser = swarm_subparsers.add_parser('deploy', help='Deploy swarm from config')
        deploy_parser.add_argument('config', help='Path to YAML config file')
        deploy_parser.set_defaults(func=self.cmd_swarm_deploy)

        # Logs command
        logs_parser = subparsers.add_parser('logs', help='Stream agent logs')
        logs_parser.add_argument('agent_id', help='Agent ID')
        logs_parser.add_argument('-f', '--follow', action='store_true', help='Follow log output')
        logs_parser.set_defaults(func=self.cmd_logs)

        # Parse args
        args = parser.parse_args()

        if not args.command:
            parser.print_help()
            sys.exit(1)

        # Execute command
        try:
            args.func(args)
        except Exception as e:
            logger.error(f"Command failed: {e}")
            sys.exit(1)


def main():
    """Entry point."""
    cli = CCAgentCLI()
    cli.run()


if __name__ == "__main__":
    main()
