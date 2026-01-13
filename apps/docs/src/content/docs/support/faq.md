---
title: "Frequently Asked Questions"
description: "Common questions about AgencyOS, from getting started to advanced usage"
section: support
order: 1
published: true
ai_executable: true
---

# Frequently Asked Questions

---

## 🤖 Quick Execute

```
Execute: https://agencyos.network/docs/support/faq
```



Common questions about AgencyOS, from getting started to advanced usage.

## Getting Started

### Q: What is AgencyOS?
**A:** AgencyOS is a production-grade framework that extends AgencyOS CLI with specialized AI agents, slash commands, and reusable skills. It transforms AgencyOS CLI from a general-purpose assistant into a focused engineering toolkit.

### Q: How is AgencyOS different from AgencyOS CLI?
**A:** AgencyOS CLI provides the base AI assistant, while AgencyOS adds:
- **14 specialized agents** (planner, tester, debugger, etc.)
- **30+ slash commands** for common development tasks
- **45 built-in skills** for specific technologies
- **Multi-agent workflows** that collaborate on complex tasks

### Q: Do I need to pay for AgencyOS CLI separately?
**A:** Yes, AgencyOS requires an active AgencyOS CLI subscription. AgencyOS is a one-time purchase ($99) that enhances your existing AgencyOS CLI subscription.

### Q: Can I try AgencyOS before buying?
**A:** Yes! We offer a 30-day money-back guarantee. Try AgencyOS risk-free for 30 days, and if you're not satisfied, get a full refund.

## Installation and Setup

### Q: How do I install AgencyOS?
**A:**
```bash
# Install AgencyOS CLI
npm install -g @mekong/cli

# Initialize in your project
mekong init
```

### Q: Does AgencyOS replace my existing setup?
**A:** No. AgencyOS enhances your existing workflow:
- Keeps your current AgencyOS CLI setup
- Extends rather than replaces functionality
- Works with your existing projects
- Preserves your custom commands

### Q: What are the system requirements?
**A:**
- Node.js 16+
- AgencyOS CLI subscription
- Git (required for version control)
- Any modern OS (Windows, macOS, Linux)

### Q: Can I use AgencyOS with existing projects?
**A:** Yes! AgencyOS works with existing projects:
```bash
cd your-existing-project
mekong init
# Analyzes your project and activates relevant skills
```

## Commands and Usage

### Q: What's the most common workflow?
**A:** The feature development workflow:
```bash
/plan "add user authentication with OAuth"  # Plan the feature
/code @plans/user-auth.md                  # Implement the plan
/fix:test                                  # Test and fix issues
/git:cm                                    # Commit changes
```

### Q: How do I fix bugs with AgencyOS?
**A:** Use the debugging workflow:
```bash
/debug "login button not working"          # Investigate issue
/fix:hard "session timeout problem"        # Implement fix
/fix:test                                  # Verify fix works
/git:cm                                    # Commit solution
```

### Q: Can I create custom commands?
**A:** Yes! AgencyOS supports custom commands:
```bash
/skill:create "My company's React patterns"
# Creates reusable skill for your team's conventions
```

### Q: How do agents work together?
**A:** Agents collaborate through shared context:
- **Planner** creates implementation plan
- **Researcher** analyzes best practices
- **Developer** writes the code
- **Tester** validates functionality
- **Code Reviewer** ensures quality

## Skills and Capabilities

### Q: What technologies does AgencyOS support?
**A:** AgencyOS supports 45+ technologies out of the box:
- **Frontend**: Next.js, React, Vue, Angular, Tailwind, shadcn/ui
- **Backend**: Node.js, Python, Go, Rust, PostgreSQL, MongoDB
- **Cloud**: AWS, GCP, Azure, Cloudflare Workers, Docker
- **Auth**: Better Auth, OAuth2, JWT, session management
- **Payment**: Stripe, Shopify, Polar, SePay

### Q: How do skills work?
**A:** Skills automatically activate based on your project:
1. AgencyOS scans your project files
2. Detects technologies (e.g., `next.config.js` → Next.js skill)
3. Injects relevant knowledge into agent context
4. Agents use best practices for detected technologies

### Q: Can I create custom skills?
**A:** Yes! Create skills for your specific needs:
```bash
/skill:create "Our GraphQL conventions"
/skill:create "Company's testing patterns"
/skill:create "Internal API documentation"
```

## Performance and Quality

### Q: How much faster is AgencyOS?
**A:** Based on user data:
- **10x faster** feature development
- **80% fewer bugs** with automated testing
- **90% reduction** in code review time
- **75% faster** bug resolution

### Q: Is the generated code production-ready?
**A:** Yes. AgencyOS generates production-quality code:
- Follows security best practices
- Includes comprehensive error handling
- Has automated test coverage
- Meets performance standards
- Includes proper documentation

### Q: How does AgencyOS ensure code quality?
**A:** Multiple quality assurance layers:
- **Code Reviewer Agent** performs security and performance analysis
- **Tester Agent** writes comprehensive tests
- **Debugger Agent** validates implementations
- **Skills provide** proven patterns and best practices

## Troubleshooting

### Q: AgencyOS isn't detecting my technology stack
**A:** Try these solutions:
```bash
/skill:refresh    # Refresh skill detection
/debug "project analysis"  # Analyze project structure
mekong doctor  # Check system health
```

### Q: Commands are taking too long
**A:** Performance optimization tips:
- Use `.claudeignore` to exclude large directories
- Run `/debug "performance issues"` to identify bottlenecks
- Consider splitting large tasks into smaller ones

### Q: I keep hitting Claude's rate limits. What can I do?
**A:** Install [CCS (AgencyOS CLI Switch)](/docs/tools/ccs) to:
- **Switch accounts instantly:** Use multiple Claude accounts without downtime
- **Optimize costs:** Delegate simple tasks to GLM/Kimi (81% cheaper)
- **Parallel workflows:** Run multiple sessions simultaneously
- **Keep momentum:** Never lose context due to rate limits

### Q: Generated code has errors
**A:** Quick fixes:
```bash
/fix:test          # Run tests and fix issues
/fix:hard          # Use multi-agent debugging
/debug "analyze generated code"  # Investigate specific issues
```

## Pricing and Licensing

### Q: How much does AgencyOS cost?
**A:** AgencyOS is a one-time purchase of $99:
- Lifetime access to all features
- All future updates included
- 30-day money-back guarantee
- No monthly fees or subscriptions

### Q: Are there any ongoing costs?
**A:** No ongoing costs for AgencyOS itself. You only need:
- AgencyOS one-time purchase ($99)
- AgencyOS CLI subscription (separate)

### Q: What's included in the price?
**A:** Everything:
- 14 specialized AI agents
- 30+ slash commands
- 45 built-in skills
- All future updates and features
- Community support
- Documentation and tutorials

### Q: Do you offer team licenses?
**A:** Yes! We offer team and enterprise licenses:
- Small teams (5-10 users): 20% discount
- Large teams (10+ users): Custom pricing
- Enterprise: Custom features and support

## Integration and Workflow

### Q: Can AgencyOS work with my existing CI/CD?
**A:** Yes! AgencyOS integrates with:
- GitHub Actions
- GitLab CI/CD
- Jenkins
- CircleCI
- Any standard Git workflow

### Q: How does AgencyOS handle version control?
**A:** AgencyOS includes Git management:
- Professional commit messages
- Conventional commit format
- Automated branching strategies
- Pull request creation
- Merge conflict resolution

### Q: Can I use AgencyOS with team workflows?
**A:** Absolutely! AgencyOS enhances team collaboration:
- Shared skill libraries
- Consistent code patterns across team
- Automated documentation
- Standardized workflows
- Knowledge sharing through custom skills

## Advanced Usage

### Q: Can I extend AgencyOS with custom agents?
**A:** While you can't create new agent types, you can:
- Create custom skills that modify agent behavior
- Use workflow patterns to combine agents
- Extend functionality through custom commands

### Q: How do I optimize AgencyOS for large projects?
**A:** Best practices for large codebases:
```bash
# Create .claudeignore file
echo "node_modules/\ndist/\nbuild/\ncoverage/" > .claudeignore

# Use specific focus areas
/cook "optimize user authentication flow" --scope auth

# Regular maintenance
/docs:update "keep documentation current"
/fix:ci "maintain CI/CD health"
```

### Q: Can AgencyOS work with microservices?
**A:** Yes! AgencyOS handles microservices:
- Service discovery and analysis
- Inter-service communication patterns
- Distributed system debugging
- Microservice testing strategies
- Deployment automation

## Support and Community

### Q: How do I get help?
**A:** Multiple support channels:
- [Discord Community](https://agencyos.network/discord) - Real-time help
- [GitHub Issues](https://github.com/longtho638-jpg/agencyos/issues) - Bug reports
- [Documentation](/docs) - Complete reference
- [Email Support](mailto:support@agencyos.network) - Direct assistance

### Q: How can I contribute to AgencyOS?
**A:** We welcome contributions:
- Share custom skills with the community
- Report bugs and suggest features
- Improve documentation
- Help others in Discord
- Create tutorials and examples

### Q: How often is AgencyOS updated?
**A:** Regular update schedule:
- Major features: Quarterly
- Bug fixes: Monthly
- Security patches: As needed
- New skills: Bi-weekly

## Still Have Questions?

### Q: Where can I find more information?
**A:** Additional resources:
- [Complete Documentation](/docs)
- [Getting Started Guide](/docs/getting-started)
- [Workflow Examples](/docs/workflows)
- [Discord Community](https://agencyos.network/discord)
- [Blog](https://agencyos.network/blog)

### Q: Can I talk to a human?
**A:** Yes! Human support available:
- Discord community (real-time chat)
- Email support@agencyos.network
- Enterprise customers get dedicated support
- Office hours for community calls

---

**Don't see your question here?** Ask in our [Discord community](https://agencyos.network/discord) or [open an issue](https://github.com/longtho638-jpg/agencyos/issues). We're here to help!

---

## 🏯 Binh Pháp Alignment

> **虛實篇** (Hư Thực) - Clarity - Common questions

### Zero-Effort Commands

| Gõ lệnh | Auto-execute |
|---------|--------------|
| `/help` | Tự tìm câu trả lời |
| `/debugger` | Tự fix issues |

📖 [Xem tất cả Commands](/docs/commands)
