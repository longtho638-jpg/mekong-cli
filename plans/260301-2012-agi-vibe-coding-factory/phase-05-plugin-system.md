---
phase: 5
title: "Plugin System"
priority: P2
status: pending
effort: 4h
depends_on: [1]
---

# Phase 5: Plugin System

## Overview
Enable community agents, providers, and hooks via Python `entry_points` (setuptools) and local plugin directories. Users install plugins via `pip install mekong-plugin-X` or drop Python files into `~/.mekong/plugins/`.

## Key Insights (from research)
- Current agent registry is hardcoded dict (agents/__init__.py)
- Hooks pipeline exists (hooks.py) — already supports pre/post/error phases
- Entry points are stdlib-compatible (importlib.metadata, Python 3.9+)
- AgentRegistry from Phase 1 provides `register()` — plugins call this

## Requirements

### Functional
- F1: Auto-discover plugins via `entry_points(group="mekong.agents")` at startup
- F2: Auto-discover plugins via `entry_points(group="mekong.providers")` for LLM providers
- F3: Local plugin dir `~/.mekong/plugins/` — auto-import .py files
- F4: Hook plugins via `entry_points(group="mekong.hooks")` — pre/post execution
- F5: `mekong plugin list` — show installed plugins with source (entrypoint/local)
- F6: Plugin metadata: name, version, author, description

### Non-Functional
- NF1: Plugin load failure logs warning, doesn't crash CLI
- NF2: No circular imports — plugins loaded after core init
- NF3: Plugin load time < 100ms total (lazy import)

## Architecture

```python
# src/core/plugin_loader.py (NEW — ~90 lines)
import importlib.metadata
from pathlib import Path

class PluginLoader:
    def __init__(self, agent_registry, provider_list):
        self.agent_registry = agent_registry
        self.providers = provider_list
        self._loaded = []

    def discover_entrypoints(self):
        """Load plugins registered via setuptools entry_points."""
        for ep in importlib.metadata.entry_points().get("mekong.agents", []):
            try:
                agent_cls = ep.load()
                self.agent_registry.register(ep.name, agent_cls)
                self._loaded.append({"name": ep.name, "source": "entrypoint", "type": "agent"})
            except Exception as e:
                logger.warning(f"Plugin {ep.name} failed: {e}")

    def discover_local(self, plugin_dir: Path = None):
        """Load .py files from ~/.mekong/plugins/"""
        pdir = plugin_dir or Path.home() / ".mekong" / "plugins"
        if not pdir.exists():
            return
        for f in pdir.glob("*.py"):
            spec = importlib.util.spec_from_file_location(f.stem, f)
            mod = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(mod)
            # Convention: module must have register(registry) function
            if hasattr(mod, "register"):
                mod.register(self.agent_registry)
                self._loaded.append({"name": f.stem, "source": "local", "type": "agent"})

    def list_plugins(self) -> List[Dict]:
        return self._loaded
```

```toml
# Example community plugin's pyproject.toml
[project.entry-points."mekong.agents"]
docker = "mekong_docker_agent:DockerAgent"

[project.entry-points."mekong.providers"]
ollama = "mekong_ollama:OllamaProvider"
```

## Related Code Files

### Modify
- `src/agents/__init__.py` — call `PluginLoader.discover_entrypoints()` after built-in registration
- `src/core/llm_client.py` — provider discovery from entry_points
- `src/main.py` — add `mekong plugin list` command, trigger plugin load at startup

### Create
- `src/core/plugin_loader.py` — PluginLoader class
- `examples/plugins/hello_agent.py` — example local plugin

### Delete
- None

## Implementation Steps

1. Create `src/core/plugin_loader.py` with `PluginLoader` class
2. Implement `discover_entrypoints()` for `mekong.agents` and `mekong.providers` groups
3. Implement `discover_local()` scanning `~/.mekong/plugins/*.py` with `register(registry)` convention
4. Add `PluginLoader` initialization in `src/agents/__init__.py` — called after built-in agents registered
5. Add `mekong plugin list` command to `src/main.py`
6. Create `examples/plugins/hello_agent.py` — minimal agent that echoes input
7. Handle Python 3.9 vs 3.10+ `entry_points()` API difference (use `importlib.metadata`)
8. Write `tests/test_plugin_loader.py` — test entrypoint discovery, local plugin, failure handling
9. Run full test suite

## Success Criteria
- [ ] `pip install mekong-hello-agent` → agent auto-available via `mekong agent hello`
- [ ] `~/.mekong/plugins/my_agent.py` with `register()` → auto-loaded
- [ ] `mekong plugin list` shows all loaded plugins with source
- [ ] Bad plugin logs warning, doesn't crash CLI
- [ ] All existing tests pass

## Risk Assessment
- **Low**: Entry points are standard Python mechanism — well-tested
- **Medium**: Python 3.9 `importlib.metadata.entry_points()` returns dict, 3.10+ returns SelectableGroups — handle both
- **Mitigation**: Use `importlib.metadata.entry_points(group="mekong.agents")` which works on 3.9+ with fallback

## Todo
- [ ] Create plugin_loader.py
- [ ] Implement entrypoint discovery
- [ ] Implement local plugin discovery
- [ ] Add plugin list CLI command
- [ ] Create example plugin
- [ ] Handle Python 3.9 compat
- [ ] Write tests
