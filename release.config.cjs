/**
 * Semantic Release Configuration
 *
 * Dynamically loads configuration based on the current branch:
 * - dev branch: Uses beta release configuration
 * - main branch: Uses production release configuration
 */

const fs = require('fs');
const path = require('path');

// Determine the current branch
// GitHub Actions provides: GITHUB_REF (refs/heads/branch-name)
// We need to extract just the branch name from refs/heads/branch-name
const currentBranch = process.env.GITHUB_REF_NAME ||
                     process.env.GIT_BRANCH ||
                     (process.env.GITHUB_REF && process.env.GITHUB_REF.replace('refs/heads/', '')) ||
                     require('child_process')
                       .execSync('git rev-parse --abbrev-ref HEAD')
                       .toString()
                       .trim();

// Load the appropriate configuration
let configFile;
if (currentBranch === 'dev') {
  configFile = '.releaserc.beta.json';
} else {
  configFile = '.releaserc.json';
}

const configPath = path.join(__dirname, configFile);
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Log to stderr so it appears in CI logs
console.error(`[semantic-release config] Branch: ${currentBranch}`);
console.error(`[semantic-release config] Config file: ${configFile}`);
console.error(`[semantic-release config] GITHUB_REF_NAME: ${process.env.GITHUB_REF_NAME}`);
console.error(`[semantic-release config] GITHUB_REF: ${process.env.GITHUB_REF}`);

module.exports = config;
