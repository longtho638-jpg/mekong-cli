# Phase 2 — AGI Trading System

## Architecture

```
src/arbitrage/phase2/
├── zero-shot-synthesizer/     # LLM-driven strategy generation
│   ├── llm-client.ts          # MockLLMClient + HttpLLMClient
│   ├── rule-generator.ts      # Sentiment → validation → approval
│   ├── hot-deployer.ts        # Hot-swap rule deployment
│   └── index.ts               # ZeroShotSynthesizer orchestrator
├── cross-chain-flash-loans/   # DEX + bridge + flash loan routing
│   ├── dex-node.ts            # DexNode/BridgeEdge/DexRegistry
│   ├── flash-loan-provider.ts # Aave/dYdX/Port Finance
│   ├── smart-order-router.ts  # CEX→DEX→Flash Loan path finder
│   └── index.ts               # CrossChainFlashLoanEngine
├── adversarial-mm/            # Spoofing/manipulation detection
│   ├── spoof-detector.ts      # Pattern-based spoof/iceberg/layering
│   ├── strategy-hook.ts       # Arb decision: proceed/avoid/fade
│   ├── model-loader.ts        # ONNX model with heuristic fallback
│   └── index.ts               # Barrel exports
├── phase2-orchestrator.ts     # Unified activation + WS metrics
└── index.ts                   # Barrel exports
```

## Configuration

All modules controlled via `config.phase2.json` at project root:

```json
{
  "zeroShotSynthesizer": { "enabled": true, "pollIntervalMs": 30000 },
  "crossChainFlashLoans": { "enabled": true, "minNetProfitUsd": 10 },
  "adversarialMM": { "enabled": true, "modelPath": "./models/spoof-detector.onnx" }
}
```

Each module can be enabled/disabled independently. Disabled modules fall back to Phase 1 behavior.

## Module 1: Zero-Shot Strategy Synthesizer

**Pipeline:** Social messages → sentiment analysis → LLM rule generation → Sharpe backtest → hot-deploy

- **LLM:** MockLLMClient (dev) or HttpLLMClient (OpenAI-compatible, PRO-gated)
- **Validation:** Rules must achieve Sharpe ≥ 1.5 on 24h sliding window
- **Hot-swap:** Rules deployed/replaced without engine restart
- **Events:** `rules:deployed`, `cycle:complete`, `error`

## Module 2: Cross-Chain Flash Loans

**Route types:** CEX-only, CEX→DEX, Flash Loan amplified (10x, PRO-gated)

- **DEX support:** Uniswap V3, Curve, Raydium, Orca, PancakeSwap
- **Bridges:** Wormhole, Axelar, Stargate
- **Flash Loans:** Aave V3 (0.09%), dYdX (0%), Port Finance (Solana)
- **Filters:** minNetProfitUsd ≥ $10, maxHops ≤ 5

## Module 3: Adversarial Market Making

**Detection:** Spoofing (cancel ratio), Iceberg (refill pattern), Layering (volume asymmetry)

- **Model:** ONNX via onnxruntime-node (optional), heuristic fallback automatic
- **Decisions:** `proceed` (clean) → `avoid` (conf ≥ 0.7) → `fade` (conf ≥ 0.9)
- **Integration:** Hooks into arb engine decision pipeline

## WebSocket Messages

| Type | Payload |
|------|---------|
| `phase2:status` | Full Phase2Status object |
| `phase2:spoof_signal` | `{ exchange, symbol, confidence, signalType }` |
| `phase2:rules_deployed` | `{ count, names }` |
| `phase2:routes_found` | `{ count, bestProfitUsd }` |

## Dashboard

Navigate to `/phase2` in the NextJS dashboard for:
- Module status cards (enabled/disabled, key metrics)
- Real-time spoof detection alerts
- Flash loan route profitability

## Testing

```bash
# Run all Phase 2 tests
npx jest tests/arbitrage/phase2/ --verbose

# Individual modules
npx jest tests/arbitrage/phase2/zero-shot-synthesizer.test.ts
npx jest tests/arbitrage/phase2/cross-chain-flash-loans.test.ts
npx jest tests/arbitrage/phase2/adversarial-mm.test.ts
npx jest tests/arbitrage/phase2/model-loader.test.ts
npx jest tests/arbitrage/phase2/phase2-orchestrator.test.ts
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ONNX_MODEL_PATH` | No | Override default ONNX model path |
| `LLM_ENDPOINT` | No | OpenAI-compatible LLM endpoint |
| `LLM_API_KEY` | No | API key for LLM endpoint |
| `ETH_RPC_URL` | No | Ethereum RPC for flash loans |
| `SOL_RPC_URL` | No | Solana RPC for flash loans |

## PRO License Gates

- HttpLLMClient (real LLM) → PRO required
- Flash Loan 10x amplification → PRO required
- Graph arbitrage > 2 hops → PRO required
- All gated features gracefully fall back to FREE tier behavior
