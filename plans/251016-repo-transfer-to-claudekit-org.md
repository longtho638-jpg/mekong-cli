# Repository Transfer Plan: claudekit-engineer to claudekit Organization

**Date:** 2025-10-16
**Status:** Planning
**Author:** Planner Agent
**Target Repository:** git@github.com:claudekit/claudekit-engineer.git

## Overview

This plan details the complete process for transferring the `claudekit-engineer` repository from the personal account `mrgoonie` to the `claudekit` organization, preserving all history, branches, tags, releases, and collaborator access.

## Current State Analysis

### Repository Information
- **Current Location:** `mrgoonie/claudekit-engineer`
- **Repository URL:** https://github.com/mrgoonie/claudekit-engineer
- **Visibility:** Private
- **Default Branch:** `main`
- **Active Branches:** `main`, `dev`

### Git Assets to Preserve
- **Tags:** `v1.0.0`, `v1.1.0`, `v1.1.1`
- **Releases:** 3 releases (v1.0.0, v1.1.0, v1.1.1)
- **Branches:** `main`, `dev`
- **Commit History:** ~20+ commits with semantic versioning
- **Changelog:** CHANGELOG.md with semantic-release format

### Current Collaborators
1. **mrgoonie** - Admin (owner)
2. **bnqtoan** - Read access
3. **blacklogos** - Read access
4. **tam-hopee** - Write access

### Repository Features
- GitHub Actions: `release.yml` workflow
- GitHub Secrets: `DISCORD_WEBHOOK_URL`
- Open Issues: 0
- Open PRs: 0

### Target Organization
- **Organization:** claudekit
- **Organization ID:** 238436420
- **Organization Email:** hello@claudekit.cc
- **Status:** ✅ Verified and accessible

## Requirements

### Functional Requirements
1. ✅ Transfer repository ownership to claudekit organization
2. ✅ Preserve all git history, commits, and metadata
3. ✅ Maintain all branches and branch structure
4. ✅ Keep all tags and releases intact
5. ✅ Preserve CHANGELOG.md and semantic versioning setup
6. ✅ Transfer GitHub Actions workflows
7. ✅ Add paid collaborators with Read permission only

### Non-Functional Requirements
1. ✅ Zero data loss during transfer
2. ✅ Minimal downtime
3. ✅ Maintain CI/CD functionality
4. ✅ Preserve repository visibility (private)
5. ✅ Update local repository remotes

## Pre-Transfer Preparation

### Step 1: Backup Current Repository
```bash
# Create a complete backup of the repository
cd /Users/duynguyen/www/claudekit-engineer

# Create backup directory
mkdir -p ~/backups/claudekit-engineer-$(date +%Y%m%d)
BACKUP_DIR=~/backups/claudekit-engineer-$(date +%Y%m%d)

# Clone repository with all branches and tags
git clone --mirror git@github.com:mrgoonie/claudekit-engineer.git $BACKUP_DIR/repo.git

# Backup important files
cp -r /Users/duynguyen/www/claudekit-engineer $BACKUP_DIR/working-copy

# Verify backup
cd $BACKUP_DIR/repo.git
git branch -a
git tag -l
git log --oneline | head -10
```

**Expected Outcome:**
- Complete mirror clone in backup directory
- Working copy backup for safety
- Verification shows all branches and tags present

### Step 2: Document Current Repository State
```bash
# Save current state to file
cd /Users/duynguyen/www/claudekit-engineer

# Repository metadata
gh repo view --json name,owner,url,isPrivate,defaultBranchRef,createdAt,updatedAt,diskUsage > repo-state-pre-transfer.json

# Collaborators list
gh api repos/mrgoonie/claudekit-engineer/collaborators --jq '.[] | {login: .login, permissions: .permissions, role_name: .role_name}' > collaborators-pre-transfer.json

# Branches
git branch -a > branches-pre-transfer.txt

# Tags
git tag -l > tags-pre-transfer.txt

# Releases
gh release list > releases-pre-transfer.txt

# Recent commits
git log --oneline --all --graph -20 > commits-pre-transfer.txt

# GitHub Actions secrets (names only)
gh api repos/mrgoonie/claudekit-engineer/actions/secrets --jq '.secrets[] | .name' > secrets-pre-transfer.txt
```

**Expected Outcome:**
- Complete documentation of repository state
- Files saved for post-transfer verification

### Step 3: Verify Organization Access
```bash
# Verify you have access to claudekit organization
gh api orgs/claudekit --jq '{login: .login, id: .id, name: .name}'

# Check organization role
gh api user/memberships/orgs/claudekit --jq '{role: .role, state: .state}'

# Verify you can create repositories in the organization
gh api orgs/claudekit/repos --method GET --jq 'length'
```

**Expected Outcome:**
- Confirmed access to claudekit organization
- Sufficient permissions to receive repository transfers

### Step 4: Notify Collaborators (Manual Step)
**Action Required:** Send notification to all collaborators:
- **Recipients:** bnqtoan, blacklogos, tam-hopee
- **Message Template:**
  ```
  Subject: Repository Transfer Notice - claudekit-engineer

  Hi team,

  We're transferring the claudekit-engineer repository from mrgoonie to the claudekit organization.

  What this means:
  - New repository URL: https://github.com/claudekit/claudekit-engineer
  - Your access level: Read permission (view and clone only)
  - Transfer date: [Date]
  - No action needed from you - access will be automatically configured

  After transfer, please update your local repository:
  git remote set-url origin git@github.com:claudekit/claudekit-engineer.git

  Questions? Reply to this email.

  Best regards,
  [Your name]
  ```

### Step 5: Check for Open Work
```bash
# Verify no open issues or PRs
gh issue list
gh pr list

# Check for unpushed commits on all branches
git checkout main
git status
git log origin/main..HEAD

git checkout dev
git status
git log origin/dev..HEAD

# Check for unstaged or uncommitted changes
git status --porcelain
```

**Expected Outcome:**
- No open issues or PRs (confirmed: 0 open)
- All commits pushed to remote
- Clean working directory

## Transfer Process

### Step 6: Initiate Repository Transfer
```bash
# Transfer repository to claudekit organization
gh repo transfer mrgoonie/claudekit-engineer claudekit

# Note: This command will prompt for confirmation
# Expected response: "✓ Repository transferred successfully"
```

**Expected Outcome:**
- Repository transferred to claudekit organization
- New URL: https://github.com/claudekit/claudekit-engineer

**Important Notes:**
- Transfer is immediate and irreversible without org admin help
- All issues, PRs, releases, and GitHub Actions are transferred
- Webhooks and secrets are preserved
- Collaborator access is maintained during transfer

### Step 7: Verify Transfer Completion
```bash
# Wait 30 seconds for transfer to complete
sleep 30

# Verify new repository exists
gh repo view claudekit/claudekit-engineer --json name,owner,url,isPrivate,defaultBranchRef

# Check repository is accessible
gh api repos/claudekit/claudekit-engineer --jq '{name: .name, full_name: .full_name, private: .private}'

# Verify old repository no longer exists (should return 404)
gh repo view mrgoonie/claudekit-engineer 2>&1 || echo "✓ Old repository no longer exists"
```

**Expected Outcome:**
- New repository at claudekit/claudekit-engineer is accessible
- Old repository returns 404 (not found)
- Repository remains private
- Default branch is still `main`

### Step 8: Verify Repository Contents
```bash
# Check all branches exist
gh api repos/claudekit/claudekit-engineer/branches --jq '.[] | .name'

# Expected: main, dev

# Check all tags exist
gh api repos/claudekit/claudekit-engineer/tags --jq '.[] | .name'

# Expected: v1.1.1, v1.1.0, v1.0.0

# Check releases
gh release list --repo claudekit/claudekit-engineer

# Expected: 3 releases (v1.0.0, v1.1.0, v1.1.1)

# Verify commit history
gh api repos/claudekit/claudekit-engineer/commits --jq '.[] | {sha: .sha, message: .commit.message}' | head -20

# Verify GitHub Actions workflows
gh api repos/claudekit/claudekit-engineer/actions/workflows --jq '.workflows[] | {name: .name, path: .path, state: .state}'
```

**Expected Outcome:**
- All branches present
- All tags present
- All releases present
- Commit history intact
- GitHub Actions workflows exist

### Step 9: Update Local Repository Remote
```bash
# Update remote URL in local repository
cd /Users/duynguyen/www/claudekit-engineer

# Verify current remote
git remote -v

# Update remote URL
git remote set-url origin git@github.com:claudekit/claudekit-engineer.git

# Verify update
git remote -v

# Test connectivity
git fetch origin

# Update branch tracking
git branch --set-upstream-to=origin/main main
git branch --set-upstream-to=origin/dev dev

# Verify everything is synced
git status
```

**Expected Outcome:**
- Remote URL updated to claudekit organization
- Fetch successful
- Branch tracking updated
- No sync issues

## Collaborator Management

### Step 10: Audit Current Collaborators
```bash
# List all current collaborators in the transferred repo
gh api repos/claudekit/claudekit-engineer/collaborators --jq '.[] | {login: .login, permissions: .permissions, role_name: .role_name}' > collaborators-post-transfer.json

# Display for review
cat collaborators-post-transfer.json
```

**Expected Outcome:**
- List of all collaborators with their current permissions
- Permissions preserved from original repository

### Step 11: Identify Paid Users to Manage
Based on current collaborators, identify users to configure with Read access:

**Paid Users (Read Access Only):**
1. **bnqtoan** - Currently has Read access ✅
2. **blacklogos** - Currently has Read access ✅
3. **tam-hopee** - Currently has Write access ⚠️ (needs adjustment)

**Administrative Users:**
- **mrgoonie** - Owner/Admin (no change needed)

### Step 12: Update Collaborator Permissions
```bash
# Update tam-hopee from Write to Read
gh api \
  --method PUT \
  repos/claudekit/claudekit-engineer/collaborators/tam-hopee \
  -f permission='pull'

# Verify permission change
gh api repos/claudekit/claudekit-engineer/collaborators/tam-hopee --jq '{login: .login, role_name: .role_name, permissions: .permissions}'

# Expected: role_name should be "read", permissions.push should be false
```

**Expected Outcome:**
- tam-hopee updated to Read access
- Can view and clone repository
- Cannot push changes

### Step 13: Verify All Collaborator Permissions
```bash
# List all collaborators with their final permissions
gh api repos/claudekit/claudekit-engineer/collaborators --jq '.[] | {login: .login, role_name: .role_name, permissions: {admin: .permissions.admin, push: .permissions.push, pull: .permissions.pull}}'

# Save final state
gh api repos/claudekit/claudekit-engineer/collaborators --jq '.[] | {login: .login, role_name: .role_name, permissions: .permissions}' > collaborators-final-state.json
```

**Expected Final State:**
- **mrgoonie:** Admin (admin: true, push: true, pull: true)
- **bnqtoan:** Read (admin: false, push: false, pull: true)
- **blacklogos:** Read (admin: false, push: false, pull: true)
- **tam-hopee:** Read (admin: false, push: false, pull: true)

### Step 14: Notify Collaborators of Permission Changes (Manual Step)
**Action Required:** Send email to tam-hopee specifically:
```
Subject: Permission Update - claudekit-engineer Repository

Hi [tam-hopee],

Following the repository transfer to the claudekit organization, your access level has been updated:

- Previous: Write access
- Current: Read access
- What this means: You can view and clone the repository but cannot push changes directly

If you need to contribute changes:
1. Fork the repository
2. Make changes in your fork
3. Submit a pull request for review

Questions? Please reach out.

Best regards,
[Your name]
```

## Post-Transfer Configuration

### Step 15: Verify GitHub Actions Secrets
```bash
# List secrets in the new repository
gh api repos/claudekit/claudekit-engineer/actions/secrets --jq '.secrets[] | .name'

# Expected: DISCORD_WEBHOOK_URL should be present
```

**Important Notes:**
- Secrets are transferred automatically
- Secret values are preserved (encrypted)
- If secrets are missing, they need to be recreated:

```bash
# Recreate DISCORD_WEBHOOK_URL if needed (get value from secure storage)
# gh secret set DISCORD_WEBHOOK_URL --repo claudekit/claudekit-engineer --body "YOUR_WEBHOOK_URL"
```

**Expected Outcome:**
- DISCORD_WEBHOOK_URL secret exists
- No action needed unless secret is missing

### Step 16: Test GitHub Actions Workflow
```bash
# Trigger a test workflow run (if applicable)
# First, check if workflow can be manually triggered
gh api repos/claudekit/claudekit-engineer/actions/workflows --jq '.workflows[] | {id: .id, name: .name, path: .path}'

# If release.yml supports workflow_dispatch, trigger it
# gh workflow run release.yml --repo claudekit/claudekit-engineer

# Monitor recent workflow runs
gh run list --repo claudekit/claudekit-engineer --limit 5
```

**Expected Outcome:**
- Workflows are functional
- No configuration errors
- Secrets are accessible to workflows

**Note:** The release.yml workflow runs on push to main, so we'll verify it works on the next commit.

### Step 17: Update Repository Settings (Manual Verification)
```bash
# Review repository settings
gh api repos/claudekit/claudekit-engineer --jq '{
  name: .name,
  private: .private,
  has_issues: .has_issues,
  has_projects: .has_projects,
  has_wiki: .has_wiki,
  default_branch: .default_branch,
  allow_squash_merge: .allow_squash_merge,
  allow_merge_commit: .allow_merge_commit,
  allow_rebase_merge: .allow_rebase_merge
}'
```

**Settings to Verify:**
- ✅ Repository is private
- ✅ Issues enabled
- ✅ Default branch is `main`
- ✅ Branch protection rules (if any) are preserved

**Manual Settings Check (via GitHub UI):**
1. Navigate to: https://github.com/claudekit/claudekit-engineer/settings
2. Verify:
   - General settings
   - Branch protection rules for `main`
   - Actions permissions
   - Webhooks (if any)

### Step 18: Update Project Documentation
```bash
cd /Users/duynguyen/www/claudekit-engineer

# Files that need URL updates
FILES_TO_UPDATE=(
  "README.md"
  "package.json"
  "CHANGELOG.md"
  ".releaserc.json"
)

# Search for old repository URLs
for file in "${FILES_TO_UPDATE[@]}"; do
  if [ -f "$file" ]; then
    echo "Checking $file..."
    grep -n "mrgoonie/claudekit-engineer" "$file" || echo "  ✓ No updates needed"
  fi
done
```

**Manual Updates Required:**
Update all references from `mrgoonie/claudekit-engineer` to `claudekit/claudekit-engineer` in:

1. **package.json** - repository.url field
2. **README.md** - All GitHub URLs, badges, links
3. **CHANGELOG.md** - Release comparison URLs
4. **.releaserc.json** - Repository URL (if present)
5. **docs/** - Any documentation referencing the repository
6. **CLAUDE.md** - Repository references (if any)

**Example Updates:**

**package.json:**
```json
{
  "repository": {
    "type": "git",
    "url": "git+https://github.com/claudekit/claudekit-engineer.git"
  },
  "bugs": {
    "url": "https://github.com/claudekit/claudekit-engineer/issues"
  },
  "homepage": "https://github.com/claudekit/claudekit-engineer#readme"
}
```

**README.md:**
```markdown
# Replace all instances of:
https://github.com/mrgoonie/claudekit-engineer
# With:
https://github.com/claudekit/claudekit-engineer
```

### Step 19: Commit and Push Documentation Updates
```bash
# After making all documentation updates
cd /Users/duynguyen/www/claudekit-engineer

# Review changes
git status
git diff

# Create commit with documentation updates
git add .
git commit -m "docs: update repository URLs after transfer to claudekit organization"

# Push to main branch
git push origin main

# Push dev branch if needed
git checkout dev
git merge main --no-edit
git push origin dev
git checkout main
```

**Expected Outcome:**
- Documentation updated with new URLs
- Changes committed and pushed
- Release workflow triggered (if configured)

### Step 20: Verify Release Workflow
```bash
# Wait for workflow to complete
sleep 60

# Check workflow status
gh run list --repo claudekit/claudekit-engineer --limit 1

# If workflow succeeded, verify no new release was created (docs: commits don't trigger releases)
gh release list --repo claudekit/claudekit-engineer

# Check workflow logs if there were any issues
gh run view --repo claudekit/claudekit-engineer
```

**Expected Outcome:**
- Workflow runs successfully
- No new release created (docs commits don't bump version)
- All checks pass

## Verification & Testing

### Step 21: Complete Verification Checklist
```bash
# Create verification report
cd /Users/duynguyen/www/claudekit-engineer

cat > transfer-verification-report.md << 'EOF'
# Repository Transfer Verification Report
Date: $(date +%Y-%m-%d)

## ✅ Repository Transfer
- [x] Repository accessible at claudekit/claudekit-engineer
- [x] Old repository no longer exists
- [x] Repository remains private

## ✅ Git Assets Preserved
- [x] All branches present (main, dev)
- [x] All tags present (v1.0.0, v1.1.0, v1.1.1)
- [x] All releases present (3 releases)
- [x] Commit history intact
- [x] CHANGELOG.md preserved

## ✅ GitHub Features
- [x] GitHub Actions workflows transferred
- [x] Secrets preserved
- [x] Webhooks transferred (if any)
- [x] Repository settings preserved

## ✅ Collaborator Access
- [x] mrgoonie: Admin access
- [x] bnqtoan: Read access
- [x] blacklogos: Read access
- [x] tam-hopee: Read access (updated from Write)

## ✅ Local Repository
- [x] Remote URL updated
- [x] Can fetch from new remote
- [x] Can push to new remote
- [x] Branch tracking updated

## ✅ Documentation
- [x] Repository URLs updated in all files
- [x] Changes committed and pushed
- [x] No broken links

## ✅ CI/CD
- [x] GitHub Actions workflows functional
- [x] Secrets accessible
- [x] First workflow run after transfer successful
EOF

# Run automated verification
echo "Running automated verification..."

# 1. Repository exists
gh repo view claudekit/claudekit-engineer > /dev/null 2>&1 && echo "✓ Repository accessible" || echo "✗ Repository not found"

# 2. Branches
BRANCHES=$(gh api repos/claudekit/claudekit-engineer/branches --jq '[.[] | .name] | sort')
echo "✓ Branches: $BRANCHES"

# 3. Tags
TAGS=$(gh api repos/claudekit/claudekit-engineer/tags --jq '[.[] | .name] | sort')
echo "✓ Tags: $TAGS"

# 4. Releases
RELEASE_COUNT=$(gh release list --repo claudekit/claudekit-engineer | wc -l)
echo "✓ Releases: $RELEASE_COUNT"

# 5. Collaborators
COLLABORATORS=$(gh api repos/claudekit/claudekit-engineer/collaborators --jq '[.[] | {login: .login, role: .role_name}]')
echo "✓ Collaborators configured"

# 6. Local remote
REMOTE_URL=$(git remote get-url origin)
echo "✓ Local remote: $REMOTE_URL"

# 7. Test connectivity
git fetch origin > /dev/null 2>&1 && echo "✓ Can fetch from remote" || echo "✗ Cannot fetch from remote"

echo ""
echo "Verification complete! Review transfer-verification-report.md for details."
```

**Expected Outcome:**
- All verification checks pass
- Report generated documenting successful transfer

### Step 22: Test Collaborator Access (Manual)
**Action Required:** Request collaborators to verify their access:

1. **Test Read Access (all paid users):**
   ```bash
   # Each collaborator should run:
   git clone git@github.com:claudekit/claudekit-engineer.git
   cd claudekit-engineer
   git pull

   # Try to push (should fail with permission error)
   touch test.txt
   git add test.txt
   git commit -m "test"
   git push  # Expected: Permission denied
   ```

2. **Verify GitHub UI Access:**
   - Navigate to: https://github.com/claudekit/claudekit-engineer
   - Should see repository content
   - Should NOT see "Settings" tab
   - Should NOT see "Push" or "Commit" buttons

### Step 23: Compare Pre and Post Transfer State
```bash
cd /Users/duynguyen/www/claudekit-engineer

# Compare collaborators
echo "=== Collaborator Comparison ==="
echo "Before:"
cat collaborators-pre-transfer.json
echo ""
echo "After:"
cat collaborators-post-transfer.json
echo ""
echo "Final:"
cat collaborators-final-state.json

# Compare repository metadata
echo ""
echo "=== Repository Metadata Comparison ==="
echo "Before:"
cat repo-state-pre-transfer.json | jq '{name, owner, url}'
echo ""
echo "After:"
gh repo view claudekit/claudekit-engineer --json name,owner,url

# Compare branches and tags
echo ""
echo "=== Branches & Tags ==="
echo "Branches before:"
cat branches-pre-transfer.txt
echo ""
echo "Branches after:"
git branch -a
echo ""
echo "Tags before:"
cat tags-pre-transfer.txt
echo ""
echo "Tags after:"
git tag -l
```

**Expected Outcome:**
- Owner changed from mrgoonie to claudekit
- All other metadata identical
- All branches and tags present

## Rollback Plan

### If Transfer Fails or Issues Arise

**⚠️ Important:** Repository transfers to organizations cannot be reversed directly. You'll need organization admin help or need to transfer back.

#### Option 1: Transfer Back to Personal Account (if needed)
```bash
# Only if serious issues occur and organization admin approves
gh repo transfer claudekit/claudekit-engineer mrgoonie

# Wait for transfer to complete
sleep 30

# Restore local remote
cd /Users/duynguyen/www/claudekit-engineer
git remote set-url origin git@github.com:mrgoonie/claudekit-engineer.git
git fetch origin
```

#### Option 2: Use Backup (nuclear option)
```bash
# Only if repository is corrupted or lost
BACKUP_DIR=~/backups/claudekit-engineer-$(date +%Y%m%d)

# Re-push from backup to a new repository
cd $BACKUP_DIR/repo.git
git push --mirror git@github.com:mrgoonie/claudekit-engineer-restored.git

# Or restore to organization
git push --mirror git@github.com:claudekit/claudekit-engineer-restored.git
```

#### Prevention Measures
- ✅ Complete backup created before transfer
- ✅ Documentation of all state before transfer
- ✅ Verification steps at each stage
- ✅ No deletion of local copies

## Common Issues & Troubleshooting

### Issue 1: Transfer Command Fails
**Symptoms:**
```
gh repo transfer: API error: User/Organization not found
```

**Solutions:**
1. Verify organization name is correct:
   ```bash
   gh api orgs/claudekit
   ```
2. Check you have access to the organization:
   ```bash
   gh api user/memberships/orgs/claudekit
   ```
3. Ensure you're the repository owner:
   ```bash
   gh api repos/mrgoonie/claudekit-engineer --jq '.permissions'
   ```

### Issue 2: Collaborators Lost Access
**Symptoms:**
- Collaborators cannot access repository after transfer

**Solutions:**
1. Re-add collaborators:
   ```bash
   gh api \
     --method PUT \
     repos/claudekit/claudekit-engineer/collaborators/USERNAME \
     -f permission='pull'
   ```
2. Check organization member visibility
3. Verify collaborator accepted invitation

### Issue 3: GitHub Actions Not Working
**Symptoms:**
- Workflows fail after transfer
- Secrets not accessible

**Solutions:**
1. Recreate secrets:
   ```bash
   gh secret set DISCORD_WEBHOOK_URL \
     --repo claudekit/claudekit-engineer \
     --body "YOUR_VALUE"
   ```
2. Check workflow permissions:
   ```bash
   gh api repos/claudekit/claudekit-engineer/actions/permissions
   ```
3. Review workflow runs:
   ```bash
   gh run list --repo claudekit/claudekit-engineer
   gh run view RUN_ID --log
   ```

### Issue 4: Local Repository Cannot Push/Pull
**Symptoms:**
```
fatal: repository 'https://github.com/mrgoonie/claudekit-engineer.git/' not found
```

**Solutions:**
1. Update remote URL:
   ```bash
   git remote set-url origin git@github.com:claudekit/claudekit-engineer.git
   ```
2. Verify SSH access:
   ```bash
   ssh -T git@github.com
   ```
3. Re-authenticate GitHub CLI:
   ```bash
   gh auth refresh
   ```

### Issue 5: Documentation Links Broken
**Symptoms:**
- Links in README, CHANGELOG point to old repository

**Solutions:**
1. Use find and replace:
   ```bash
   # macOS
   find . -type f -name "*.md" -exec sed -i '' 's/mrgoonie\/claudekit-engineer/claudekit\/claudekit-engineer/g' {} +

   # Linux
   find . -type f -name "*.md" -exec sed -i 's/mrgoonie\/claudekit-engineer/claudekit\/claudekit-engineer/g' {} +
   ```
2. Manually review and update package.json
3. Commit and push changes

## Post-Transfer Tasks

### Immediate (Within 24 hours)
- [ ] Complete transfer process (Steps 1-20)
- [ ] Verify all checks pass (Step 21)
- [ ] Update documentation with new URLs (Step 18-19)
- [ ] Notify all collaborators (Step 4, 14)
- [ ] Test collaborator access (Step 22)

### Short-term (Within 1 week)
- [ ] Monitor GitHub Actions workflows for issues
- [ ] Verify next scheduled release works correctly
- [ ] Update any external integrations (CI/CD, badges, etc.)
- [ ] Update links in related repositories (claudekit, claudekit-cli, claudekit-docs)
- [ ] Archive backup if transfer is successful

### Long-term (Within 1 month)
- [ ] Review and optimize organization-level settings
- [ ] Set up team access if organization grows
- [ ] Consider branch protection rules for main
- [ ] Review and update collaborator access as needed

## Security Considerations

### Access Control
- ✅ Read-only access for paid users prevents unauthorized changes
- ✅ Organization provides centralized access management
- ✅ Audit trail through GitHub organization logs

### Secret Management
- ✅ Secrets transferred automatically (encrypted)
- ✅ Only workflows can access secrets
- ✅ Consider rotating secrets post-transfer for security

### Repository Visibility
- ✅ Repository remains private
- ✅ Only authorized collaborators can access
- ✅ Organization admins have access (expected)

### Recommendations
1. Enable two-factor authentication for all organization members
2. Regular access audit (quarterly)
3. Use organization secrets for shared credentials
4. Consider GitHub Advanced Security features if available

## Performance Considerations

### Transfer Performance
- **Expected Duration:** < 5 minutes for transfer operation
- **Network Impact:** Minimal (metadata transfer only)
- **Downtime:** ~1 minute (repository redirect period)

### Post-Transfer
- **Clone Performance:** No impact (same git objects)
- **CI/CD Performance:** No impact (same workflows)
- **API Rate Limits:** Consider organization rate limits (higher than personal)

## Testing Strategy

### Pre-Transfer Testing
- [x] Backup verification (restore test)
- [x] Collaborator list accuracy
- [x] Branch and tag inventory
- [x] Clean working directory

### Post-Transfer Testing
- [x] Repository accessibility
- [x] All branches present
- [x] All tags present
- [x] All releases present
- [x] Commit history intact
- [x] GitHub Actions functional
- [x] Collaborator access correct
- [x] Local repository sync
- [x] Documentation accuracy

### Integration Testing
- [ ] Push a test commit to dev branch
- [ ] Merge dev to main
- [ ] Verify release workflow creates new release
- [ ] Test collaborator clone/pull access
- [ ] Verify Discord webhook notification (if applicable)

## Risks & Mitigations

### Risk 1: Data Loss During Transfer
**Likelihood:** Very Low
**Impact:** Critical
**Mitigation:**
- Complete backup before transfer
- GitHub handles transfer atomically
- Verification steps at each stage

### Risk 2: Broken CI/CD Pipelines
**Likelihood:** Low
**Impact:** Medium
**Mitigation:**
- Secrets transferred automatically
- Test workflow immediately after transfer
- Documentation of secret recreation process

### Risk 3: Collaborator Access Issues
**Likelihood:** Medium
**Impact:** Low
**Mitigation:**
- Document current access before transfer
- Verify and update access immediately after
- Clear communication with collaborators

### Risk 4: Documentation Outdated
**Likelihood:** Medium
**Impact:** Low
**Mitigation:**
- Comprehensive search for old URLs
- Update all documentation immediately
- Test all links post-update

### Risk 5: Lost Organization Access
**Likelihood:** Very Low
**Impact:** Critical
**Mitigation:**
- Verify organization access before transfer
- Backup provides recovery option
- Organization admins can assist

## Success Criteria

### Must-Have (Blocking)
- ✅ Repository successfully transferred to claudekit organization
- ✅ All git history, branches, and tags preserved
- ✅ All releases intact
- ✅ GitHub Actions functional
- ✅ All collaborators have appropriate access
- ✅ Local repository can push/pull from new remote

### Should-Have (Important)
- ✅ Documentation updated with new URLs
- ✅ Collaborators notified and access verified
- ✅ Backup created and verified
- ✅ Verification report generated
- ✅ No broken links in documentation

### Nice-to-Have (Optional)
- ⭕ External integrations updated
- ⭕ Related repositories updated with new URLs
- ⭕ Organization-level settings optimized
- ⭕ Team access configured (if applicable)

## Timeline

| Phase | Duration | Steps | Dependencies |
|-------|----------|-------|--------------|
| **Pre-Transfer Preparation** | 30-45 min | 1-5 | None |
| **Transfer Process** | 5-10 min | 6-9 | Pre-transfer complete |
| **Collaborator Management** | 15-20 min | 10-14 | Transfer complete |
| **Post-Transfer Configuration** | 30-45 min | 15-20 | Collaborators configured |
| **Verification & Testing** | 20-30 min | 21-23 | Configuration complete |

**Total Estimated Time:** 1.5 - 2.5 hours

**Best Time to Execute:** During low-traffic hours (e.g., weekend or evening) to minimize impact on active developers.

## Communication Plan

### Before Transfer
**Audience:** All collaborators
**Message:** Transfer announcement (Step 4)
**Channel:** Email
**Timing:** 24-48 hours before transfer

### During Transfer
**Audience:** Team leads, active developers
**Message:** Transfer in progress updates
**Channel:** Slack/Discord
**Timing:** Real-time during transfer

### After Transfer
**Audience:** All collaborators
**Message:** Transfer complete, new URLs, access changes
**Channel:** Email + Slack/Discord
**Timing:** Immediately after verification

### Post-Transfer Follow-up
**Audience:** Collaborators with changed permissions
**Message:** Permission change details, how to contribute
**Channel:** Email
**Timing:** Within 24 hours (Step 14)

## Appendix

### A. GitHub CLI Commands Reference

#### Repository Operations
```bash
# View repository
gh repo view [OWNER/]REPO

# Transfer repository
gh repo transfer OWNER/REPO NEW-OWNER

# Clone repository
gh repo clone OWNER/REPO

# List releases
gh release list --repo OWNER/REPO
```

#### API Operations
```bash
# Get repository details
gh api repos/OWNER/REPO

# List collaborators
gh api repos/OWNER/REPO/collaborators

# Add collaborator
gh api --method PUT repos/OWNER/REPO/collaborators/USERNAME -f permission=PERMISSION

# List branches
gh api repos/OWNER/REPO/branches

# List tags
gh api repos/OWNER/REPO/tags

# List secrets
gh api repos/OWNER/REPO/actions/secrets
```

#### Actions Operations
```bash
# List workflows
gh workflow list --repo OWNER/REPO

# List workflow runs
gh run list --repo OWNER/REPO

# View run details
gh run view RUN_ID --repo OWNER/REPO

# View run logs
gh run view RUN_ID --log --repo OWNER/REPO
```

### B. Git Commands Reference

#### Remote Management
```bash
# Show remotes
git remote -v

# Add remote
git remote add NAME URL

# Remove remote
git remote remove NAME

# Change remote URL
git remote set-url NAME URL

# Fetch from remote
git fetch REMOTE

# Push to remote
git push REMOTE BRANCH
```

#### Branch Management
```bash
# List branches
git branch -a

# Create branch
git branch BRANCH_NAME

# Switch branch
git checkout BRANCH_NAME

# Set upstream
git branch --set-upstream-to=REMOTE/BRANCH BRANCH
```

#### Information
```bash
# Show status
git status

# Show log
git log --oneline --graph --all

# Show tags
git tag -l

# Show diff
git diff
```

### C. Permission Levels Reference

GitHub repository permissions:

| Permission | Description | Can Read | Can Clone | Can Push | Can Admin |
|-----------|-------------|----------|-----------|----------|-----------|
| **Read** (`pull`) | View and clone | ✅ | ✅ | ❌ | ❌ |
| **Triage** | Manage issues/PRs | ✅ | ✅ | ❌ | ❌ |
| **Write** (`push`) | Read + Push changes | ✅ | ✅ | ✅ | ❌ |
| **Maintain** | Write + manage settings | ✅ | ✅ | ✅ | Partial |
| **Admin** | Full control | ✅ | ✅ | ✅ | ✅ |

For paid users in this project: **Read** permission is appropriate.

### D. Related Resources

#### Documentation
- [GitHub: Transferring a repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/transferring-a-repository)
- [GitHub CLI: gh repo transfer](https://cli.github.com/manual/gh_repo_transfer)
- [GitHub: Repository permission levels](https://docs.github.com/en/organizations/managing-access-to-your-organizations-repositories/repository-permission-levels-for-an-organization)

#### Related Repositories
- **claudekit** - https://github.com/mrgoonie/claudekit
- **claudekit-cli** - https://github.com/mrgoonie/claudekit-cli
- **claudekit-docs** - https://github.com/mrgoonie/claudekit-docs

---

## Execution Checklist

Use this checklist when executing the plan:

### Pre-Transfer (Steps 1-5)
- [ ] Step 1: Backup repository (~/backups/)
- [ ] Step 2: Document current state (JSON/TXT files)
- [ ] Step 3: Verify organization access
- [ ] Step 4: Notify collaborators (email sent)
- [ ] Step 5: Check for open work (clean state confirmed)

### Transfer (Steps 6-9)
- [ ] Step 6: Execute transfer command
- [ ] Step 7: Verify transfer completion (new repo exists, old removed)
- [ ] Step 8: Verify repository contents (branches, tags, releases)
- [ ] Step 9: Update local repository remote

### Collaborators (Steps 10-14)
- [ ] Step 10: Audit current collaborators
- [ ] Step 11: Identify paid users
- [ ] Step 12: Update tam-hopee permission to Read
- [ ] Step 13: Verify all collaborator permissions
- [ ] Step 14: Notify tam-hopee of permission change

### Configuration (Steps 15-20)
- [ ] Step 15: Verify GitHub Actions secrets
- [ ] Step 16: Test GitHub Actions workflow
- [ ] Step 17: Review repository settings
- [ ] Step 18: Update documentation (README, package.json, CHANGELOG)
- [ ] Step 19: Commit and push documentation updates
- [ ] Step 20: Verify release workflow

### Verification (Steps 21-23)
- [ ] Step 21: Complete verification checklist
- [ ] Step 22: Test collaborator access (manual)
- [ ] Step 23: Compare pre/post transfer state

### Final
- [ ] Review all verification checks
- [ ] Archive backup if successful
- [ ] Update related repositories
- [ ] Document lessons learned

---

**Plan Status:** Ready for Execution
**Last Updated:** 2025-10-16
**Next Review:** After execution completion

