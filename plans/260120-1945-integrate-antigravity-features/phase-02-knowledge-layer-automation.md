---
title: "Phase 02: Knowledge Layer Automation"
description: "Automate QUANTUM_MANIFEST generation and implement a Python Rule Registry for 500+ rules."
status: pending
priority: P1
effort: 6h
branch: feat/antigravity-integration
tags: [knowledge, rules, automation]
created: 2026-01-20
---

# 📜 Phase 02: Knowledge Layer Automation

## 🔍 Context Links
- [Researcher Report: Antigravity Core & Agency OS Analysis](./research/researcher-agent-rules.md)
- [Project Rules](../../.claude/rules/)

## 📋 Overview
- **Priority**: P1
- **Status**: Pending
- **Description**: Scale from 15 rules to 500+ by automating the `QUANTUM_MANIFEST.md` generation and providing a programmatic interface for agents to query relevant rules.

## 💡 Key Insights
- Managing 500+ rules manually in one manifest file is impossible.
- Agents need "Just-In-Time" (JIT) rules, not a dump of every rule.

## 🎯 Requirements
- Automated script to crawl `.claude/rules/*.md` and generate `QUANTUM_MANIFEST.md`.
- Python-based `RuleRegistry` for semantic rule retrieval.
- Priority-based rule selection.

## 🏗️ Architecture
- **Manifest Generator**: A background hook or CLI command that rebuilds the index.
- **Rule Retriever**: Uses keyword matching or vector search (long-term) to find rules relevant to the current task context.

## 📂 Related Code Files
- `antigravity/core/rules_loader.py`: Existing loader to be enhanced.
- `antigravity/core/knowledge/rules.py`: New module for Rule Registry logic.
- `.claude/docs/QUANTUM_MANIFEST.md`: The output artifact.

## 🚀 Implementation Steps
1. **Develop `ManifestGenerator`**: Create a script in `antigravity/core/knowledge/` that parses rule metadata (Frontmatter).
2. **Build `RuleRegistry`**: Implement a Python class that indexes rules by tags, priority, and scope.
3. **Integrate with Orchestrator**: Allow agents to query `RuleRegistry.get_relevant_rules(task_context)` during plan generation.
4. **Automate Updates**: Add a git hook to regenerate the manifest on rule changes.

## ✅ Success Criteria
- [ ] `QUANTUM_MANIFEST.md` is auto-updated on file change.
- [ ] `RuleRegistry` can retrieve rules by tag (e.g., `tags: [finance]`).
- [ ] Win-Win-Win validation is verified as a high-priority rule in the registry.

## ⚠️ Risk Assessment
- **Manifest Bloat**: Too many rules might exceed token limits if all are injected (Mitigation: Only inject relevant ones).
- **Inconsistent Metadata**: Missing tags or priority in rule files (Mitigation: Linter for rules).

## 🔒 Security Considerations
- Prevent "Rule Injection" where untrusted data modifies the rule registry.
