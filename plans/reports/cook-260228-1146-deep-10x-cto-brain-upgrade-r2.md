# DEEP 10x CTO BRAIN UPGRADE ROUND 2

**Date:** 2026-02-28 | **Status:** ✅ COMPLETE | **Tests:** 24/24 passed

## Tổng quan

7 modules trong `apps/openclaw-worker/lib/` được upgrade, thêm intelligence cho CTO tự khôn hơn mỗi vòng.

## Changes

### 1. perception-engine.js (139→191 lines)
- **Thêm** Claude process count monitoring
- **Thêm** GPU temperature check (M1 Mac)
- **Thêm** Alert trend detection: phát hiện alert types lặp lại 3+ lần trong 10 sweeps gần nhất
- **Thêm** `getLatestSnapshot()` — export perception data cho learning-engine/dashboard
- **Thêm** Alert history tracking (giữ 50 alerts gần nhất)

### 2. learning-engine.js (253→308 lines)
- **Fix bug** `getTaskAdjustments()`: dùng `avgFilesPerRun` thay vì `filesChanged` total — trước đó so sánh sai total vs threshold
- **Thêm** Time-decay weighting: missions >7d = 50% weight, >14d = 25%
- **Thêm** `getProjectHealthScore()`: tính sức khỏe project (0-100) dựa trên success rate + productivity + efficiency
- **Thêm** `recordMissionFeedback()`: feedback loop — sau mỗi task completed → ghi build status + file/line changes → refine strategy
- **Thêm** `avgFilesPerRun` metric cho chính xác hơn

### 3. self-healer.js (223→282 lines)
- **Fix bug** `restartProxy()`: trước đó chỉ check health, KHÔNG recovery gì — giờ gọi `proxy-recovery.sh`
- **Fix bug** `preFlightCheck()`: gọi `restartProxy()` (async) nhưng KHÔNG await — giờ là async function + await
- **Thêm** Check proxy port 9191 (CC CLI proxy) ngoài 20128
- **Thêm** Auto-respawn crashed CC CLI workers: detect shell prompt → respawn claude command
- **Thêm** Escalation: 3 recovery failures liên tiếp → Telegram alert + tạm dừng

### 4. mission-dispatcher.js (507→551 lines)
- **Thêm** `classifyPriority()`: P0/P1/P2 routing dựa trên keywords (AGI/security=P0, complex=P1, routine=P2)
- **Thêm** Project health score logging: hiện score/100 trước mỗi dispatch
- **Integrate** learning-engine `getProjectHealthScore()` vào dispatch flow
- **Thêm** Priority log cho mỗi task dispatched

### 5. brain-spawn-manager.js (207→268 lines)
- **Thêm** `detectIdleWorkers()`: scan tất cả tmux panes, phát hiện workers idle >5 phút
- **Thêm** `getWorkerHealthSummary()`: trả về status summary cho tất cả workers (alive/busy/idle/dead)
- Logging khi phát hiện idle workers

### 6. proxy-client.js (108→159 lines)
- **Thêm** Circuit breaker pattern: 3 failures liên tiếp → OPEN circuit 30s
- **Thêm** Multi-proxy failover: attempt cuối dùng fallback proxy (port 9191)
- **Thêm** `checkProxyAlive()` — health check function cho external modules
- **Thêm** `recordSuccess()`/`recordFailure()` circuit breaker state tracking

### 7. hunter-scanner.js (145→211 lines)
- **Fix** `console.log` → dùng `log()` function (consistent với các modules khác)
- **Fix** Removed unused `targetPane` variable
- **Thêm** `checkBuildHealth()`: chạy `npm run build` và trả về status
- **Thêm** `calculatePriorityScore()`: tính priority 0-100 dựa trên issue weights (SECURITY=30, TYPE_SAFETY=20, TECH_DEBT=15, CONSOLE_LOG=10)
- **Thêm** `analyzeProjectHealth()`: full analysis = scan + build + priority scoring

## Verification

```
Test Files  7 passed (7)
     Tests  24 passed (24)
  Duration  662ms
```

## Bug Summary

| # | Module | Bug | Fix |
|---|--------|-----|-----|
| 1 | learning-engine | `filesChanged === 0` check dùng total thay vì avg/run | Dùng `avgFilesPerRun` |
| 2 | self-healer | `restartProxy()` chỉ check, không recovery | Gọi proxy-recovery.sh |
| 3 | self-healer | `preFlightCheck()` không await async | Chuyển sang async function |
| 4 | hunter-scanner | Dùng `console.log` thay vì `log()` | Thay bằng `log()` |
| 5 | hunter-scanner | Unused `targetPane` variable | Xóa |

## Kiến trúc Intelligence Loop (sau upgrade)

```
perceive() → alertHistory → detectAlertTrends()
     ↓
executeTask() → classifyPriority(P0/P1/P2) → getDispatchHints()
     ↓
runMission() → result
     ↓
recordOutcome() → analyzePatterns() → getTaskAdjustments()
     ↓
recordMissionFeedback() → saveLessons() → getProjectHealthScore()
     ↓
healthCheck() → auto-respawn crashed CLI → restartProxy()
     ↓
analyzeProjectHealth() → calculatePriorityScore() → generateHunterMission()
```

CTO tự khôn hơn mỗi vòng: perception → learn → adapt → heal → hunt.
