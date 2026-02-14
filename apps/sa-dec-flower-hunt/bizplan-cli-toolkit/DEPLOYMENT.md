# BizPlan CLI Toolkit - Deployment Guide

## 🎯 Current Status: v0.7 (71% Complete)

**17/24 Agents Operational** - Production-ready for most business planning workflows

---

## 📦 Installation

### Option 1: Clone from GitHub (Recommended)

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/bizplan-cli-toolkit.git
cd bizplan-cli-toolkit

# Install dependencies
npm install

# Build TypeScript
npm run build

# Test installation
./bin/bizplan version
```

### Option 2: Local Development

Already in the repo? Just:

```bash
npm install
npm run build
```

---

## 🚀 Quick Start

### 1. Basic Usage

```bash
# Run full workflow (all 17 agents)
./bin/bizplan orchestrate --workflow full_plan

# Fundraising-focused workflow (5 agents)
./bin/bizplan orchestrate --workflow fundraising

# Custom output format
./bin/bizplan orchestrate --workflow gtm --format json
```

### 2. Real Example

```bash
# Create a sample input file
echo "Business: Sa Đéc Flower Hunt
Industry: Agri-tech E-commerce  
Stage: Seed
Market: Vietnam" > my-business.txt

# Run orchestration
./bin/bizplan orchestrate --refactor my-business.txt --format md
```

### 3. Check Output

```bash
# Results saved to outputs/
ls -lh outputs/
cat outputs/business-plan-*.json
```

---

## ✅ What Works (17 Agents)

### Foundation (4 agents)
- **01**: Refactor old plans to BP2026 format ✅
- **02**: Agentic architecture design ✅  
- **05**: Business model & unit economics ✅
- **06**: Customer psychology & personas ✅

### Brand & Marketing (6 agents)
- **07**: Brand positioning & identity ✅
- **08**: Content pillars & SEO strategy ✅
- **09**: Website & landing page copy ✅
- **10**: Performance ads & creatives ✅
- **11**: Long-form storytelling ✅
- **12**: Email sequences ✅

### GTM & Sales (3 agents)
- **13**: Sales process & playbook ✅
- **14**: GTM experiments (Bullseye) ✅
- **15**: AARRR analytics framework ✅

### Fundraising & IPO (4 agents)
- **03**: IPO readiness (VN/SEA) ✅
- **04**: Gap analysis & roadmap ✅
- **16**: Fundraising & VC narrative ✅
- **20**: Data room preparation ✅

---

## ⏳ Coming Soon (7 agents - 29%)

- **17**: Risk & Scenario Planning
- **18**: Talent & Org Design
- **19**: Industry Patterns & Benchmarks
- **21**: Agentic Execution & OKRs
- **22**: Board Governance
- **23**: ESG & Impact
- **24**: Crisis Management

Expected: v1.0 (100%) by end of month

---

## 🔧 Configuration

### Workflow Presets

Located in `src/types/workflow.types.ts`:

```typescript
export const WORKFLOW_PRESETS = [
  {
    id: 'full_plan',
    name: 'Complete Business Plan',
    skillIds: ['01','02','05','06','07','08','09','10','11','12','13','14','15','16','20']
  },
  {
    id: 'fundraising',
    name: 'Fundraising Package',
    skillIds: ['01','05','06','07','16']
  },
  {
    id: 'gtm',
    name: 'Go-to-Market',
    skillIds: ['05','06','07','08','09','10','14']
  }
];
```

### Custom Agent Selection

```bash
# Run specific agents only
./bin/bizplan orchestrate --skills 05,06,07,16
```

---

## 📊 Output Formats

### JSON (Default)
```bash
./bin/bizplan orchestrate --format json
# → outputs/business-plan-YYYY-MM-DD.json
```

### Markdown
```bash
./bin/bizplan orchestrate --format md  
# → outputs/business-plan-YYYY-MM-DD.md
```

### PDF (Placeholder)
```bash
./bin/bizplan orchestrate --format pdf
# Currently saves as JSON with warning
```

---

## 🧪 Testing

### Run Basic Tests

```bash
# CLI version check
./bin/bizplan version

# Build verification
npm run build

# Basic test suite
./test.sh
```

### Integration Test

```bash
# Test full workflow
npm run test:integration  # (if configured)

# Or manually
./bin/bizplan orchestrate --workflow fundraising
```

---

## 📁 Project Structure

```
bizplan-cli-toolkit/
├── bin/
│   └── bizplan              # CLI executable
├── src/
│   ├── agents/              # 17 implemented agents
│   ├── orchestrator/        # Master + workflow engine
│   ├── protocol/            # Agent communication
│   ├── utils/               # File loader, logger, etc
│   └── types/               # TypeScript definitions
├── templates/               # 24 SKILL JSON specs
├── outputs/                 # Generated business plans
└── tests/                   # Test suites
```

---

## 🐛 Troubleshooting

### "Master config not found"
```bash
# Ensure MASTER template exists
ls templates/00_MASTER*.json

# Copy if missing
cp /path/to/00_MASTER.json templates/
```

### "Agent XX not found"
Check if agent is implemented:
```bash
ls src/agents/*.ts | grep XX
```

If not listed in "What Works" section above, it's not yet implemented.

### Build Errors
```bash
# Clean and rebuild
rm -rf dist/
npm run build
```

---

## 🚀 Deployment Options

### Option A: GitHub + npm

1. **Push to GitHub**
```bash
git remote add origin https://github.com/YOUR_USERNAME/bizplan-cli-toolkit.git
git push -u origin master
```

2. **Publish to npm** (optional)
```bash
npm login
npm publish
```

3. **Install from npm**
```bash
npm install -g bizplan-cli-toolkit
bizplan version
```

### Option B: Docker (Future)

```dockerfile
# Dockerfile (to be created)
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install && npm run build
CMD ["./bin/bizplan"]
```

### Option C: Standalone Binary (Future)

Using `pkg` to create single executable:
```bash
npm install -g pkg
pkg . --targets node18-macos-x64
```

---

## 📝 Usage Examples

### Example 1: Startup Refactor
```bash
# You have an old business plan
./bin/bizplan orchestrate --refactor old-plan.txt

# Output: Structured BP2026 with gaps identified
```

### Example 2: Fundraising Deck
```bash
# Generate fundraising materials
./bin/bizplan orchestrate --workflow fundraising

# Result includes:
# - Pitch deck structure
# - Investment thesis  
# - Term sheet guidance
# - Use of funds
```

### Example 3: Complete Business Plan
```bash
# Full 17-agent workflow
./bin/bizplan orchestrate --workflow full_plan --format md

# Result: 8-section business plan covering:
# - Vision & Strategy
# - Market & Customers
# - Product & Agentic OS
# - Business Model
# - GTM & Growth
# - Fundraising
# - IPO Readiness
```

---

## 🤝 Contributing

This is a production toolkit, but contributions welcome!

1. Fork the repo
2. Create feature branch
3. Implement new agent (follow `base-agent.ts` pattern)
4. Add to `agent-router.ts`
5. Submit PR

---

## 📞 Support

- **Issues**: GitHub Issues
- **Docs**: This file + README.md
- **SKILL Specs**: `templates/*.json`

---

## 📜 License

MIT License - Feel free to use for commercial projects

---

**Current Version**: v0.7  
**Agent Coverage**: 71% (17/24)  
**Status**: Production-ready for most workflows  
**Next Milestone**: v1.0 (100% coverage)
