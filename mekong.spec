# -*- mode: python ; coding: utf-8 -*-
# PyInstaller spec file for mekong-cli

from PyInstaller.utils.hooks import collect_submodules
import sys
import os

block_cipher = None

# Get the absolute path to the src directory
src_path = os.path.join(os.path.dirname(__file__), 'src')

a = Analysis(
    ['src/main.py'],
    pathex=[],
    binaries=[],
    datas=[
        (os.path.join(src_path, 'recipes'), 'recipes'),
        (os.path.join(src_path, 'cli'), 'cli'),
        (os.path.join(src_path, 'core'), 'core'),
        (os.path.join(src_path, 'agents'), 'agents'),
        (os.path.join(src_path, 'commands'), 'commands'),
        (os.path.join(src_path, 'raas'), 'raas'),
        (os.path.join(src_path, 'api'), 'api'),
        (os.path.join(src_path, 'binh_phap'), 'binh_phap'),
        (os.path.join(src_path, 'a2ui'), 'a2ui'),
        (os.path.join(src_path, 'components'), 'components'),
        (os.path.join(src_path, 'daemon'), 'daemon'),
    ],
    hiddenimports=[
        # Core CLI frameworks
        'typer',
        'rich',
        'rich.console',
        'rich.panel',
        'rich.table',
        'rich.tree',
        'rich.progress',
        'fastapi',
        'uvicorn',
        'uvicorn.loops',
        'uvicorn.protocols',
        'pydantic',
        'pydantic_settings',
        'pydantic.fields',
        'pydantic_core',

        # RaaS modules
        'src.lib.raas_gate_validator',
        'src.lib.raas_gate_utils',
        'src.core.telemetry_consent',
        'src.core.graceful_shutdown',
        'src.core.phase_completion_detector',

        # CLI commands
        'src.commands.license_commands',
        'src.commands.license_renewal',
        'src.commands.debug_rate_limits',
        'src.commands.compliance',
        'src.commands.telemetry_commands',
        'src.commands.dashboard_commands',
        'src.commands.config',
        'src.commands.clean',
        'src.commands.doctor',
        'src.commands.status',
        'src.commands.memory_commands',
        'src.commands.swarm_commands',
        'src.commands.schedule_commands',
        'src.commands.autonomous_commands',
        'src.commands.telegram_commands',
        'src.commands.env',
        'src.commands.build',
        'src.commands.ci',
        'src.commands.deploy',
        'src.commands.docs',
        'src.commands.test',
        'src.commands.test_advanced',
        'src.commands.security',
        'src.commands.agi',

        # Core modules
        'src.core.planner',
        'src.core.executor',
        'src.core.verifier',
        'src.core.orchestrator',
        'src.core.llm_client',
        'src.core.gateway',
        'src.core.telemetry',
        'src.core.memory',
        'src.core.agent_base',
        'src.core.agent_registry',
        'src.core.agent_execution_sandbox',
        'src.core.auto_updater',
        'src.core.cc_spawner',
        'src.core.config',
        'src.core.context_manager',
        'src.core.cost_tracker',
        'src.core.dag_scheduler',
        'src.core.durable_step_store',
        'src.core.exceptions',
        'src.core.gateway_dashboard',
        'src.core.hooks',
        'src.core.ipc_agent_message_bus',
        'src.core.learner',
        'src.core.parser',
        'src.core.plugin_loader',
        'src.core.protocols',
        'src.core.smart_router',
        'src.core.swarm',
        'src.core.task_queue',
        'src.core.telegram_agi',
        'src.core.telegram_bot',
        'src.core.telegram_models',
        'src.core.vector_memory_store',
        'src.core.webhook_delivery_engine',
        'src.core.workflow_state',
        'src.core.cross_session_intelligence',
        'src.core.legacy_bridge',
        'src.core.nlp_commander',
        'src.core.phase_completion_detector',
        'src.core.graceful_shutdown',
        'src.core.globals',

        # Agents
        'src.agents.git_agent',
        'src.agents.file_agent',
        'src.agents.shell_agent',
        'src.agents.lead_hunter',
        'src.agents.content_writer',
        'src.agents.recipe_crawler',
        'src.agents.network_agent',
        'src.agents.monitor_agent',
        'src.agents.workspace_agent',
        'src.agents.agi_bridge',

        # Database
        'sqlalchemy',
        'sqlalchemy.ext.asyncio',
        'psycopg2',
        'psycopg2.extensions',
        'asyncpg',

        # Auth & Security
        'python_jose',
        'python_jose.jose',
        'cryptography',
        'cryptography.fernet',
        'passlib',
        'passlib.hash',
        'passlib.context',
        'authlib',
        'authlib.integrations',
        'authlib.oauth2',

        # Networking
        'requests',
        'requests.adapters',
        'urllib3',
        'httpx',
        'websockets',

        # Async support
        'asyncio',
        'anyio',

        # Environment & Config
        'python_dotenv',
        'dotenv',

        # Logging
        'structlog',
        'structlog.stdlib',
        'structlog.processors',

        # Templates
        'jinja2',
        'jinja2.loaders',

        # System monitoring
        'psutil',

        # Metrics
        'prometheus_client',

        # Questionary for interactive prompts
        'questionary',

        # Email validation
        'email_validator',

        # JSON schema
        'jsonschema',

        # YAML support
        'yaml',
        'ruamel.yaml',

        # GitPython
        'git',
        'gitpython',

        # Packaging
        'packaging',
        'pkg_resources',

        # Encodings
        'charset_normalizer',
        'idna',
        'certifi',

        # Compression
        'gzip',
        'zlib',

        # SSL/TLS
        'ssl',
        'hashlib',
        'hmac',

        # Data processing
        'json',
        'csv',
        'xml',
        'html',

        # Multiprocessing
        'multiprocessing',
        'concurrent.futures',

        # Date/Time
        'datetime',
        'dateutil',
        'zoneinfo',
    ],
    runtime_hooks=[],
    excludes=[
        # Heavy scientific packages not needed
        'matplotlib',
        'scipy',
        'numpy',
        'pandas',
        'sklearn',
        'tensorflow',
        'torch',

        # Test packages
        'test_*',
        'pytest',
        'pyunit',
        'unittest',

        # Development tools
        'mypy',
        'black',
        'ruff',
        'flake8',
        'pylint',

        # Documentation
        'sphinx',
        'mkdocs',
    ],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    output_exe='dist/mekong',
    name='mekong',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=None,
)
