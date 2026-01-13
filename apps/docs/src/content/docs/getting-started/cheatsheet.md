---
title: "AgencyOS Cheatsheet"
description: "Quick reference for AgencyOS commands - essential commands for AI-powered development workflow."
section: getting-started
category: "getting-started"
order: 5
published: true
lastUpdated: 2025-11-07
ai_executable: true
---

# AgencyOS Cheatsheet

---

## 🤖 Quick Execute

```
Execute: https://agencyos.network/docs/getting-started/cheatsheet
```



Quick reference guide for AgencyOS CLI: **18 agents**, **125+ commands**, **5 business suites**.

## System Overview

- **18 Specialized Agents**: planner, researcher, developer, tester, debugger, and 13 more
- **125+ Commands**: Organized across 5 business suites
- **5 Business Suites**: Marketing 🔥, Sales 💼, Finance 💰, Strategic 🏯, Operations ⚡

## Installation

```bash
# Install AgencyOS globally
git clone https://github.com/longtho638-jpg/mekong-cli.git

# Check version
python main.py --version
```

## Starting AgencyOS

```bash
# Navigate to your project
cd /path/to/project

# Start AgencyOS CLI with AgencyOS
claude
```

## Commands by Business Suite

### 🔥 Marketing Suite

```bash
# Strategy
/ke-hoach-tiep-thi          # Marketing plan
/marketing-strategy          # EN alias
/content-marketing          # Content strategy
/noi-dung-tiep-thi          # VI alias

# Channels
/seo                        # SEO optimization
/ppc                        # Paid ads
/email                      # Email marketing
/social                     # Social media
/influencer                 # Influencer campaigns
/pr                         # Public relations
/ke-hoach-pr                # VI PR plan

# Content Creation
/content:good               # WOW content
/content:fast               # Quick content
/content:cro                # Conversion-optimized
/content:enhance            # Enhance existing
```

### 💼 Sales Suite

```bash
# Pipeline
/chien-luoc-ban-hang        # Sales strategy
/sales                      # EN alias
/crm                        # CRM management
/leadgen                    # Lead generation
/ban-hang                   # VI sales ops

# Customer Intelligence
/khach-hang                 # Customer profile (VI)
/customer-profile           # EN alias
/buyer-persona              # Persona building

# Tools
/tao-bao-gia                # Quote generation (VI)
/pricing                    # Pricing strategy
/sdr                        # Sales dev rep
/ae                         # Account executive
/bdm                        # Business development
/abm                        # Account-based marketing
```

### 💰 Finance Suite

```bash
# Core Finance
/bao-cao-tai-chinh          # Financial reports (VI)
/ngan-sach                  # Budget planning (VI)
/finance                    # General finance ops

# Operations
/hoa-don                    # Invoice (VI)
/invoice                    # EN invoice
/expense                    # Expense tracking
/theo-doi-chi-phi           # VI expense tracking
/runway                     # Cash runway analysis
/finance/runway             # Runway deep-dive
```

### 🏯 Strategic Suite

```bash
# Business Planning
/ke-hoach-kinh-doanh        # 9-question business plan
/business-plan              # EN alias
/ke-hoach-tang-truong       # Growth strategy (VI)
/growth-strategy           # EN alias

# Framework
/binh-phap                  # 13-chapter Binh Phap framework
/intel                      # Competitive intelligence
/competitive-analysis       # Market analysis

# Crisis Management
/crisis                     # Crisis response
/risk-assessment            # Risk analysis
/pivot-strategy             # Pivot planning
```

### ⚡ Operations Suite

```bash
# Core Development
/cook                       # Full feature (8-agent workflow)
/code                       # Code-only (no planning)
/bootstrap                  # New project setup
/plan                       # Planning only
/brainstorm                 # Idea generation

# Testing & Debugging
/test                       # Run test suite
/debug                      # Investigate issues
/fix:fast                   # Quick fixes
/fix:hard                   # Complex debugging
/fix:test                   # Fix test failures
/fix:types                  # TypeScript errors
/fix:ui                     # UI/UX fixes
/fix:ci                     # CI/CD failures
/fix:logs                   # Log-based fixes

# Design
/design:good                # WOW-level design
/design:fast                # Rapid prototyping
/design:3d                  # 3D visualizations
/design:video               # Video animations
/design:screenshot          # Screenshot → code

# Documentation
/docs:init                  # Initialize docs
/docs:update                # Update docs
/docs:summarize             # Generate summaries

# Version Control
/git:cm                     # Conventional commit
/git:commit                 # Commit changes
/git:commit-push            # Commit + push
/git:cp                     # Alias for commit-push
/git:pr                     # Create pull request

# Integration
/integrate:polar            # Polar.sh
/integrate:sepay            # SePay payment
/mcp:*                      # MCP tools
```

## Initial Setup

```bash
# For existing projects (brownfield)
/docs:init

# For new projects (greenfield)
python main.py init --kit engineer --dir /path/to/project
```

## Core Commands

### Development

```bash
# Initialize documentation and specs
/docs:init

# Implement new feature
/cook <description>

# Autonomous feature implementation
/cook:auto <description>

# Fast autonomous mode (less planning)
/cook:auto:fast <description>

# Create implementation plan only
/plan <description>

# Execute existing plan
/code <plan.md>

# Bootstrap new project
/bootstrap <idea-description>

# Autonomous bootstrap
/bootstrap:auto <idea-description>
```

### Bug Fixing

```bash
# Quick bug fix
/fix:fast <description>

# Complex bug fix (deeper analysis)
/fix:hard <description>

# Auto-fetch logs and fix
/fix:logs

# Run test suite and fix until passing
/fix:test

# Fix CI/CD pipeline issues
/fix:ci <github-action-url>
```

### Testing

```bash
# Run test suite and report (no fixes)
/test
```

### Documentation

```bash
# Initialize documentation
/docs:init

# Update documentation
/docs:update

# Summarize documentation
/docs:summarize
```

### Git Operations

```bash
# Create commit with meaningful message
/git:cm

# Commit and push changes
/git:cp

# Create pull request
/git:pr
```

### Planning & Research

```bash
# Brainstorm technical approaches
/brainstorm <description>

# Create detailed implementation plan
/plan <description>

# Plan CI/CD setup or fix CI/CD pipeline
/plan:ci

# Two-step implementation plan
/plan:two
```

### Integration

```bash
# Integrate Polar API
/integrate:polar

# Integrate SePay payment
/integrate:sepay
```

### Skills Management

```bash
# Create new skill
/skill:create

# Fix skill errors
/skill:fix-logs
```

## Command Comparison

### Feature Implementation Flow

```bash
# Approach 1: With plan review (recommended)
/cook <feature-description>
# → CC asks questions
# → Review plan
# → Approve
# → Implementation starts

# Approach 2: Autonomous (use with caution)
/cook:auto <feature-description>
# → Full autonomous without plan review

# Approach 3: Fast autonomous (least tokens)
/cook:auto:fast <feature-description>
# → Fast mode with minimal planning
```

### Bug Fixing Flow

```bash
# Simple bugs
/fix:fast <bug-description>

# Complex bugs
/fix:hard <bug-description>

# From logs
/fix:logs

# From failing tests
/fix:test

# From CI/CD
/fix:ci <action-url>
```

## Common Workflows

### Brownfield Project Setup

```bash
# 1. Install AgencyOS
git clone https://github.com/longtho638-jpg/mekong-cli.git

# 2. Go to project
cd /path/to/existing/project

# 3. Start AgencyOS CLI
claude

# 4. Initialize
/docs:init

# 5. Start working
/cook <feature>
```

### Greenfield Project Setup

```bash
# 1. Install AgencyOS
git clone https://github.com/longtho638-jpg/mekong-cli.git

# 2. Initialize project
python main.py init --kit engineer --dir /path/to/project

# 3. Navigate to project
cd /path/to/project

# 4. Start AgencyOS CLI
claude

# 5. Bootstrap idea
/bootstrap <idea-description>

# 6. Continue development
/cook <next-feature>
```

### Feature Development

```bash
# 1. Plan feature
/plan Add user profile with avatar upload

# 2. Review plan (markdown file generated)

# 3. Implement
/code profile-feature-plan.md

# 4. Test
/test

# 5. Fix if needed
/fix:test

# 6. Commit
/git:cm
```

### Bug Fix Workflow

```bash
# 1. Describe bug
/fix:hard Payment fails on Safari after form validation

# 2. CC analyzes and fixes

# 3. Test the fix
/test

# 4. Commit
/git:cm
```

### CI/CD Fix Workflow

```bash
# 1. Get failing action URL
# https://github.com/user/repo/actions/runs/12345

# 2. Fix CI
/fix:ci https://github.com/user/repo/actions/runs/12345

# 3. CC fetches logs, analyzes, fixes

# 4. Push fix
/git:cp
```

## Quick Examples

### Add Authentication

```bash
/cook Add JWT authentication with login, register, and password reset
```

### Fix Performance Issue

```bash
/fix:hard Dashboard loads slowly with 1000+ items
```

### Plan Database Migration

```bash
/plan Migrate from MongoDB to PostgreSQL with zero downtime
```

### Integrate Payment

```bash
/integrate stripe
# or
/cook Add Stripe payment integration with subscription billing
```

### Bootstrap New API

```bash
/bootstrap REST API for task management with teams, projects, tasks, and time tracking
```

## Command Categories

### 🚀 Core Development
- `/cook` - Feature implementation
- `/plan` - Create plans
- `/code` - Execute plans
- `/bootstrap` - New projects

### 🐛 Debugging & Fixing
- `/fix:fast` - Quick fixes
- `/fix:hard` - Complex fixes
- `/fix:logs` - Log-based fixes
- `/fix:test` - Test-based fixes
- `/fix:ci` - CI/CD fixes

### 🧪 Testing
- `/test` - Run tests

### 📚 Documentation
- `/docs:init` - Initialize
- `/docs:update` - Update
- `/docs:summarize` - Summarize

### 🔧 Git Operations
- `/git:cm` - Commit changes
- `/git:cp` - Commit and push
- `/git:pr` - Create PR

### 💡 Planning
- `/plan` - Detailed planning
- `/brainstorm` - Explore ideas

### 🔌 Integrations
- `/integrate <service>` - Add integrations

### ⚙️ Skills
- `/skill:create` - New skills
- `/skill:fix-logs` - Fix skills

## Tips & Best Practices

### 1. Always Review Plans
**IMPORTANT:** Review implementation plans carefully before approving. Plans exist for a reason.

### 2. Provide Context
More detailed descriptions = better results
```bash
# ❌ Bad
/cook Add search

# ✅ Good
/cook Add full-text search for blog posts with filters by category, tag, and date range
```

### 3. Use Right Command

```bash
# Quick bugs
/fix:fast <simple-issue>

# Complex bugs
/fix:hard <complex-issue>

# Small features
/cook <feature>

# Large features
/plan <feature> → review → /code plan.md
```

### 4. Test Frequently

```bash
# After each feature
/test

# Or auto-fix tests
/fix:test
```

### 5. Document Changes

```bash
# Keep docs updated
/docs:update
```

## Troubleshooting

### Command Not Working

```bash
# Check AgencyOS version
python main.py --version

# Restart AgencyOS CLI
# Exit and run: claude
```

### Need Fresh Start

```bash
# Reinitialize docs
/docs:init
```

### Need More Help

```bash
# Brainstorm approach
/brainstorm How to implement <complex-feature>

# Get detailed plan
/plan <what-you-want-to-do>
```

## Language-Specific Quick Reference

### Tiếng Việt

```bash
# Khởi tạo dự án có sẵn
/docs:init

# Tính năng mới (cần review plan)
/cook <mô-tả-tính-năng>

# Tính năng mới (tự động, ko review)
/cook:auto <mô-tả>

# Tính năng mới (nhanh hơn, ít plan hơn)
/cook:auto:fast <mô-tả>

# Chỉ lên plan, không code
/plan <mô-tả>

# Code theo plan có sẵn
/code <plan.md>

# Sửa lỗi nhanh
/fix:fast <mô-tả-lỗi>

# Sửa lỗi khó (suy nghĩ lâu hơn)
/fix:hard <mô-tả-lỗi>

# Tự lấy logs và sửa
/fix:logs

# Chạy test và sửa tới chết
/fix:test

# Lấy logs GitHub Actions và sửa
/fix:ci <github-action-url>

# Tạo dự án mới (cần review plan)
/bootstrap <ý-tưởng>

# Tạo dự án mới (tự động tới chết)
/bootstrap:auto <ý-tưởng>

# Chạy test và báo cáo (không sửa)
/test
```

### English

```bash
# Initialize existing project
/docs:init

# New feature (needs plan review)
/cook <feature-description>

# New feature (autonomous, no review)
/cook:auto <description>

# New feature (faster, less planning)
/cook:auto:fast <description>

# Only plan, no implementation
/plan <description>

# Code from existing plan
/code <plan.md>

# Quick bug fix
/fix:fast <bug-description>

# Hard bug fix (deeper analysis)
/fix:hard <bug-description>

# Auto-fetch logs and fix
/fix:logs

# Run tests and fix till passing
/fix:test

# Fetch GitHub Actions logs and fix
/fix:ci <github-action-url>

# Create new project (needs plan review)
/bootstrap <idea-description>

# Create new project (autonomous till death)
/bootstrap:auto <idea>

# Run test suite and report (no fixes)
/test
```

## Resources

- [Full Documentation](https://docs.agencyos.network)
- [All Commands](/docs/commands/)
- [AI Agents](/docs/agents/)
- [Workflows](/docs/docs/configuration/workflows)
- [Troubleshooting](/docs/support/troubleshooting/)
- [GitHub Discussions](https://github.com/mrgoonie/agencyos-cli/discussions)

---

**Print this page** or keep it open while working with AgencyOS for quick command reference!

---

## 🏯 Binh Pháp Alignment

> **九變篇** (Cửu Biến) - Adaptability - Quick reference

### Zero-Effort Commands

| Gõ lệnh | Auto-execute |
|---------|--------------|
| `/init` | Tự setup AgencyOS |
| `/plan` | Tự tạo plan |
| `/ship` | Tự deploy |

📖 [Xem tất cả Commands](/docs/commands)
