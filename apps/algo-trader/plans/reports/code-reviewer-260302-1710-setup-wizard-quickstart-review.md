# Code Review — Setup Wizard & Quickstart Commands

**Date:** 2026-03-02
**Reviewer:** code-reviewer agent
**Plan:** none (ad-hoc review)

---

## Code Review Summary

### Scope
- Files reviewed: 2
  - `/Users/macbookprom1/mekong-cli/apps/algo-trader/src/cli/setup-wizard-command.ts` (187 lines)
  - `/Users/macbookprom1/mekong-cli/apps/algo-trader/src/cli/quickstart-zero-config-command.ts` (143 lines)
- Lines of code analyzed: 330
- Review focus: New files — security, error handling, code quality, TypeScript

### Overall Assessment

Both files are functional and fulfill their stated purpose. setup-wizard-command.ts is well-structured; quickstart-zero-config-command.ts has one high-severity architectural issue (subprocess delegation) and several medium-severity concerns. No `any` types found. TypeScript strict mode passes (no compiler errors detected for these files).

---

## Critical Issues

None. No API key exposure to logs/stdout, no injection vulnerabilities found.

---

## High Priority Findings

### H1 — `execSync('npx ts-node src/index.ts setup', ...)` — Hardcoded subprocess call
**File:** `quickstart-zero-config-command.ts` line 80–84
**Severity:** HIGH

Spawning a full `npx ts-node` subprocess to invoke `setup` from `quickstart` when both are already loaded in the same process is an architectural anti-pattern. It:
- Doubles startup cost (ts-node compiles twice)
- Breaks in environments where `npx` is unavailable or `ts-node` not installed as dev dep
- Fails silently in CI/non-TTY environments (readline in setup wizard requires stdin)
- Uses `require('child_process')` at runtime instead of a static import — violates codebase import conventions

**Fix:** Import and call `runSetupWizard` directly:
```typescript
// Export runSetupWizard from setup-wizard-command.ts
export async function runSetupWizard(): Promise<void> { ... }

// In quickstart-zero-config-command.ts
import { runSetupWizard } from './setup-wizard-command';
// ...
await runSetupWizard();
```

### H2 — `readline.Interface` not closed on Ctrl+C (SIGINT)
**File:** `setup-wizard-command.ts` lines 96–113
**Severity:** HIGH

If user presses Ctrl+C mid-wizard, the readline interface is never closed — the process hangs indefinitely waiting for input. There is no `rl.on('close', ...)` or SIGINT handler inside the wizard.

**Fix:**
```typescript
process.once('SIGINT', () => {
  console.log('\nSetup cancelled.');
  rl.close();
  process.exit(0);
});
```
Register before any `await ask(...)` call, and remove the handler after `rl.close()`.

### H3 — `GRAFANA_PASSWORD=admin` hardcoded in generated `.env`
**File:** `setup-wizard-command.ts` line 83
**Severity:** HIGH

Writing `GRAFANA_PASSWORD=admin` into every generated `.env` is a security anti-pattern. Users who follow quick-start docs and deploy without changing this value will have Grafana exposed with default credentials. Per code-standards: "No secrets in client code."

**Fix:** Either:
1. Skip the line entirely (let Grafana use its own default management), or
2. Generate a random password: `crypto.randomBytes(16).toString('hex')`

---

## Medium Priority Improvements

### M1 — `ENV_PATH` defined twice — DRY violation
**Files:** `setup-wizard-command.ts:12`, `quickstart-zero-config-command.ts:18`
Both files independently define:
```typescript
const ENV_PATH = path.resolve(process.cwd(), '.env');
```
This should live in `src/utils/config.ts` or a dedicated `src/cli/cli-constants.ts` and be imported. A future path change requires updates in two places.

### M2 — `hasValidEnv()` heuristic is unreliable
**File:** `quickstart-zero-config-command.ts` lines 20–25
```typescript
return content.length > 50;
```
The comment-only header from `buildEnvContent` is already 139 characters. Any `.env` file with just comments passes this check. A corrupted/empty-after-comment file would falsely report as valid.

**Fix:** Check for at least one meaningful `KEY=value` line:
```typescript
return /^\w+=.+/m.test(content);
```

### M3 — `getConfiguredExchanges()` reads `.env` file twice (duplicated I/O)
**File:** `quickstart-zero-config-command.ts` lines 27–37
`hasValidEnv()` reads the file, then `getConfiguredExchanges()` reads it again. Both are called sequentially in the action handler. Minor but wasteful for a sync file read.

**Fix:** Pass `content` as parameter or combine into one read.

### M4 — Empty secret accepted after valid API key
**File:** `setup-wizard-command.ts` lines 131–132
```typescript
const secret = await ask(rl, `  ${label} Secret: `);
exchanges.push({ id, apiKey: apiKey.trim(), secret: secret.trim() });
```
If the user enters a valid API key but presses Enter for the secret (empty string), the exchange is still added with `secret: ''`. Empty secrets will cause runtime failures when actual exchange calls are made.

**Fix:** Validate `secret.trim().length >= 10` before pushing, same as API key validation.

### M5 — `console.log` usage violates project code standards
**Files:** Both files — 22 occurrences in setup-wizard, 20 in quickstart
The `docs/code-standards.md` enforcement status explicitly states `✅ 0 console.log — production-ready code`. The logger (`winston`) is already imported in both files.

These are intentional UI outputs (banners, progress), not debug logs — which is a legitimate exception for CLI wizard UX. However, the project standard forbids `console.log` categorically. Consider using `process.stdout.write()` for banner/UI output, or document an exception in code-standards for CLI interactive output.

### M6 — `require('child_process')` dynamic import breaks TypeScript conventions
**File:** `quickstart-zero-config-command.ts` line 80
```typescript
const { execSync } = require('child_process');
```
With `strict: true` and ES2022 target, this produces an implicitly-typed `any` through CommonJS `require`. Should use a static `import { execSync } from 'child_process'` at the top of the file. Moot if H1 is fixed (call removed entirely).

---

## Low Priority Suggestions

### L1 — Box-drawing alignment in backtest results table is off
**File:** `quickstart-zero-config-command.ts` lines 52–56
The padded values with `padStart(10)` inside a fixed-width box will misalign when numbers are longer than expected (e.g., `-999.99%` return). The trailing `│` position will shift.

### L2 — Trading pair validation missing
**File:** `setup-wizard-command.ts` line 143
User-entered trading pair (e.g., `"BTC/USDT"`) is written to `.env` with no format validation. Invalid values like `"btcusdt"`, `"BTC-USDT"`, or `""` (handled via default) could cause downstream parse errors.

### L3 — `exchangeList` is hardcoded to 3 exchanges
**File:** `setup-wizard-command.ts` line 117
```typescript
const exchangeList = ['binance', 'okx', 'bybit'];
```
The regex in `getConfiguredExchanges()` in quickstart also hardcodes these 3. If a 4th exchange is added to the system, it must be updated in 3+ places. Move to a shared constant.

### L4 — File does not handle non-interactive stdin (`process.stdin.isTTY === false`)
**File:** `setup-wizard-command.ts` lines 96–99
When run in a pipe or CI environment where stdin is not a TTY, `readline.question()` will never resolve. The wizard will hang silently.

**Fix:** Guard at wizard entry:
```typescript
if (!process.stdin.isTTY) {
  logger.error('Setup wizard requires an interactive terminal. Use --env-file flag or set env vars manually.');
  process.exit(1);
}
```

---

## Positive Observations

- No `any` types — both files are properly typed
- Good use of `error instanceof Error ? error.message : String(error)` pattern (consistent with codebase)
- `runSetupWizard` correctly calls `rl.close()` in both exit paths (cancel + success)
- API key length check (`< 10`) is a sensible sanity guard
- Regex in `getConfiguredExchanges()` correctly excludes placeholder values (`(?!your_)`) — solid defensive pattern
- `buildEnvContent` is a pure function with clear single responsibility
- `ENABLE_LIVE_TRADING=false` default is excellent — safe-by-default for new users
- Legacy `EXCHANGE_ID/EXCHANGE_API_KEY` backward-compat block is explicitly commented
- Both files are under 200-line limit

---

## Recommended Actions

Priority order:

1. **[HIGH]** Fix H1 — replace `execSync('npx ts-node src/index.ts setup')` with direct function import/call
2. **[HIGH]** Fix H2 — add SIGINT handler to close readline and exit cleanly
3. **[HIGH]** Fix H3 — remove or randomize `GRAFANA_PASSWORD=admin` from generated `.env`
4. **[MEDIUM]** Fix M4 — validate secret is non-empty before accepting exchange config
5. **[MEDIUM]** Fix M2 — replace `content.length > 50` with regex check for real key-value pairs
6. **[MEDIUM]** Fix M1 — extract `ENV_PATH` to shared constant in `src/utils/config.ts` or `src/cli/cli-constants.ts`
7. **[LOW]** Fix L4 — add `process.stdin.isTTY` guard to prevent hangs in CI/pipe environments
8. **[LOW]** Fix L3 — centralize exchange list constant

---

## Metrics

- Type Coverage: 100% (no `any` found)
- Linting Issues: 0 TypeScript errors detected
- `console.log` violations: 42 occurrences across both files (project standard says 0)
- DRY violations: 1 (`ENV_PATH` defined twice)
- Files over 200 lines: 0

---

## Unresolved Questions

1. Should CLI wizard output (banners, progress lines) be explicitly exempted from the `0 console.log` rule in `docs/code-standards.md`? Currently the standard gives no exception for interactive CLI UX.
2. Is `CredentialVault` (AES-256-GCM at-rest encryption) intended to be used instead of plaintext `.env` for API keys collected during setup? The wizard bypasses it entirely.
3. Should the wizard support a `--non-interactive` / `--env-file <path>` flag for CI use cases?
