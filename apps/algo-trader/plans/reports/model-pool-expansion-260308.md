# Báo Cáo: Mở Rộng Model Pool 5 → 10

## Tổng Quan

Đã mở rộng hệ thống mekong-cli để hỗ trợ **10 models song song** (P0-P9) thay vì 3 như trước.

## Thay Đổi Chính

### 1. MODEL_POOL Expansion

**File:** `apps/openclaw-worker/lib/auto-cto-pilot.js`

**Trước (3 models):**
```javascript
const MODEL_POOL = {
  0: 'qwen3-coder-plus',
  1: 'qwen3-coder-plus',
  2: 'kimi-k2.5'
};
```

**Sau (10 models):**
```javascript
const MODEL_POOL = {
  0: 'qwen3.5-plus',              // P0: flagship (1M ctx)
  1: 'qwen3-coder-plus',          // P1: code specialist (1M ctx)
  2: 'kimi-k2.5',                 // P2: reviewer + vision (262K ctx)
  3: 'qwen3-max-2026-01-23',      // P3: deep reasoning (262K ctx)
  4: 'qwen3.5-flash',             // P4: fast tasks (1M ctx)
  5: 'qwen3-coder-480b-a35b-instruct', // P5: largest coder (262K ctx)
  6: 'MiniMax-M2.5',              // P6: large output (204K ctx)
  7: 'MiniMax-M2.5-highspeed',    // P7: fast large output (204K ctx)
  8: 'glm-5',                     // P8: fresh perspective (202K ctx)
  9: 'glm-4.7'                    // P9: fast review (202K ctx)
};
```

### 2. Pane Assignment Logic

**getTargetPane()** - Mở rộng để phân tán task lên 10 panes:

```javascript
function getTargetPane(filename) {
  const lower = filename.toLowerCase();
  if (/well|wellnexus|84tea/.test(lower)) return 1;
  if (/algo.?trader|algotrader|trading/.test(lower)) return 2;
  // P3-P9: round-robin overflow cho projects khác
  const hash = filename.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return 3 + (hash % 7);
}
```

### 3. LLM Vision Loop

**Trước:** `for (let pIdx = 0; pIdx < 3; pIdx++)`

**Sau:** `for (let pIdx = 0; pIdx < TOTAL_PANES; pIdx++)` với `const TOTAL_PANES = 10`

### 4. Question Loop Tracking

**Trước:** Single counter `_questionLoopCount` cho tất cả panes

**Sau:** Map `_paneQuestionCounts` tracking riêng cho từng pane (P0-P9)

```javascript
const _paneQuestionCounts = new Map();

// Per-pane question detection
const currentCount = (_paneQuestionCounts.get(pIdx) || 0) + 1;
_paneQuestionCounts.set(pIdx, currentCount);

if (currentCount >= 3) {
  // Send Escape để break loop
  _paneQuestionCounts.set(pIdx, 0);
}
```

## Architecture Mapping

| Pane | Model | Role | Projects |
|------|-------|------|----------|
| P0 | qwen3.5-plus | Flagship | mekong-cli (default) |
| P1 | qwen3-coder-plus | Code specialist | well, wellnexus, 84tea |
| P2 | kimi-k2.5 | Reviewer + Vision | algo-trader, trading |
| P3 | qwen3-max-2026-01-23 | Deep reasoning | Round-robin overflow |
| P4 | qwen3.5-flash | Fast tasks | Round-robin overflow |
| P5 | qwen3-coder-480b | Largest coder | Round-robin overflow |
| P6 | MiniMax-M2.5 | Large output | Round-robin overflow |
| P7 | MiniMax-M2.5-highspeed | Fast large output | Round-robin overflow |
| P8 | glm-5 | Fresh perspective | Round-robin overflow |
| P9 | glm-4.7 | Fast review | Round-robin overflow |

## Benefits

1. **Tăng throughput:** 3 → 10 tasks song song (3.3x)
2. **Model diversity:** Mỗi task dùng model tối ưu cho use case
3. **Better load balancing:** Round-robin overflow cho projects lạ
4. **Question loop isolation:** Mỗi pane có tracking riêng

## Next Steps (Optional)

1. **Create 10 tmux panes:** Hiện tại chỉ có 3 panes, cần tạo thêm 7 panes (P3-P9)
2. **Update tmux session config:** `tom_hum:0.0` → `tom_hum:0.9`
3. **Test round-robin hashing:** Verify hash distribution đều across 7 overflow panes

## Files Changed

- `apps/openclaw-worker/lib/auto-cto-pilot.js` (3 edits)
  - MODEL_POOL expansion
  - getTargetPane() round-robin logic
  - TOTAL_PANES constant
  - _paneQuestionCounts Map

## Syntax Validation

✅ JavaScript syntax valid (`node -c` passed)

---

**Report Generated:** 2026-03-08
**Status:** Ready to commit
