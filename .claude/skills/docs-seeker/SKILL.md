---
name: docs-seeker
description: "Searching internet for technical documentation using llms.txt standard, GitHub repositories via Repomix, and parallel exploration. Use when user needs: (1) Latest documentation for libraries/frameworks, (2) Documentation in llms.txt format, (3) GitHub repository analysis, (4) Documentation without direct llms.txt support, (5) Multiple documentation sources in parallel"
version: 1.0.0
---

# Documentation Discovery & Analysis

## Overview

This skill enables intelligent discovery and analysis of technical documentation through multiple strategies:

1. **llms.txt-first approach**: Search for standardized AI-friendly documentation
2. **Repository analysis**: Use Repomix to analyze GitHub repositories
3. **Parallel exploration**: Deploy multiple Explorer agents for comprehensive coverage
4. **Fallback research**: Use Researcher agents when other methods unavailable

## Core Workflow

### Phase 1: Initial Discovery

When user requests documentation:

1. **Identify the target**
   - Extract library/framework name from user request
   - Note any version requirements (default: latest)
   - Clarify scope if ambiguous

2. **Search for llms.txt**
   - Use WebSearch to find: `[library name] llms.txt site:[docs domain]`
   - Common patterns:
     - `https://docs.[library].com/llms.txt`
     - `https://[library].dev/llms.txt`
     - `https://[library].io/llms.txt`
   - If found, proceed to Phase 2
   - If not found, proceed to Phase 3

### Phase 2: llms.txt Processing

**When llms.txt contains single URL:**
- Use WebFetch to retrieve content directly
- Extract and present relevant information
- Report findings to user

**When llms.txt contains multiple URLs:**
- **CRITICAL**: Launch multiple Explorer agents in parallel
- One Explorer agent per major documentation section
- Maximum 5 agents in first batch to avoid overwhelming
- Each agent reads assigned URLs and extracts information
- Aggregate findings from all agents
- Present consolidated report

Example parallel launch:
```
Launch 3 Explorer agents simultaneously:
- Agent 1: Read getting-started.md and installation.md
- Agent 2: Read api-reference.md and core-concepts.md
- Agent 3: Read examples.md and best-practices.md
```

### Phase 3: Repository Analysis (No llms.txt)

**Step 1: Find GitHub Repository**
- Use WebSearch: `[library name] github repository`
- Verify it's the official repository
- Note repository URL

**Step 2: Use Repomix**
- Install if not available: `npm install -g repomix`
- Clone repository to temporary location
- Run: `repomix --output repomix-output.xml`
- This packs entire repository into single AI-friendly file

**Step 3: Analyze Output**
- Read repomix-output.xml
- Extract relevant documentation from:
  - README files
  - Documentation directories
  - Code comments and examples
  - Configuration files
- Present findings to user

### Phase 4: Fallback Research

**When no GitHub repository exists:**
- Launch multiple Researcher agents in parallel
- Each researcher focuses on different aspects:
  - Official documentation sites
  - Tutorial articles
  - API references
  - Community guides
  - Stack Overflow discussions
- Aggregate findings
- Present consolidated report

## Parallel Exploration Strategy

**When to use multiple agents:**
- llms.txt contains more than 3 URLs
- Repository has multiple documentation directories
- Need to check multiple versions
- Comprehensive coverage required

**How to launch parallel agents:**

```markdown
Use Task tool with subagent_type=Explore

Example for 5 URLs:
1. Launch all 5 Explore agents in single message
2. Each agent gets specific URLs to read
3. Each agent extracts relevant information
4. Wait for all agents to complete
5. Aggregate results
```

**Agent distribution guidelines:**
- 1-3 URLs: Single Explorer agent
- 4-10 URLs: 3-5 Explorer agents (2-3 URLs each)
- 11+ URLs: 5-7 Explorer agents (prioritize most relevant)

## Repomix Usage

**Installation check:**
```bash
which repomix || npm install -g repomix
```

**Basic usage:**
```bash
# Clone repository
git clone [repo-url] /tmp/docs-analysis
cd /tmp/docs-analysis

# Generate AI-friendly output
repomix --output repomix-output.xml

# Read and analyze
# Use Read tool on repomix-output.xml
```

**Repomix benefits:**
- Entire repository in single file
- Preserves directory structure
- Includes all documentation files
- Optimized for AI consumption
- Handles large repositories efficiently

## Version Handling

**Latest version (default):**
- Search without version specifier
- Use current/latest documentation paths
- Verify documentation date if available

**Specific version:**
- Include version in search: `[library] v[version] llms.txt`
- Check versioned documentation paths:
  - `/v[version]/llms.txt`
  - `/[version]/llms.txt`
  - `/docs/v[version]/llms.txt`
- For repositories: checkout specific tag/branch

## Output Format

Present findings in this structure:

```markdown
# Documentation for [Library] [Version]

## Source
- Method: [llms.txt / Repository / Research]
- URLs: [list of sources]
- Date accessed: [current date]

## Key Information
[Extracted relevant information organized by topic]

## Additional Resources
[Related links, examples, references]

## Notes
[Any limitations, missing information, or caveats]
```

## Error Handling

**llms.txt not accessible:**
- Try alternative domains (.dev, .io, .com)
- Fall back to repository analysis
- Use research as last resort

**Repository not found:**
- Search for official website
- Check package manager registries (npm, PyPI, etc.)
- Use Researcher agents for scattered documentation

**Repomix fails:**
- Check repository size (may be too large)
- Try focusing on /docs or /documentation directory only
- Fall back to manual exploration with Explorer agents

**Multiple conflicting sources:**
- Prioritize official sources
- Note version differences
- Present all findings with source attribution

## Best Practices

1. **Always start with llms.txt search**: Most efficient method
2. **Use parallel agents aggressively**: Faster results, better coverage
3. **Cache findings**: Store repomix-output.xml for reuse
4. **Verify official sources**: Avoid outdated or unofficial documentation
5. **Report methodology**: Tell user which approach was used
6. **Handle versions explicitly**: Don't assume latest if user needs specific version
7. **Aggregate intelligently**: Synthesize information, don't just concatenate
8. **Time management**: Set reasonable timeouts for web operations

## Common Documentation Sources

**Popular llms.txt locations:**
- Astro: https://docs.astro.build/llms.txt
- Next.js: https://nextjs.org/llms.txt
- Remix: https://remix.run/llms.txt
- SvelteKit: https://kit.svelte.dev/llms.txt

**Repository patterns:**
- GitHub: Most common for open source
- GitLab: Some enterprise projects
- Bitbucket: Less common but exists

**Package registries:**
- npm: npmjs.com
- PyPI: pypi.org
- RubyGems: rubygems.org
- Cargo: crates.io

## Tool Selection Guide

**Use WebSearch when:**
- Finding llms.txt URLs
- Locating official documentation sites
- Discovering GitHub repositories

**Use WebFetch when:**
- Reading llms.txt content
- Accessing single documentation pages
- Retrieving specific URLs

**Use Task with Explore when:**
- Multiple URLs to read (3+)
- Need parallel exploration
- Comprehensive documentation coverage

**Use Task with Researcher when:**
- No structured documentation found
- Need diverse sources
- Community knowledge required

**Use Repomix when:**
- GitHub repository available
- Need complete codebase analysis
- Documentation scattered in repository

## Example Workflows

### Example 1: Library with llms.txt

```
User: "Find documentation for Astro"

1. WebSearch: "Astro llms.txt site:docs.astro.build"
2. Found: https://docs.astro.build/llms.txt
3. WebFetch: Read llms.txt
4. Contains 8 URLs
5. Launch 3 Explorer agents in parallel:
   - Agent 1: URLs 1-3
   - Agent 2: URLs 4-6
   - Agent 3: URLs 7-8
6. Aggregate findings
7. Present comprehensive report
```

### Example 2: Library without llms.txt

```
User: "Find documentation for [obscure-library]"

1. WebSearch: "[obscure-library] llms.txt"
2. Not found
3. WebSearch: "[obscure-library] github repository"
4. Found: https://github.com/org/obscure-library
5. Check if Repomix installed
6. Clone repository to /tmp
7. Run repomix --output repomix-output.xml
8. Read repomix-output.xml
9. Extract documentation sections
10. Present findings
```

### Example 3: Multiple versions needed

```
User: "Compare documentation between v1 and v2 of [library]"

1. WebSearch for both versions
2. Launch 2 sets of Explorer agents:
   - Set A: v1 documentation (3 agents)
   - Set B: v2 documentation (3 agents)
3. Each set explores their version in parallel
4. Compare findings
5. Present side-by-side analysis
```

## Performance Optimization

**Minimize sequential operations:**
- Bad: Read URL 1, then URL 2, then URL 3
- Good: Launch 3 Explorer agents simultaneously

**Batch operations:**
- Group related URLs for single agent
- Balance agent workload
- Avoid too many agents (max 7)

**Use caching:**
- Save repomix output for reuse
- Store llms.txt content if frequently accessed
- Cache search results within session

**Fail fast:**
- Set timeouts for web operations
- Move to fallback quickly
- Don't retry failed methods repeatedly

## Limitations

**Cannot handle:**
- Password-protected documentation
- Rate-limited APIs without credentials
- Real-time documentation updates (uses snapshot)
- Interactive documentation (needs manual testing)

**May struggle with:**
- Very large repositories (>1GB)
- Documentation in images/PDFs only
- Non-English documentation (translation needed)
- Scattered documentation across many sites

## Success Criteria

A successful documentation retrieval:
- Finds relevant, accurate information
- Uses most efficient method available
- Completes in reasonable time (<2 minutes for simple cases)
- Provides clear source attribution
- Identifies version/date of documentation
- Notes any limitations or gaps
