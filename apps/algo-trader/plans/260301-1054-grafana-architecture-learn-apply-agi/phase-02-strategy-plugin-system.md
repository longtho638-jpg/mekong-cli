## Phase 2: Strategy Plugin System

### Context Links
- Parent: [plan.md](plan.md)
- Depends on: [Phase 1](phase-01-trading-frame-data-abstraction.md)
- Inspiration: Grafana plugin system — datasource/panel/app types, npm-packaged, dynamic discovery

### Overview
- **Date:** 2026-03-01
- **Priority:** P1
- **Description:** Convert strategy loading from hardcoded StrategyLoader.load() switch-case into discoverable plugin system. Strategies self-register with metadata (type, pairs, timeframes, risk profile).
- **Implementation status:** pending
- **Review status:** pending
- **Effort:** 3h

### Key Insights (from Grafana)
- Grafana plugins: npm packages with `plugin.json` manifest (id, type, dependencies)
- Discovery: scan `data/plugins/` dir, read manifest, register in plugin registry
- 3 types: datasource, panel, app → **Trading:** signal, indicator, execution
- Backend plugins communicate via gRPC → **Trading:** strategy interface contract
- No hot-reload (restart required) → same for trading (safety: don't swap strategy mid-trade)

### Requirements
- Strategy plugins self-describe via metadata (name, version, supported pairs, risk level)
- Plugin registry: discover, validate, load strategies from `src/strategies/`
- StrategyLoader remains backward-compatible but delegates to registry
- CLI `list-strategies` command shows all discovered plugins with metadata

### Architecture
```
StrategyPlugin {
  id: string                // "rsi-sma", "cross-exchange-arb"
  name: string              // Human-readable
  version: string           // semver
  type: 'signal' | 'indicator' | 'execution'
  supportedPairs: string[]  // ["BTC/USDT", "*"]
  timeframes: string[]      // ["1m", "5m", "1h"]
  riskLevel: 'low' | 'medium' | 'high'
  create(): IStrategy       // Factory function
}

StrategyRegistry {
  register(plugin: StrategyPlugin): void
  discover(dir: string): StrategyPlugin[]
  get(id: string): StrategyPlugin | undefined
  list(filter?): StrategyPlugin[]
}
```

### Related Code Files
- `src/core/StrategyLoader.ts` — current hardcoded switch-case loader
- `src/strategies/*.ts` — all strategy implementations
- `src/strategies/BaseStrategy.ts` — base class
- **New:** `src/core/strategy-plugin-registry.ts`
- **New:** `src/core/strategy-plugin-registry.test.ts`

### Implementation Steps
1. Define `StrategyPlugin` interface in `src/core/strategy-plugin-registry.ts`
2. Implement `StrategyRegistry` class with register/discover/get/list methods
3. Add static `pluginMeta` to each existing strategy (RsiSma, RsiCrossover, Bollinger, etc.)
4. Refactor `StrategyLoader.load()` to use registry (fallback to switch-case for compat)
5. Add CLI command `list-strategies` showing all plugins with metadata table
6. Write unit tests: registration, discovery, filtering by type/pair

### Todo
- [ ] Define StrategyPlugin interface
- [ ] Implement StrategyRegistry
- [ ] Add pluginMeta to existing strategies (6 strategies)
- [ ] Refactor StrategyLoader to use registry
- [ ] CLI `list-strategies` command
- [ ] Unit tests (≥6 tests)

### Success Criteria
- All existing strategies load correctly via registry
- `list-strategies` outputs formatted table with metadata
- StrategyLoader backward-compatible (existing CLI commands work)
- New strategy added by creating class + adding pluginMeta (no loader edit needed)

### Risk Assessment
- **Medium:** Touching StrategyLoader could break existing CLI commands
- **Mitigation:** Registry wraps existing loader, fallback to switch-case

### Security Considerations
- Plugin discovery limited to `src/strategies/` (no arbitrary code loading)
- No eval() or dynamic import from user input

### Next Steps
- Phase 3 alert engine uses registry to find strategy-specific alert rules
