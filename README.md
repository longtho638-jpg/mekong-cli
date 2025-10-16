# Claude Code Boilerplate

A comprehensive boilerplate template for building professional software projects with **CLI Coding Agents** (**Claude Code** and **Open Code**). This template provides a complete development environment with AI-powered agent orchestration, automated workflows, and intelligent project management.

## What is Claude Code?

**Claude Code** is Anthropic's official CLI tool that brings AI-powered development assistance directly to your terminal. It enables natural language interaction with your codebase and provides intelligent automation for common development tasks.

- [Claude Code](https://claude.com/product/claude-code)
- [Docs](https://docs.claude.com/en/docs/claude-code/overview)

**Open Code CLI Coding Agents** extend Claude Code with specialized AI agents that handle specific aspects of software development - from planning and research to testing and documentation. This creates a collaborative AI development team that works alongside human developers.

- [Open Code](https://opencode.ai/)
- [Docs](https://opencode.ai/docs)

## Related Projects & Directories

- `claudekit` - Website of ClaudeKit
  - Directory: `../claudekit`
  - Repo: https://github.com/mrgoonie/claudekit
- `claudekit-marketing` - Marketing Kit repository
  - Directory: [coming soon]
  - Repo: [coming soon]
- `claudekit-cli` - CLI tool for quick project setup
  - Directory: `../claudekit-cli`
  - Repo: https://github.com/mrgoonie/claudekit-cli
- `claudekit-docs` - Public documentation repository: https://docs.claudekit.cc
  - Directory: `../claudekit-docs`
  - Repo: https://github.com/mrgoonie/claudekit-docs

## Key Benefits

### 🚀 Accelerated Development
- **AI-Powered Planning**: Automated technical planning and architecture design
- **Intelligent Code Generation**: Context-aware code creation and modification
- **Automated Testing**: Comprehensive test generation and execution
- **Smart Documentation**: Synchronized docs that evolve with your code

### 🎯 Enhanced Quality
- **Multi-Agent Code Review**: Specialized agents for security, performance, and standards
- **Automated Quality Assurance**: Continuous testing and validation
- **Best Practices Enforcement**: Built-in adherence to coding standards
- **Security-First Development**: Proactive security analysis and recommendations

### 🏗️ Structured Workflow
- **Agent Orchestration**: Coordinated AI agents working in parallel and sequential workflows
- **Task Management**: Automated project tracking and progress monitoring
- **Documentation Sync**: Always up-to-date technical documentation
- **Clean Git Workflow**: Professional commit messages and branch management

## Quick Start

### Prerequisites
- [Claude Code](https://claude.ai/code) installed and configured
- Git for version control
- Node.js 18+ (or your preferred runtime)

## Release Information

This project uses automated releases with semantic versioning:

- **Automatic Releases**: Every push to `main` branch triggers a new release if there are releasable changes
- **Semantic Versioning**: Version numbers follow [SemVer](https://semver.org/) (MAJOR.MINOR.PATCH)
- **Conventional Commits**: Use [Conventional Commits](https://conventionalcommits.org/) format for automatic changelog generation
- **GitHub Releases**: Releases are automatically created on GitHub with generated changelogs
- **NPM Publishing**: Optional - can be enabled by setting `npmPublish: true` in `.releaserc.json` and adding NPM_TOKEN secret

### Commit Message Format

```bash
# Features (minor version bump)
feat: add new authentication system

# Bug fixes (patch version bump)
fix: resolve memory leak in user service

# Breaking changes (major version bump)
feat!: redesign API endpoints
# or
feat: redesign API endpoints

BREAKING CHANGE: API endpoints have been redesigned

# Other types (patch version bump)
docs: update installation guide
refactor: simplify database queries
test: add integration tests
ci: update GitHub Actions workflow
```

### Setup
1. **Use this template**:
   ```bash
   # Create new project from this template
   git clone https://github.com/your-username/claude-code-template.git my-project
   cd my-project
   ```

2. **Configure for your repository**:
   ```bash
   # Update package.json with your repository URL
   nano package.json  # Update repository.url field
   
   # Update project details
   nano CLAUDE.md  # Customize for your project
   nano README.md  # Update project information
   ```

3. **Setup GitHub repository secrets** (optional - for NPM publishing):
   - Go to your GitHub repository → Settings → Secrets and variables → Actions
   - Add `NPM_TOKEN`: Your NPM authentication token (only if you want to publish to NPM)
   - Set `npmPublish: true` in `.releaserc.json` to enable NPM publishing
   - The `GITHUB_TOKEN` is automatically provided by GitHub Actions

3. **Start development**:
   ```bash
   # Begin with Claude Code
   claude

   # Or use specific commands
   /plan "implement user authentication"
   /cook "add database integration"
   ```

## Project Structure

```
├── .claude/                 # Claude Code configuration
│   ├── CLAUDE.md           # Global development instructions
│   └── send-discord.sh     # Notification script
├── .opencode/              # Open Code CLI agent definitions
│   ├── agent/              # Specialized agent configurations
│   │   ├── planner.md      # Technical planning agent
│   │   ├── researcher.md   # Research and analysis agent
│   │   ├── tester.md       # Testing and validation agent
│   │   ├── debugger.md     # Issue analysis agent
│   │   ├── code-reviewer.md# Code quality agent
│   │   ├── docs-manager.md # Documentation agent
│   │   ├── git-manager.md  # Version control agent
│   │   └── project-manager.md # Progress tracking agent
│   └── command/            # Custom command definitions
├── docs/                   # Project documentation
│   ├── codebase-summary.md # Auto-generated codebase overview
│   ├── code-standards.md   # Development standards
│   ├── project-overview-pdr.md # Product requirements
│   └── development-roadmap.md  # Project roadmap
├── plans/                  # Implementation plans and reports
│   ├── templates/          # Plan templates
│   └── reports/            # Agent-to-agent communication
├── CLAUDE.md              # Project-specific Claude instructions
├── AGENTS.md              # Agent coordination guidelines
└── README.md              # This file
```

## The AI Agent Team

This boilerplate includes specialized AI agents that work together to deliver high-quality software:

### 🎯 Core Development Agents

#### **Planner Agent**
- Researches technical approaches and best practices
- Creates comprehensive implementation plans
- Analyzes architectural trade-offs
- Spawns multiple researcher agents for parallel investigation

#### **Researcher Agent**
- Investigates specific technologies and frameworks
- Analyzes existing solutions and patterns
- Provides technical recommendations
- Supports the planner with detailed findings

#### **Tester Agent**
- Generates comprehensive test suites
- Validates functionality and performance
- Ensures cross-platform compatibility
- Reports on test coverage and quality metrics

### 🔍 Quality Assurance Agents

#### **Code Reviewer Agent**
- Performs automated code quality analysis
- Enforces coding standards and conventions
- Identifies security vulnerabilities
- Provides improvement recommendations

#### **Debugger Agent**
- Analyzes application logs and error reports
- Diagnoses performance bottlenecks
- Investigates CI/CD pipeline issues
- Provides root cause analysis

### 📚 Documentation & Management Agents

#### **Docs Manager Agent**
- Maintains synchronized technical documentation
- Updates API documentation automatically
- Ensures documentation accuracy
- Manages codebase summaries

#### **Git Manager Agent**
- Creates clean, conventional commit messages
- Manages branching and merge strategies
- Handles version control workflows
- Ensures professional git history

#### **Project Manager Agent**
- Tracks development progress and milestones
- Updates project roadmaps and timelines
- Manages task completion verification
- Maintains project health metrics

## Agent Orchestration Patterns

### Sequential Chaining
Use when tasks have dependencies:
```bash
# Planning → Implementation → Testing → Review
/plan "implement user dashboard"
# Wait for plan completion, then:
/cook "follow the implementation plan"
# After implementation:
/test "validate dashboard functionality"
# Finally:
/review "ensure code quality standards"
```

### Parallel Execution
Use for independent tasks:
```bash
# Multiple researchers exploring different approaches
planner agent spawns:
- researcher (database options)
- researcher (authentication methods)
- researcher (UI frameworks)
# All report back to planner simultaneously
```

### Context Management
- Agents communicate through file system reports
- Context is preserved between agent handoffs
- Fresh context prevents conversation degradation
- Essential information is documented in markdown

## Development Workflow

### 1. Feature Development
```bash
# Start with planning
/plan "add real-time notifications"

# Research phase (automatic)
# Multiple researcher agents investigate approaches

# Implementation
/cook "implement notification system"

# Quality assurance
/test
/review

# Documentation update
/docs

# Project tracking
/watzup  # Check project status
```

### 2. Bug Fixing
```bash
# Analyze the issue
/debug "investigate login failures"

# Create fix plan
/plan "resolve authentication bug"

# Implement solution
/fix "authentication issue"

# Validate fix
/test
```

### 3. Documentation Management
```bash
# Update documentation
/docs

# Generate codebase summary
repomix  # Creates ./docs/codebase-summary.md

# Review project status
/watzup
```

## Configuration Files

### CLAUDE.md
Project-specific instructions for Claude Code. Customize this file to define:
- Project architecture guidelines
- Development standards and conventions
- Agent coordination protocols
- Specific workflows for your project

### .opencode/agent/*.md
Individual agent configurations defining:
- Agent expertise and responsibilities
- Interaction patterns
- Output formats
- Quality standards

### plans/templates/*.md
Reusable templates for:
- Feature implementation plans
- Bug fix procedures
- Refactoring strategies
- Architecture decisions

## Model Context Protocol (MCP)

### Context7
```bash
export UPSTASH_API_KEY="..."
claude mcp add context7 -s user -- npx -y @upstash/context7-mcp --api-key $UPSTASH_API_KEY
```

### Human

```bash
export GOOGLE_GEMINI_API_KEY="..."
claude mcp add-json human -s user '{"command": "npx", "args": ["@goonnguyen/human-mcp@latest", "-e", "GOOGLE_GEMINI_API_KEY"], "env": { "GOOGLE_GEMINI_API_KEY": $GOOGLE_GEMINI_API_KEY }}'
```

## Best Practices

### Development Principles
- **YANGI**: You Aren't Gonna Need It - avoid over-engineering
- **KISS**: Keep It Simple, Stupid - prefer simple solutions
- **DRY**: Don't Repeat Yourself - eliminate code duplication

### Code Quality
- All code changes go through automated review
- Comprehensive testing is mandatory
- Security considerations are built-in
- Performance optimization is continuous

### Documentation
- Documentation evolves with code changes
- API docs are automatically updated
- Architecture decisions are recorded
- Codebase summaries are regularly refreshed

### Git Workflow
- Clean, conventional commit messages
- Professional git history
- No AI attribution in commits
- Focused, atomic commits

## Usage Examples

### Starting a New Feature
```bash
# Research and plan
claude "I need to implement user authentication with OAuth2"
# Planner agent creates comprehensive plan

# Follow the plan
claude "Implement the authentication plan"
# Implementation follows the detailed plan

# Ensure quality
claude "Review and test the authentication system"
# Testing and code review agents validate the implementation
```

### Debugging Issues
```bash
# Investigate problem
claude "Debug the slow database queries"
# Debugger agent analyzes logs and performance

# Create solution
claude "Optimize the identified query performance issues"
# Implementation follows debugging recommendations

# Validate fix
claude "Test query performance improvements"
# Tester agent validates the optimization
```

### Project Maintenance
```bash
# Check project health
claude "What's the current project status?"
# Project manager provides comprehensive status

# Update documentation
claude "Sync documentation with recent changes"
# Docs manager updates all relevant documentation

# Plan next sprint
claude "Plan the next development phase"
# Planner creates detailed roadmap for upcoming work
```

## Advanced Features

### Multi-Project Support
- Manage multiple repositories simultaneously
- Shared agent configurations across projects
- Consistent development patterns

### Custom Agent Creation
- Define project-specific agents
- Extend existing agent capabilities
- Create domain-specific expertise

### Integration Capabilities
- Discord notifications for project updates
- GitHub Actions integration
- CI/CD pipeline enhancement

## Customization Guide

### 1. Project Setup
- Update `CLAUDE.md` with your project specifics
- Modify agent configurations in `.opencode/agent/`
- Customize plan templates in `plans/templates/`

### 2. Agent Specialization
- Add domain-specific knowledge to agents
- Create custom agents for unique requirements
- Configure agent interaction patterns

### 3. Workflow Optimization
- Define project-specific commands
- Create shortcuts for common tasks
- Establish team coding standards

## Contributing

1. Fork this repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Follow the agent orchestration workflow
4. Ensure all tests pass and documentation is updated
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Learn More

### Claude Code Resources
- [Claude Code Documentation](https://claude.ai/code)
- [Open Code CLI Documentation](https://docs.opencode.ai)
- [Agent Development Guide](https://docs.opencode.ai/agents)

### Community
- [Claude Code Community](https://discord.gg/claude-code)
- [Discussion Forum](https://github.com/anthropic/claude-code/discussions)
- [Example Projects](https://github.com/topics/claude-code)

### Support
- [Issue Tracker](https://github.com/anthropic/claude-code/issues)
- [Feature Requests](https://github.com/anthropic/claude-code/discussions/categories/ideas)
- [Documentation](https://docs.claude.ai/code)

---

**Start building with AI-powered development today!** This boilerplate provides everything you need to create professional software with intelligent agent assistance.