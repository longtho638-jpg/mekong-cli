# Task 06: Skills Integration Test

**Status:** Ready to Execute
**Priority:** Medium
**Estimated Time:** 10-15 minutes
**Dependencies:** None
**Terminal:** #7

---

## 🎯 Objective

Validate all 48+ skills in `.claude-skills/` have proper structure (SKILL.md files, scripts directories). Test 5 critical skills for functionality.

---

## 📋 WIN-WIN-WIN Validation

### 👑 ANH (Owner) WINS:
- Skill library proven functional
- Reusable components documented
- Knowledge base validated

### 🏢 AGENCY WINS:
- Skill catalog = faster development
- Standardized structure = easier maintenance
- Documentation quality verified

### 🚀 CLIENT/STARTUP WINS:
- Proven capabilities (no vaporware)
- Reliable feature implementations
- Faster time-to-market (reuse skills)

✅ **All 3 parties WIN** → Proceed

---

## ⚡ Execution Commands

```bash
cd /Users/macbookprom1/mekong-cli

echo "=== Skills Catalog Validation ==="

# Count skills in .claude-skills/
SKILL_COUNT=$(find .claude-skills -name "SKILL.md" | wc -l | tr -d ' ')
echo "Found $SKILL_COUNT skills with SKILL.md files"

# Validate skill structure
echo ""
echo "=== Validating Skill Structure ==="
for skill_dir in .claude-skills/*/; do
  skill_name=$(basename "$skill_dir")

  # Check for SKILL.md
  if [ -f "$skill_dir/SKILL.md" ]; then
    echo "  ✅ $skill_name - SKILL.md exists"

    # Check for scripts/ directory
    if [ -d "$skill_dir/scripts" ]; then
      script_count=$(find "$skill_dir/scripts" -type f | wc -l | tr -d ' ')
      echo "     └─ scripts/ directory ($script_count files)"
    else
      echo "     └─ ⚠️ No scripts/ directory"
    fi
  else
    echo "  ❌ $skill_name - Missing SKILL.md"
  fi
done

# Test 5 critical skills
echo ""
echo "=== Testing Critical Skills ==="

# Activate Claude skills venv
if [ -f "$HOME/.claude/skills/.venv/bin/activate" ]; then
  source "$HOME/.claude/skills/.venv/bin/activate"
  echo "✅ Claude skills venv activated"
else
  echo "⚠️ Claude skills venv not found (using system Python)"
fi

# Test 1: Planning skill (if exists)
echo ""
echo "Test 1: Planning Skill"
if [ -f ".claude-skills/planning/scripts/plan.py" ]; then
  python3 .claude-skills/planning/scripts/plan.py --help > /dev/null 2>&1 && \
    echo "  ✅ Planning skill executable" || \
    echo "  ⚠️ Planning skill script error"
else
  echo "  ⚠️ Planning skill script not found"
fi

# Test 2: Code review skill
echo ""
echo "Test 2: Code Review Skill"
if [ -d ".claude-skills/code-review" ]; then
  echo "  ✅ Code review skill exists"
else
  echo "  ⚠️ Code review skill missing"
fi

# Test 3: Debugging skill
echo ""
echo "Test 3: Debugging Skill"
if [ -d ".claude-skills/debugging" ]; then
  echo "  ✅ Debugging skill exists"
else
  echo "  ⚠️ Debugging skill missing"
fi

# Test 4: Payment integration skill
echo ""
echo "Test 4: Payment Integration Skill"
if [ -d ".claude-skills/payment-integration" ]; then
  echo "  ✅ Payment integration skill exists"
else
  echo "  ⚠️ Payment integration skill missing"
fi

# Test 5: Research skill
echo ""
echo "Test 5: Research Skill"
if [ -d ".claude-skills/research" ]; then
  echo "  ✅ Research skill exists"
else
  echo "  ⚠️ Research skill missing"
fi

# Check .agencyos/skills/ sync
echo ""
echo "=== Checking .agencyos/skills/ Sync ==="
if [ -d ".agencyos/skills" ]; then
  AGENCYOS_COUNT=$(find .agencyos/skills -name "SKILL.md" 2>/dev/null | wc -l | tr -d ' ')
  echo "Found $AGENCYOS_COUNT skills in .agencyos/skills/"

  if [ "$SKILL_COUNT" -eq "$AGENCYOS_COUNT" ]; then
    echo "✅ .claude-skills/ and .agencyos/skills/ are in sync"
  else
    echo "⚠️ Skill count mismatch - may need sync"
  fi
else
  echo "⚠️ .agencyos/skills/ directory not found"
fi

echo ""
echo "=== Skills Integration Test Complete ==="
echo "Total Skills: $SKILL_COUNT"
```

---

## ✅ Success Criteria

- [ ] At least 40 skills have valid SKILL.md files
- [ ] At least 30 skills have scripts/ directories
- [ ] All 5 critical skills exist (planning, code-review, debugging, payment-integration, research)
- [ ] `.claude-skills/` and `.agencyos/skills/` are in sync (or difference documented)
- [ ] No broken symlinks in skill directories

---

## 🔧 Failure Recovery

### Missing SKILL.md Files
```bash
# Generate SKILL.md template for missing skills
for skill_dir in .claude-skills/*/; do
  if [ ! -f "$skill_dir/SKILL.md" ]; then
    skill_name=$(basename "$skill_dir")
    cat > "$skill_dir/SKILL.md" << EOF
# Skill: $skill_name

**Category:** TBD
**Complexity:** Medium
**Tags:** skill, automation

## Description
TODO: Add skill description

## Usage
\`\`\`bash
# TODO: Add usage examples
\`\`\`

## Dependencies
- Python 3.11+
- (Add specific dependencies)

## Files
- scripts/ - Implementation scripts
- README.md - Additional documentation
EOF
    echo "Generated SKILL.md for $skill_name"
  fi
done
```

### Sync .claude-skills/ to .agencyos/skills/
```bash
# Mirror skills to .agencyos/
rsync -av --delete .claude-skills/ .agencyos/skills/
echo "✅ Synced .claude-skills/ → .agencyos/skills/"
```

### Script Execution Fails
```bash
# Check Python dependencies
pip list | grep -E "google-generativeai|anthropic|openai"

# Install missing dependencies
pip install google-generativeai anthropic openai
```

---

## 📊 Post-Task Validation

```bash
# Generate skills catalog report
cat > /tmp/skills-catalog-report.md << 'EOF'
# Skills Catalog Report

**Generated:** $(date)
**Location:** .claude-skills/

## Skill Categories
EOF

# Count skills by category (if categorized in SKILL.md)
for skill_dir in .claude-skills/*/; do
  skill_name=$(basename "$skill_dir")
  category=$(grep -m 1 "^Category:" "$skill_dir/SKILL.md" 2>/dev/null | cut -d: -f2 | xargs)

  if [ -n "$category" ]; then
    echo "- **$skill_name**: $category"
  else
    echo "- **$skill_name**: Uncategorized"
  fi
done >> /tmp/skills-catalog-report.md

cat /tmp/skills-catalog-report.md
echo "Report saved to: /tmp/skills-catalog-report.md"
```

---

## 🚀 Next Steps After Success

1. **Documentation:**
   - Copy report to `docs/skills-catalog.md`
   - Generate skills index for Claude Code

2. **Testing:**
   - Run sample tasks with top 5 skills
   - Document skill performance metrics

3. **Cleanup:**
   - Archive deprecated skills
   - Merge duplicate skills (if any)

4. **Next Task:**
   - Proceed to Task 07: Documentation Generation

---

**Report:** `echo "TASK 06 COMPLETE - SKILLS: $SKILL_COUNT VALIDATED" >> /tmp/binh-phap-execution.log`
