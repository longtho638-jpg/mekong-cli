---
description: How to create and maintain documentation with AgencyOS
---

# Documentation Workflow

Create and maintain comprehensive documentation with AI assistance.

## Quick Start
```bash
# Initialize docs
/docs:init

# Update after changes
/docs:update "after implementing user authentication"

# Review all docs
/docs:summarize "complete documentation review"
```

## Step-by-Step Guide

### 1. Initialize Documentation
// turbo
```bash
/docs:init
```

What happens:
- Creates documentation structure
- Analyzes existing codebase
- Sets up documentation tooling

Output:
```
docs/
├── README.md
├── API.md
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
└── ARCHITECTURE.md
```

### 2. Initial Documentation Generation
// turbo
```bash
/docs:init "comprehensive project documentation"
```

Generates:
- Project overview and goals
- Architecture diagrams
- API documentation from code
- Setup and installation guides
- Development workflow docs

### 3. Update Documentation After Changes
// turbo
```bash
/docs:update "after implementing user authentication"
```

Updates:
- API documentation for new endpoints
- New feature documentation
- Updated architecture diagrams
- Modified setup instructions
- New examples and tutorials

### 4. Comprehensive Documentation Review
// turbo
```bash
/docs:summarize "complete documentation review"
```

Review coverage:
- Consistency check across all docs
- Accuracy verification of code examples
- Completeness assessment
- Readability improvements

## Documentation Types

### API Documentation
// turbo
```bash
/docs:init "generate API documentation from code"
```
- REST API endpoints
- GraphQL schemas
- Request/response examples
- Error codes and handling

### User Guides
// turbo
```bash
/docs:update "create user guide for new feature"
```
- Step-by-step tutorials
- Common use cases
- Troubleshooting guides

### Developer Documentation
// turbo
```bash
/docs:update "development setup and workflows"
```
- Local development setup
- Code contribution guidelines
- Testing procedures
- Release process

### Architecture Documentation
// turbo
```bash
/docs:summarize "system architecture and design"
```
- High-level architecture
- Data flow diagrams
- Database schemas
- Security considerations

## Integration with Development

### Pre-commit Check
// turbo
```bash
# Before committing
/docs:update "check if docs need updating"
```

### After Each Feature
```bash
/code       # Implement feature
/docs:update  # Update docs
/git:cm     # Commit all
```

## Best Practices
1. **Update docs with code** - Always run `/docs:update` after changes
2. **Use clear language** - Avoid jargon
3. **Include examples** - Code samples are essential
4. **Add diagrams** - Visual aids help understanding
5. **Keep it current** - Outdated docs are worse than none

## 🏯 Binh Pháp Alignment
"無形無相" (Formless Strategy) - Good documentation makes knowledge accessible to all.
