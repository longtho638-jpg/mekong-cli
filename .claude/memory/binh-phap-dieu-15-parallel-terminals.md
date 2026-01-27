# 🏯 BINH PHÁP ĐIỀU 15: PARALLEL TERMINAL EXECUTION

> **"分兵合擊，速戰速決"** - Divide forces for speed, unite for victory

---

## ⚡ PARALLEL TERMINAL STRATEGY

### PROBLEM:

- Single CC CLI session = Sequential, slow
- Background tasks queue up = Context exhaustion
- Heavy load = Performance degradation

### SOLUTION:

**Mỗi product = 1 terminal tab riêng**

```bash
# Terminal 1: Factory Controller (Main)
cd ~/mekong-cli/products/paid && claude --dangerously-skip-permissions

# Terminal 2: Product Builder 1
cd ~/mekong-cli/products/paid && claude --dangerously-skip-permissions

# Terminal 3: Product Builder 2
cd ~/mekong-cli/products/paid && claude --dangerously-skip-permissions

# Terminal 4: Product Builder 3
cd ~/mekong-cli/products/paid && claude --dangerously-skip-permissions
```

---

## 📋 FACTORY SPAWN SCRIPT

```bash
#!/bin/bash
# ~/.antigravity/spawn-factory.sh

PRODUCTS_DIR=~/mekong-cli/products/paid

# Spawn 4 parallel builders
for i in {1..4}; do
  osascript -e "tell application \"Terminal\" to do script \"cd $PRODUCTS_DIR && export ANTHROPIC_BASE_URL=http://localhost:8080 && export ANTHROPIC_API_KEY=\$ANTHROPIC_API_KEY && claude --dangerously-skip-permissions\""
done

echo "✅ Spawned 4 factory terminals"
```

---

## 🎯 LOAD DISTRIBUTION

| Terminal | Role       | Products            |
| -------- | ---------- | ------------------- |
| Tab 1    | Controller | Monitor + delegate  |
| Tab 2    | Builder A  | Product 1, 5, 9...  |
| Tab 3    | Builder B  | Product 2, 6, 10... |
| Tab 4    | Builder C  | Product 3, 7, 11... |

### Speed Improvement:

- **Before:** 1 product every 20 min = 3/hour
- **After:** 4 products parallel = 12/hour
- **4x speedup!**

---

## 🔧 TMUX ALTERNATIVE (Better)

```bash
# Create tmux session with 4 panes
tmux new-session -d -s factory
tmux split-window -h
tmux split-window -v
tmux select-pane -t 0
tmux split-window -v

# Send commands to each pane
for i in {0..3}; do
  tmux send-keys -t factory:0.$i "cd ~/mekong-cli/products/paid && export ANTHROPIC_BASE_URL=http://localhost:8080 && claude --dangerously-skip-permissions" Enter
done

# Attach to session
tmux attach-session -t factory
```

---

## 📊 RESOURCE LIMITS

| Parallel Sessions | RAM Usage | Recommended |
| ----------------- | --------- | ----------- |
| 2                 | ~4GB      | ✅ Safe     |
| 4                 | ~8GB      | ✅ Optimal  |
| 6                 | ~12GB     | ⚠️ Heavy    |
| 8+                | ~16GB+    | ❌ Risk OOM |

**Recommend: 4 parallel sessions = Sweet spot**

---

**Created:** 2026-01-26
**Version:** Binh Pháp v7.0 - ĐIỀU 15
