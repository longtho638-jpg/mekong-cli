---
description: How to maintain and modernize legacy projects with AgencyOS
---

# Maintaining an Old Project

Take over legacy projects and modernize them systematically.

## Overview
| Step | Task | Time |
|------|------|------|
| 1 | Initial Assessment | 10 min |
| 2 | Understand the System | 15 min |
| 3 | Update Dependencies | 30 min |
| 4 | Add Missing Tests | 60 min |
| 5 | Fix Critical Issues | 45 min |
| 6 | Improve Code Quality | 60 min |
| 7 | Fix Deployment | 30 min |
| 8 | Set Up Maintenance | 30 min |

## Step-by-Step Guide

### Step 1: Initial Assessment
// turbo
```bash
# Clone and explore
git clone https://github.com/company/legacy-project.git
cd legacy-project
ls -la
cat package.json
```

// turbo
```bash
# Generate documentation (most important first step)
/docs:init
```

What happens:
- Analyzes entire codebase
- Identifies technical debt
- Finds security vulnerabilities
- Creates documentation

### Step 2: Understand the System
// turbo
```bash
# Ask questions about the codebase
"Explain the authentication flow"
"What are the main API endpoints?"
"Where is the database schema defined?"
```

### Step 3: Update Dependencies
// turbo
```bash
npm outdated
```

// turbo
```bash
/plan "update all dependencies to latest stable versions"
```

// turbo
```bash
/code "update dependencies following the plan"
```

// turbo
```bash
# Verify updates
npm test
npm audit
npm run dev
```

### Step 4: Add Missing Tests
// turbo
```bash
/plan "add comprehensive test coverage for critical paths"
/code
```

Target: 80%+ coverage on critical paths

### Step 5: Fix Critical Issues

#### Security Vulnerabilities
// turbo
```bash
/debug "identify security vulnerabilities"
/fix:hard "patch all security issues"
```

#### Performance Issues
// turbo
```bash
/debug "find performance bottlenecks"
/fix "optimize database queries and caching"
```

### Step 6: Improve Code Quality
// turbo
```bash
/plan "modernize codebase with current best practices"
/code

# Optional: Add TypeScript
/plan "migrate JavaScript to TypeScript"
```

### Step 7: Fix Deployment
// turbo
```bash
/debug "diagnose deployment issues"
/fix:ci "fix CI/CD pipeline"
```

### Step 8: Set Up Maintenance
// turbo
```bash
# Add CI/CD
/plan "set up GitHub Actions for CI/CD"
/code

# Add monitoring
/plan "add error tracking and performance monitoring"
/code
```

## Key Improvements Checklist
- [ ] Documentation: 0% → 100%
- [ ] Tests: → 80%+ coverage
- [ ] Dependencies: All updated, 0 vulnerabilities
- [ ] Performance: Optimized
- [ ] Code Quality: Modern patterns
- [ ] Deployment: Automated
- [ ] Monitoring: Full observability

## Ongoing Maintenance

### Weekly
- [ ] Check dependency updates
- [ ] Review error logs
- [ ] Monitor performance

### Monthly
- [ ] Security audit
- [ ] Update documentation
- [ ] Refactor technical debt

## Common Challenges

| Challenge | Solution |
|-----------|----------|
| "I don't understand the code" | Use `/docs:init` first |
| "Too many issues to fix" | Prioritize security → tests → features |
| "Breaking changes in dependencies" | Update incrementally with tests |

## 🏯 Binh Pháp Alignment
"行軍篇" (On the March) - Move carefully, document everything.
