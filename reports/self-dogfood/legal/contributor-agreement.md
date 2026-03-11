# Contributor License Agreement (CLA) Review
*Mekong CLI v5.0 | Open Source | March 2026*

## Current State

| Item | Status |
|------|--------|
| CONTRIBUTING.md | Present in repo |
| CODE_OF_CONDUCT.md | Present in repo |
| CLA | Not implemented |
| DCO (Developer Certificate of Origin) | Not implemented |
| CLA bot (GitHub Action) | Not configured |

---

## Do We Need a CLA?

### Arguments For CLA
1. **RaaS commercial model:** We monetize the codebase. Without CLA, contributors retain copyright and could theoretically object to commercial use.
2. **Re-licensing flexibility:** If we ever need to dual-license (MIT + commercial), CLA gives us that right. Without it, we need consent from every contributor.
3. **Patent protection:** Individual CLA can include patent grant, protecting users from contributor patent claims.
4. **Enterprise customers:** Some enterprise buyers require CLA before using OSS dependencies.

### Arguments Against CLA
1. **Friction:** CLA reduces contribution velocity, especially for small fixes. Many developers refuse to sign CLAs.
2. **DCO is lighter:** Linux kernel's DCO (`Signed-off-by:` commit line) provides attribution without a contract.
3. **MIT is already permissive:** The MIT license already allows commercial use. The main gap is re-licensing, not commercial use.
4. **Early stage:** With <10 external contributors, CLA overhead exceeds benefit.

### Recommendation: DCO Now, CLA Later

**Phase 1 (now — pre-100 contributors):** Implement DCO via commit sign-off requirement.
- Zero friction: just add `git commit -s` to contributor workflow
- Provides clear IP chain: "I certify I have the right to submit this code"
- No legal contract required

**Phase 2 (at >100 external contributors or first Enterprise deal):** Add full CLA.
- Use CLA Assistant (free GitHub app)
- Use Apache ICLA template as base
- Consult a lawyer for patent clause

---

## DCO Implementation

Add to CONTRIBUTING.md:

```markdown
## Developer Certificate of Origin

By contributing to Mekong CLI, you agree to the Developer Certificate of Origin (DCO).
All commits must be signed off with your real name and email:

```bash
git commit -s -m "feat: add new command"
# Creates: "Signed-off-by: Your Name <your@email.com>"
```

This certifies that you have the right to submit the contribution under the project's MIT license.
Full DCO text: https://developercertificate.org
```

Add DCO check to GitHub Actions (`.github/workflows/`):

```yaml
name: DCO Check
on: [pull_request]
jobs:
  dco:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: dcoapp/app@latest
```

---

## Full CLA Template (For Future Use)

When ready, use this Individual CLA (ICLA) structure:

### Mekong CLI Individual Contributor License Agreement

**Grant of Copyright License:** You grant Binh Phap Venture Studio a perpetual, worldwide, non-exclusive, no-charge, royalty-free, irrevocable copyright license to reproduce, prepare derivative works of, publicly display, publicly perform, sublicense, and distribute your contributions.

**Grant of Patent License:** You grant a perpetual, worldwide, non-exclusive, no-charge, royalty-free, irrevocable patent license to make, use, sell, offer for sale, import, and otherwise transfer the work.

**Representations:**
- You are legally entitled to grant the above license
- Each contribution is your original creation
- You are not aware of any third-party claims on the contribution

**No Warranty:** Contributions are provided "AS IS" without warranties.

---

## Existing CONTRIBUTING.md Assessment

Present file should be reviewed for:
- [ ] Clear process for submitting PRs
- [ ] Code style requirements (reference `pyproject.toml` formatting tools)
- [ ] Test requirements for PRs (must include tests)
- [ ] DCO sign-off requirement (add)
- [ ] Good first issue guidance (link to labeled issues)
- [ ] Communication channels (Discord, GitHub Discussions)

---

## Corporate CLA (For Enterprise Contributors)

If a company contributes code on behalf of employees, a Corporate CLA (CCLA) is needed in addition to individual ICLAs. Template available from Apache Foundation. Implement when first corporate contributor appears.

---

## Action Items

| Priority | Action | Owner | Timeline |
|----------|--------|-------|----------|
| 1 | Add DCO sign-off to CONTRIBUTING.md | Maintainer | This week |
| 2 | Add DCO GitHub Action workflow | Maintainer | This week |
| 3 | Review existing CONTRIBUTING.md for completeness | Maintainer | This week |
| 4 | Set up CLA Assistant app on GitHub | Maintainer | At 100+ contributors |
| 5 | Draft full ICLA (consult lawyer) | Legal | At first Enterprise deal |
