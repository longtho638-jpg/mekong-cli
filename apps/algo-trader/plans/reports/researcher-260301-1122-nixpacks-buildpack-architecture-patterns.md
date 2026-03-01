# Nixpacks/Railway Buildpack Architecture Patterns for Algo-Trading

**Research Date:** 260301 | **Token Focus:** Concise patterns only

---

## 1. AUTO-DETECTION PATTERN (Language/Strategy Type)

**Nixpacks:** Sequential file-matcher registry
```
FOR each Provider in [Rust, Node, Python, Go, ...]:
  IF Provider.detectFiles(repo) matches THEN
    SELECT Provider → BREAK
```

**For Algo-Trading:** Strategy auto-detect by config marker
```
FOR each StrategyProvider in [RsiSmaProvider, ArbProvider, AgiProvider, ...]:
  IF config.strategyType in Provider.strategyTypes THEN
    SELECT Provider → BUILD PLAN
```

**Key:** Detection order = priority. Fast-fail on first match.

---

## 2. PROVIDER REGISTRY PATTERN (Pluggable Strategies)

**Nixpacks:** Registry trait + impl per language
```
trait Provider {
  detect(path) → bool
  buildPlan() → Plan { setup, install, build, start }
  commands() → { setup, install, build, start }
}
```

**For Algo-Trading:** Strategy provider pattern
```
trait StrategyProvider {
  detect(config) → bool
  phases() → ExecutionPlan { init, backtest, validate, deploy }
  commands() → { init_cmd, backtest_cmd, validate_cmd, deploy_cmd }
}
```

**Impl:** RsiSmaProvider, ArbProvider, AgiProvider register in StrategyRegistry.

---

## 3. PHASE SYSTEM (Build Lifecycle)

**Nixpacks:** 4 standard + custom phases w/ dependencies
- `setup` — Install system packages (nixPkgs, aptPkgs)
- `install` — Language deps (npm install, cargo fetch)
- `build` — Compile + artifact generation
- `start` — Runtime command

**Phases depend on each other:** `build` depends-on `install` depends-on `setup`.

**For Algo-Trading:** Trading execution phases
```
1. init      — Load config, validate exchange keys, warm cache
2. backtest  — Historical data fetch, strategy run, metrics calc
3. validate  — Risk checks, capital allocation, dry-run
4. deploy    — Live trading enabled, position tracking
5. monitor   — Real-time P&L, alerts, rebalance checks
```

**Dependencies:** `validate` → `backtest` → `init`, `deploy` → `validate`.

---

## 4. BUILD PLAN GENERATION (Config Cascade)

**Nixpacks:** 3-tier cascade resolve config
```
Priority (highest wins):
  1. nixpacks.toml (explicit)
  2. Environment vars (NIXPACKS_*)
  3. Auto-detect (file-based)
```

Example `nixpacks.toml`:
```toml
[providers]
providers = [...] # Override auto-detect

[phases.custom]
cmds = [...]
dependsOn = ["build"]
```

**For Algo-Trading:** Trading config cascade
```
Priority:
  1. .algo-trader.toml (explicit strategy + params)
  2. Env vars (STRATEGY_TYPE, RISK_LEVEL, etc.)
  3. Auto-detect (infer from TRADING_PAIR + exchange)
```

Example `.algo-trader.toml`:
```toml
[strategy]
type = "arb:agi"  # or "rsi:sma", "cross-exchange-arb"
backtest_enabled = true

[risk]
max_daily_loss = 100
kelly_fraction = 0.25
```

---

## 5. PHASE EXECUTOR PATTERN (Atomic Execution)

**Nixpacks:** Dockerfile generation from phases
- Each phase = isolated RUN command
- Dependencies resolved → topological sort
- Rollback: skip failed phase's dependents

**For Algo-Trading:** Executor runs phases atomically
```
PLAN = StrategyProvider.plan(config)
FOR phase in topological_sort(PLAN.phases):
  result = executor.run(phase)
  IF result.failed THEN
    IF phase.critical THEN rollback() ELSE continue
```

**Critical phases:** `backtest` (fail = skip deploy), `validate` (fail = halt).

---

## 6. CONFIGURATION PRIORITY RESOLUTION

**Nixpacks:** Explicit > Env > Auto
- `nixpacks.toml` key overrides env var
- Env var `NIXPACKS_PACKAGES_APT=curl` → `aptPkgs = ["curl"]`
- Auto-detect fills gaps only

**For Algo-Trading:** Strategy config resolution
```
config = {}
# 1. Load defaults
config.merge(STRATEGY_DEFAULTS[strategy_type])
# 2. Merge .algo-trader.toml
config.merge(load_toml(".algo-trader.toml"))
# 3. Override with env vars
config.merge(load_env("ALGO_TRADER_*"))
# 4. CLI args override all
config.merge(parse_cli_args())
```

**Result:** CLI arg > env > toml > defaults

---

## 7. PROVIDER DETECTION ORDER (Specificity Ranking)

**Nixpacks:** Order based on popularity + file uniqueness
1. Node.js (package.json) — most common
2. Rust (Cargo.toml) — explicit, low collision
3. Python (requirements.txt) — common but ambiguous
4. Go (go.mod) — explicit
5. Ruby, PHP, ... — fallback

**For Algo-Trading:** Strategy specificity ranking
```
1. Explicit config (lowest ambiguity) → "arb:agi" type
2. High-info marker → "AGI_ARBITRAGE=1" env var
3. File heuristics → backtest-results.json exists?
4. Pair patterns → "BTC/USDT" + "cross-exchange" → arb
5. Fallback → RsiSmaStrategy (safest)
```

**Key:** More specific matches = higher priority.

---

## 8. LAZY BUILD PLAN GENERATION (On-Demand)

**Nixpacks:** Plan generated at build-time, not detection-time
- Detect phase = fast (file scan only)
- Plan generation = lazy (when build starts)
- Allows dynamic config resolution via env vars

**For Algo-Trading:** Generate trading plan on-demand
```
strategy = detect_strategy(config)
# Detect = fast (100ms)

plan = strategy.generate_plan(config, market_data)
# Plan generation = lazy (only when execute_backtest called)
# Uses live orderbooks + volatility for realistic params
```

---

## MAPPING SUMMARY: Buildpack → Algo-Trading

| Concept | Nixpacks | Algo-Trading Mapping |
|---------|----------|----------------------|
| **Providers** | Node/Rust/Python langs | RsiSma/Arb/Agi strategies |
| **Detection** | File markers (package.json) | Config markers (strategyType) |
| **Phases** | setup→install→build→start | init→backtest→validate→deploy→monitor |
| **Plan** | Dockerfile ops | Trading execution steps |
| **Config** | nixpacks.toml | .algo-trader.toml |
| **Cascade** | toml > env > auto | toml > env > auto |
| **Executor** | Docker builder | StrategyExecutor (atomic phases) |

---

## UNRESOLVED QUESTIONS

1. How to handle phase failures in trading? Partial rollback vs full circuit break?
2. Should backtest results influence deploy decision (auto-gates)?
3. Multi-strategy composition — detect & run multiple providers sequentially?

---

**Sources:**
- [Nixpacks How It Works](https://nixpacks.com/docs/how-it-works)
- [Nixpacks Configuration File Reference](https://nixpacks.com/docs/configuration/file)
- [Cloud Native Buildpacks Detection](https://buildpacks.io/docs/for-buildpack-authors/tutorials/basic-buildpack/03_detection/)
- [Cloud Foundry Buildpack Detection](https://docs.huihoo.com/cloudfoundry/documentation/buildpacks/detection.html)
- [Nixpacks Configuring Builds](https://nixpacks.com/docs/guides/configuring-builds)
