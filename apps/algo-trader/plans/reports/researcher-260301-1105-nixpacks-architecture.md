# Nixpacks Architecture & Build System Research

**Date:** 2026-03-01 | **Researcher:** system | **Focus:** Railway/Nixpacks build architecture

---

## Executive Summary

Nixpacks (Railway) is a zero-config container builder using Nix packages + Docker. 3-phase architecture: **Detect → Plan → Build**. Trait-based provider plugin system in Rust. Multi-stage builds for minimal images. Config priority: Provider < File < Env < CLI.

---

## 1. Auto-Detection System

**Input Detection Layer:**
- Scans source repo for language signatures: `package.json` (Node), `Cargo.toml` (Rust), `requirements.txt` (Python), etc.
- Matches files to provider registry
- Abstracts complexity of explicit build instructions

**Detection → Provider Matching:**
- Each provider registered in `nixpacks::providers` trait system
- Provider detects if applicable via `detect()` method
- Multiple providers can match single repo (uses priority ordering)

---

## 2. Build Plan Architecture (3-Phase Pipeline)

**Phase 1: Detect**
- Analyze source → determine language/framework
- Collect detection metadata per provider

**Phase 2: Plan**
- Providers generate `BuildPlan` objects (serialized in `nixpacks.toml`)
- Plan contains structured phases: `setup`, `install`, `build`, `start`
- Each phase specifies commands + dependencies + packages

**Phase 3: Build**
- Multi-stage Docker build (reduce final image size)
- Stage 1: Install all build tools + dependencies
- Stage 2: Runtime-only files + dependencies

**Phase Structure:**
```
setup     → Install Nix/Apt packages, prepare environment
install   → Run install commands (npm install, pip install, cargo build)
build     → Compile/build application
start     → Runtime entry point command
```

---

## 3. Provider/Plugin System

**Architecture:**
- Trait-based: `Provider` trait with required methods:
  - `name()` → provider identifier
  - `get_build_plan()` → returns BuildPlan object
  - `detect()→ bool` → language detection
  - `metadata()` → provider version/info

**Per-Provider Definition:**
- Detection rules (file signatures)
- Install commands (package manager specific)
- Build commands (compile/bundle)
- Start commands (runtime entry)
- System packages (Nix packages)

**Extensibility:**
- New providers added as Rust modules
- Minimal Nix/Docker knowledge required
- Each provider is isolated plugin

---

## 4. Nix Environment & Isolation

**Nix Package Resolution:**
- Nixpacks specifies list of Nix packages + Apt packages
- Based on detected app type
- Fetched from Nix ecosystem for reproducible builds

**Environment Isolation:**
- Nix provides hermetic environment (dependencies locked)
- System packages isolated from host
- Deterministic builds (same inputs → same output)

**Multi-Stage Docker:**
- Stage 1 (build): full toolchain + dev dependencies
- Stage 2 (runtime): minimal runtime dependencies only
- Reduces final image size significantly

---

## 5. Configuration System

**Configuration File (`nixpacks.toml` / `nixpacks.json`):**
- Contains full serialized BuildPlan
- Every build aspect customizable
- Priority hierarchy enforced

**Priority Order (Low → High):**
```
Provider (auto-detect) < File (nixpacks.toml) < Environment (NIXPACKS_*) < CLI args
```

**Array Extension with "...":**
- `nixPkgs = ['...', 'cowsay']` → extend auto-detected packages
- Omit `'...'` to override completely
- Same for commands in build phases

**Provider-Specific Env Vars:**
- `NIXPACKS_NODE_VERSION` (Node.js version override)
- `NIXPACKS_PYTHON_VERSION` (Python version)
- Similar for each language provider

**Custom Phases:**
- Can add unlimited custom phases
- Phase dependency resolution automatic
- Command overrides: `[phases.build] cmds = ["cmd1", "...", "cmdN"]`

---

## 6. Railway Integration

**Zero-Config Deployment:**
- Connect git branch → automatic builds on push
- Nixpacks analyzes source → installs deps → builds OCI image
- Deployable anywhere (OCI-compliant)

**Build Output:**
- PrintedBuildPlan at start of logs (human-readable)
- BuildPlan + Dockerfile auto-generated
- Multi-stage execution with phase ordering

**Alternative to Buildpacks:**
- Solves Buildpack shortcomings from Railway's experience
- System + language deps from Nix (not NPM/pip/etc)
- Smaller, more reproducible images

---

## Key Insights

1. **Serialization Trick:** BuildPlan serialization → `nixpacks.toml` = full customization without maintaining separate config objects
2. **Composition Over Inheritance:** Trait-based providers enable plugin system without tight coupling
3. **Priority Cascade:** Environment vars + CLI args allow deployment-time config without committing changes
4. **Determinism:** Nix packages locked → reproducible builds across environments
5. **Extensibility:** New language support = add Provider trait implementation (not modify core)

---

## Unresolved Questions

1. How are provider priorities determined when multiple match (e.g., monorepo with package.json + Cargo.toml)?
2. Phase dependency resolution algorithm — topological sort or custom ordering?
3. Nix version pinning strategy — how are Nix package versions maintained across builds?
4. Performance optimization — incremental layer caching in multi-stage Docker builds?

---

## Sources

- [Nixpacks How It Works](https://nixpacks.com/docs/how-it-works)
- [Provider Trait Documentation](https://docs.rs/nixpacks/latest/nixpacks/providers/trait.Provider.html)
- [Nixpacks Configuration File Reference](https://nixpacks.com/docs/configuration/file)
- [Railway Nixpacks Integration](https://docs.railway.com/reference/nixpacks)
- [Nixpacks Environment Configuration](https://nixpacks.com/docs/configuration/environment)
