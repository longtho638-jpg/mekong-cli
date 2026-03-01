## Phase 3: Credential Vault

### Context
- Parent: [plan.md](plan.md)
- n8n pattern: AES-256 encrypted credential store, read-access vs exec-access decoupled
- Dependency: Independent

### Overview
- Date: 2026-03-01
- Priority: P2
- Description: Implement n8n-inspired credential vault for exchange API key management. Keys encrypted at rest using Node.js crypto (AES-256-GCM). Strategies never touch raw keys.
- Implementation status: pending
- Review status: pending

### Key Insights (from n8n)
- n8n encrypts all credentials at rest via single `N8N_ENCRYPTION_KEY`
- External secrets via Azure Key Vault / GCP Secret Manager supported
- Read-access and exec-access decoupled — nodes can USE credentials without SEEING them
- Per-credential schema: `{apiKey, secret, passphrase, testnet}`

### Requirements
- `CredentialVault` class with `store(exchangeId, creds)`, `get(exchangeId)`, `delete(exchangeId)`
- AES-256-GCM encryption using master key from env (`ARB_ENCRYPTION_KEY`)
- In-memory store (MVP) — no DB dependency
- `getClient(exchangeId)` returns configured exchange client without exposing raw keys
- Masking: `getInfo(exchangeId)` shows `api***key` format

### Architecture
```
.env: ARB_ENCRYPTION_KEY=<32-byte-hex>

CredentialVault
  ├─ store("binance", {apiKey, secret}) → encrypt → Map<string, EncryptedCred>
  ├─ get("binance") → decrypt → {apiKey, secret}
  ├─ getInfo("binance") → {id: "binance", masked: "sk3***f8a"}
  └─ delete("binance") → remove from store
```

### Related Code Files
- NEW: `packages/vibe-arbitrage-engine/credential-vault.ts`
- EDIT: `packages/vibe-arbitrage-engine/index.ts` (add export)

### Implementation Steps
1. Implement AES-256-GCM encrypt/decrypt helpers using `crypto` module
2. Create `CredentialVault` class with in-memory Map store
3. Add masking utility for safe display
4. Add `getClient()` that creates exchange adapter from decrypted creds
5. Export from index

### Todo
- [ ] AES-256-GCM encrypt/decrypt helpers
- [ ] CredentialVault class with store/get/delete
- [ ] Masking utility
- [ ] Export from index.ts

### Success Criteria
- Credentials encrypted in memory — raw keys not in plaintext Map
- Decryption only on-demand
- Works without master key (falls back to plaintext with warning)

### Risk Assessment
- MEDIUM: Crypto implementation — use Node.js native `crypto`, no custom crypto
- Master key must be in env, never hardcoded

### Security
- AES-256-GCM with random IV per encryption
- Master key from `ARB_ENCRYPTION_KEY` env var only
- Zero raw keys in logs or error messages

### Next Steps
- Phase 4: Metrics collector
