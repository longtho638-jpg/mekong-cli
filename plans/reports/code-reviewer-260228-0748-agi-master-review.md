# Code Review: AGI Deep 10x Master Implementation
**Ngày:** 2026-02-28
**Reviewer:** code-reviewer agent
**Scope:** 8 files — openclaw-worker AGI L10–L12 upgrade

---

## Tóm Tắt Tổng Quan

| Hạng mục | Đánh giá |
|----------|----------|
| Điểm tổng | **7.8 / 10** |
| Bảo mật | Tốt (không có secret hardcode) |
| Error handling | Tốt — tất cả external calls đều non-fatal |
| Race conditions | 1 vấn đề Medium (saveTracker không atomic) |
| Memory leaks | 1 vấn đề Low (_dispatchedMissions Map không giới hạn kích thước) |
| Code quality | Tốt — YAGNI/KISS nhìn chung được tôn trọng |

---

## Scope

- **Files sửa:** `self-analyzer.js`, `vector-service.js`, `task-queue.js`, `auto-cto-pilot.js`, `evolution-engine.js`, `task-watcher.js`
- **Files tạo mới:** `clawwork-integration.js`, `moltbook-integration.js`
- **LOC thêm mới (ước tính):** ~350 lines
- **Scout findings:** xem phần "Edge Cases từ Scout"

---

## Điểm Mạnh

1. **Non-fatal design nhất quán** — tất cả 8 file đều wrap external calls trong try/catch và resolve(null) thay vì reject/throw. Đây là đúng cho daemon.
2. **Rate limiting trong moltbook-integration** — `POST_COOLDOWN_MS = 30min` ngăn spam API khi nhiều mission complete nhanh.
3. **Lazy-init bridge pattern** (`getBridge()`, `getClient()`) — tránh crash ngay boot nếu package thiếu, chỉ fail khi thực sự cần. Đúng YAGNI.
4. **updateSessionStats fix** — logic rõ ràng, read-modify-write đơn giản, dedup lesson tốt (không push duplicate).
5. **Local hash embedding fallback** — deterministic, zero-dep, có L2 normalize. Giải pháp thực tế thay vì để vector-service die hoàn toàn.
6. **getFailureKey improvement** — regex-based classification thay thế 'unknown' có giá trị cao cho evolution-engine. Pattern list đủ bao quát.
7. **generateEconomicMission dedup** — dựa vào `tracker.completedIds` để không dispatch lại task đã xong. Đúng.
8. **CLAWWORK tag pattern** (`[ClawWork:gdp-001]`) — regex match trong task-queue.js để trigger recordEconomicCompletion là thông minh, không cần coupling chặt.

---

## Vấn Đề Cần Chú Ý

### MEDIUM — Race Condition: saveTracker không atomic (clawwork-integration.js)

**File:** `/Users/macbookprom1/mekong-cli/apps/openclaw-worker/lib/clawwork-integration.js`

**Vấn đề:** Trong `recordEconomicCompletion()`, có hai lần gọi `saveTracker()` tách biệt — một lần trong `bridge.recordCompletion()` (nếu bridge cũng lưu), và một lần trong integration. Riêng trong `generateEconomicMission()`, cũng có `saveTracker()` tăng `totalMissions`. Nếu hai mission hoàn thành gần nhau, `loadTracker() → modify → saveTracker()` của thread 1 có thể bị overwrite bởi thread 2.

Tuy nhiên task-queue.js hiện tại xử lý tuần tự (không song song thực sự do `activeCount >= 2` chặn), nên rủi ro thực tế thấp. Cần chú ý nếu concurrency tăng trong tương lai.

```js
// Hiện tại (không atomic):
function recordEconomicCompletion(taskId, success, elapsedSec) {
  bridge.recordCompletion(taskId, quality, cost); // có thể write completions.jsonl
  const tracker = loadTracker();                   // đọc lại file
  tracker.completedIds.push(taskId);
  saveTracker(tracker);                            // write đè
}

// Khuyến nghị: Gộp load/modify/save vào một hàm duy nhất
function recordEconomicCompletion(taskId, success, elapsedSec) {
  try {
    const quality = success ? 0.8 : 0.2;
    const cost = elapsedSec * 0.01;
    const bridge = getBridge();
    if (bridge) bridge.recordCompletion(taskId, quality, cost);

    // Atomic update tracker
    const tracker = loadTracker();
    if (success && !tracker.completedIds.includes(taskId)) {
      tracker.completedIds.push(taskId);
    }
    tracker.lastCompletion = { taskId, success, cost, at: new Date().toISOString() };
    saveTracker(tracker);
    log(`[CLAWWORK] Recorded: ${taskId} q:${quality} $${cost.toFixed(2)}`);
  } catch (e) {
    log(`[CLAWWORK] Record failed (non-fatal): ${e.message}`);
  }
}
```

---

### MEDIUM — Memory Leak tiềm năng: `_dispatchedMissions` Map không bị giới hạn (auto-cto-pilot.js)

**File:** `/Users/macbookprom1/mekong-cli/apps/openclaw-worker/lib/auto-cto-pilot.js` (line 31)

**Vấn đề:** Map `_dispatchedMissions` chỉ xóa entry khi `isMissionDuplicate()` được gọi với key đã expired. Nếu một error key xuất hiện 1 lần rồi biến mất vĩnh viễn (ví dụ: build error đã được fix), entry đó ở lại Map mãi mãi. Daemon chạy hàng tuần sẽ tích lũy.

```js
// Hiện tại: chỉ cleanup on-access (lazy eviction)
const _dispatchedMissions = new Map();

// Khuyến nghị: Thêm periodic cleanup (mỗi 1 giờ)
setInterval(() => {
  const now = Date.now();
  for (const [key, ts] of _dispatchedMissions.entries()) {
    if (now - ts > MISSION_DEDUP_TTL_MS) _dispatchedMissions.delete(key);
  }
}, 60 * 60 * 1000);
```

Tác động thực tế: thấp (Map chứa string nhỏ), nhưng đây là daemon dài hạn nên tốt hơn là clean.

---

### MEDIUM — vector-service.js: Dimension mismatch giữa proxy embedding và local fallback

**File:** `/Users/macbookprom1/mekong-cli/apps/openclaw-worker/lib/vector-service.js`

**Vấn đề:** Proxy embedding trả về `text-embedding-3-small` = 1536 dims. Local `_localHashEmbedding()` mặc định = 256 dims. Nếu một số bản ghi trong LanceDB được lưu với 1536-dim và sau đó search dùng 256-dim fallback, LanceDB sẽ throw error về dimension mismatch.

```js
// Vấn đề:
async function getEmbedding(text) {
  try {
    return await _getProxyEmbedding(text); // → 1536 dims
  } catch (e) {
    return _localHashEmbedding(text); // → 256 dims  ← MISMATCH nếu bảng đã có 1536-dim data
  }
}
```

**Khuyến nghị:** Hoặc hard-code `dims = 1536` trong local fallback, hoặc detect dimension từ schema bảng khi khởi tạo:

```js
const EMBEDDING_DIMS = 1536; // Match text-embedding-3-small

function _localHashEmbedding(text, dims = EMBEDDING_DIMS) { ... }
```

Nếu bảng chưa có data nào, thì 256 dims vẫn OK vì schema tạo theo dims của item đầu tiên — nhưng đây là time-bomb khi proxy khả dụng lần đầu rồi fail.

---

### LOW — self-analyzer.js: Hardcoded log path

**File:** `/Users/macbookprom1/mekong-cli/apps/openclaw-worker/lib/self-analyzer.js` (line 25)

```js
// Hardcode path — khác với cách config.LOG_FILE được dùng ở các module khác
try { fs.appendFileSync('/Users/macbookprom1/tom_hum_cto.log', ...) }
```

**Vấn đề:** Toàn bộ các file khác (`evolution-engine.js`, `vector-service.js`) đều dùng `config.LOG_FILE` hoặc `process.env.TOM_HUM_LOG`. Riêng `self-analyzer.js` hardcode path user cụ thể, sẽ break nếu chạy trên máy khác hoặc trong CI.

**Fix:**
```js
const LOG_FILE = config.LOG_FILE || path.join(process.env.HOME, 'tom_hum_cto.log');
function log(msg) {
  const ts = new Date().toLocaleTimeString('en-US', { hour12: false });
  try { fs.appendFileSync(LOG_FILE, `[${ts}] [tom-hum] [AGI-10] ${msg}\n`); } catch (e) { }
}
```

---

### LOW — moltbook-integration.js: `heartbeat()` không check HTTP status

**File:** `/Users/macbookprom1/mekong-cli/apps/openclaw-worker/lib/moltbook-integration.js`

Trong `packages/mekong-moltbook/index.js`, hàm `heartbeat()`:
```js
async heartbeat() {
  const res = await fetch(`https://${MOLTBOOK_HOST}/HEARTBEAT.md`);
  const content = await res.text();  // ← không check res.ok
  return { content, fetchedAt: new Date().toISOString() };
}
```

Nếu server trả 404/500, `content` sẽ là HTML error page nhưng không throw. `moltbook-integration.js` log `Heartbeat OK` dù thực ra failed. Lỗi non-critical nhưng log misleading.

---

### LOW — task-queue.js: `postMissionSummary` fire-and-forget không bắt được lỗi đúng cách

**File:** `/Users/macbookprom1/mekong-cli/apps/openclaw-worker/lib/task-queue.js` (line 208)

```js
postMissionSummary(...).catch(() => {});
```

Empty catch block nuốt lỗi hoàn toàn. Đây là pattern an toàn nhưng không log, làm khó debug. Tốt hơn:

```js
postMissionSummary(...).catch((e) => log(`[MOLTBOOK] postMissionSummary failed: ${e.message}`));
```

---

### LOW — clawwork-integration.js: Cost estimate quá thô

**File:** `/Users/macbookprom1/mekong-cli/apps/openclaw-worker/lib/clawwork-integration.js` (line 98)

```js
const cost = elapsedSec * 0.01; // Rough cost estimate based on time
```

`$0.01/giây` = `$36/giờ` là con số rất cao và không thực tế cho LLM usage. Không ảnh hưởng production hiện tại (chỉ để log/track), nhưng nếu ClawWork benchmark thực sự dùng số này để score thì kết quả bị sai.

**Khuyến nghị:** Dùng token count thực tế nếu có, hoặc đổi comment thành rõ ràng hơn là "placeholder".

---

## Edge Cases từ Scout

### 1. SIGUSR1 hot-reload không re-init ClawWork/Moltbook

**File:** `/Users/macbookprom1/mekong-cli/apps/openclaw-worker/task-watcher.js` (lines 341–380)

SIGUSR1 restart xóa require.cache và re-init tất cả modules — nhưng `startClawWork` và `startMoltbook` KHÔNG có trong danh sách re-init của SIGUSR1:

```js
// Trong SIGUSR1 handler (line ~367):
safeBoot('startAutoCTO', startAutoCTO);
safeBoot('startScanner', startScanner);
// ... các module khác ...
// ❌ THIẾU: startClawWork, startMoltbook, startSelfAnalyzer không được re-init
```

Sau SIGUSR1, ClawWork bridge và Moltbook client giữ reference cũ (đã bị xóa khỏi cache nhưng biến `_bridge`/`_client` vẫn trỏ tới instance cũ). `getBridge()` và `getClient()` sẽ trả về stale instance cho đến khi daemon restart hoàn toàn.

**Fix:** Thêm vào SIGUSR1 handler:
```js
// Reset lazy-init singletons
try {
  const cw = require('./lib/clawwork-integration');
  // Không có stopClawWork nhưng cần reset _bridge
} catch (e) { }
```

Hoặc export `reset()` function từ các integration module.

### 2. Moltbook `_lastPostTime` bị reset sau SIGUSR1

`_lastPostTime` là module-level variable trong `moltbook-integration.js`. Sau hot-reload, module được re-require nên `_lastPostTime = 0`. Điều này bypass rate limit 30min và có thể gửi nhiều post liên tiếp ngay sau restart.

### 3. `updateSessionStats` race trong Dual-Stream Flywheel

`task-queue.js` có `activeCount >= 2` (2 concurrent missions). Cả hai missions hoàn thành gần nhau đều gọi `updateSessionStats()`, mỗi call `loadMemory() → modify → saveMemory()`. Với 2 concurrent writes vào cùng JSON file, một write có thể overwrite write kia.

Tương tự vấn đề atomic write trong `saveMemory()` — nên dùng temp file + rename (như `saveState()` trong `auto-cto-pilot.js` đã làm đúng):

```js
// auto-cto-pilot.js làm đúng:
function saveState(state) {
  const tempFile = `${SCAN_RESULT_FILE}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(state, null, 2));
  fs.renameSync(tempFile, SCAN_RESULT_FILE); // atomic
}

// self-analyzer.js saveMemory() cần học theo:
function saveMemory(mem) {
  mem.updatedAt = new Date().toISOString();
  try {
    const tempFile = `${MEMORY_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(mem, null, 2));
    fs.renameSync(tempFile, MEMORY_FILE); // atomic rename
  } catch (e) { }
}
```

---

## Bảo Mật

- Không có hardcoded API key, secret, hoặc credential nào trong toàn bộ 8 files. ✅
- `MOLTBOOK_API_KEY` được lấy từ `process.env` — đúng. ✅
- `x-api-key: 'ollama'` trong `vector-service.js` là dummy key cho local proxy — không phải secret thực. ✅
- MoltbookClient enforce `url.hostname === MOLTBOOK_HOST` — ngăn SSRF nếu baseUrl bị inject. ✅
- `clawwork-integration.js` load package qua absolute path từ `config.MEKONG_DIR` — không thể path traversal. ✅

---

## Code Quality (YAGNI/KISS/DRY)

| Tiêu chí | Nhận xét |
|----------|----------|
| YAGNI | Tốt — ClawWork/Moltbook chỉ implement đúng những gì cần thiết |
| KISS | Tốt — getBridge/getClient lazy-init pattern đơn giản và rõ |
| DRY | Chú ý: `loadTracker()`/`saveTracker()` bị duplicate giữa `generateEconomicMission` và `recordEconomicCompletion` — có thể gộp |
| File size | Tất cả files < 200 lines — đúng standard |
| Error handling | Nhất quán non-fatal pattern — đúng cho daemon |

---

## Metrics

| Metric | Giá trị |
|--------|---------|
| Files reviewed | 8 |
| Critical issues | 0 |
| Medium issues | 3 |
| Low issues | 4 |
| Security issues | 0 |
| Hardcoded secrets | 0 |
| Test coverage | N/A (daemon architecture) |

---

## Danh Sách Hành Động Ưu Tiên

1. **[MEDIUM]** Fix `saveMemory()` trong `self-analyzer.js` — dùng atomic temp+rename thay vì direct write, vì có 2 concurrent missions có thể race-write cùng file.
2. **[MEDIUM]** Fix embedding dimension consistency trong `vector-service.js` — đặt `EMBEDDING_DIMS = 1536` để khớp với proxy model.
3. **[MEDIUM]** Fix `recordEconomicCompletion` để gộp load/modify/save thành một operation.
4. **[LOW]** Thêm periodic cleanup cho `_dispatchedMissions` Map trong `auto-cto-pilot.js`.
5. **[LOW]** Sửa hardcoded log path trong `self-analyzer.js` → dùng `config.LOG_FILE`.
6. **[LOW]** Thêm `startClawWork` và `startMoltbook` vào SIGUSR1 re-init list trong `task-watcher.js`.
7. **[LOW]** Thêm log vào empty `.catch()` của `postMissionSummary` trong `task-queue.js`.

---

## Câu Hỏi Chưa Giải Quyết

1. `ClawWorkBridge.recordCompletion()` trong `packages/mekong-clawwork/index.js` append vào `completions.jsonl` nhưng `clawwork-integration.js` cũng lưu `completedIds` vào `economic-tracker.json`. Hai store này có bao giờ được sync lại không? Hay `completions.jsonl` chỉ là audit log?
2. `moltbook-integration.js` có `agentId: null` trong state mặc định nhưng không có code nào set `agentId` sau khi `register()` hoặc `getProfile()`. Agent ID có được track ở đâu không?
3. `_localHashEmbedding` có 256 dims — nếu LanceDB đã có bảng với schema 1536-dim từ trước, fallback này sẽ crash. Cần confirm bảng LanceDB hiện tại chứa data với dims nào.
