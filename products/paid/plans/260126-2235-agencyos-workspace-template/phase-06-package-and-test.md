# Phase 6: Packaging & Testing

## 1. Overview
Final quality assurance and packaging of the product for delivery.

## 2. Requirements
- Verify integrity of all files.
- Ensure no sensitive data (from dev environment) is included.
- Create a clean ZIP archive.

## 3. Implementation Steps
1.  **Manual Inspection**: Walk through the generated folder structure. Check for typos, broken links, or empty files.
2.  **Test Run**: Run `setup.sh` in a temporary directory (`/tmp/agency-test`) to verify behavior.
3.  **Cleanup**: Remove any `.DS_Store` or temporary build files.
4.  **Zip**: Compress the `agencyos-workspace-template` folder into `agencyos-workspace-template-v1.0.0.zip`.
5.  **Final Verification**: Unzip the artifact and check contents one last time.

## 4. Todo List
- [ ] Inspect folder structure.
- [ ] Execute test deployment.
- [ ] Create ZIP package.
- [ ] Move ZIP to `products/paid/dist/` (or similar output location).

## 5. Success Criteria
- `agencyos-workspace-template-v1.0.0.zip` exists.
- Archive size is reasonable (< 5MB likely).
- Contents are accurate.
