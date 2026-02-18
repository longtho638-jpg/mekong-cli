# Phase 6: Integration Testing & Release

## Objective
Verify that all 14 bugs are fixed and the system is stable before committing.

## Verification Checklist

### 1. Static Analysis
- [ ] Syntax check all modified files
- [ ] Check for deprecated `brain-tmux` references
- [ ] Verify `config.js` values

### 2. Runtime Verification
- [ ] `require('./task-watcher')` runs without error
- [ ] `require('./lib/brain-process-manager')` runs without error
- [ ] `require('./lib/m1-cooling-daemon')` runs without error

### 3. Git Operations
- [ ] Stage all changes
- [ ] Commit with conventional message
- [ ] Push to master

## Execution Log

### Step 1: Syntax Check
```bash
node -c apps/openclaw-worker/task-watcher.js
node -c apps/openclaw-worker/lib/brain-process-manager.js
node -c apps/openclaw-worker/lib/mission-dispatcher.js
node -c apps/openclaw-worker/lib/m1-cooling-daemon.js
node -c apps/openclaw-worker/config.js
```

### Step 2: Reference Check
```bash
grep -r "brain-tmux" apps/openclaw-worker/ | grep -v "README.md" | grep -v "docs/"
```
(Should be empty or only comments)

### Step 3: Runtime Dry Run
```bash
cd apps/openclaw-worker
node -e "try { require('./config'); require('./lib/brain-process-manager'); require('./task-watcher'); console.log('✅ Boot check passed'); } catch(e) { console.error(e); process.exit(1); }"
```

### Step 4: Commit
Message:
```
fix(openclaw): MEGA CTO PIPELINE OVERHAUL — Fix 14 Bugs

- Fix task-watcher.js: scan interval, duplicate dispatch
- Fix brain-process-manager.js: poll intervals, logic gaps
- Fix mission-dispatcher.js: atomic writes
- Fix m1-cooling-daemon.js: velocity threshold (5.0)
- Fix config.js: poll interval (100ms) for sub-5s latency
- Rename brain-tmux.js -> brain-process-manager.js refactoring

Ref: 260217-2100-mega-cto-pipeline-overhaul-14-bugs
```
