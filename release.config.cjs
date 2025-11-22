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
const currentBranch = process.env.GITHUB_REF_NAME ||
                     process.env.GIT_BRANCH ||
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

console.log(`[semantic-release] Loading configuration for branch: ${currentBranch}`);
console.log(`[semantic-release] Using config file: ${configFile}`);

module.exports = config;
