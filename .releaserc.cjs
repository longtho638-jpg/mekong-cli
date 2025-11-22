/**
 * Semantic Release Configuration
 *
 * Dynamically provides configuration based on the current branch:
 * - dev branch: Uses beta release configuration
 * - main branch: Uses production release configuration
 */

// Determine the current branch
// GitHub Actions provides: GITHUB_REF_NAME (just the branch name)
const currentBranch = process.env.GITHUB_REF_NAME ||
                     process.env.GIT_BRANCH ||
                     (process.env.GITHUB_REF && process.env.GITHUB_REF.replace('refs/heads/', '')) ||
                     require('child_process')
                       .execSync('git rev-parse --abbrev-ref HEAD')
                       .toString()
                       .trim();

console.error(`[semantic-release config] Branch: ${currentBranch}`);

// Beta release configuration
// NOTE: semantic-release requires at least one non-prerelease branch
const betaConfig = {
  branches: [
    'main',  // Regular release branch (required even in beta config)
    {
      name: 'dev',
      prerelease: 'beta'
    }
  ],
  plugins: [
    [
      '@semantic-release/commit-analyzer',
      {
        preset: 'conventionalcommits',
        releaseRules: [
          { type: 'docs', scope: 'README', release: 'patch' },
          { type: 'refactor', release: 'patch' },
          { type: 'style', release: 'patch' }
        ]
      }
    ],
    [
      '@semantic-release/release-notes-generator',
      {
        preset: 'conventionalcommits',
        presetConfig: {
          types: [
            { type: 'feat', section: '🚀 Features' },
            { type: 'fix', section: '🐞 Bug Fixes' },
            { type: 'docs', section: '📚 Documentation' },
            { type: 'style', section: '💄 Styles' },
            { type: 'refactor', section: '♻️ Code Refactoring' },
            { type: 'perf', section: '⚡ Performance Improvements' },
            { type: 'test', section: '✅ Tests' },
            { type: 'build', section: '🏗️ Build System' },
            { type: 'ci', section: '👷 CI' }
          ]
        }
      }
    ],
    [
      '@semantic-release/changelog',
      {
        changelogFile: 'CHANGELOG.md'
      }
    ],
    [
      '@semantic-release/npm',
      {
        npmPublish: false
      }
    ],
    [
      '@semantic-release/exec',
      {
        prepareCmd: 'node scripts/prepare-release-assets.cjs ${nextRelease.version}'
      }
    ],
    [
      '@semantic-release/github',
      {
        assets: [
          { path: 'CHANGELOG.md', label: 'Changelog' },
          { path: 'dist/claudekit-engineer.zip', label: 'ClaudeKit Engineer Package (Beta)' }
        ],
        prerelease: true
      }
    ],
    [
      '@semantic-release/git',
      {
        assets: ['CHANGELOG.md', 'package.json', 'package-lock.json', '.claude/metadata.json'],
        message: 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}'
      }
    ]
  ]
};

// Production release configuration
const productionConfig = {
  branches: ['main'],
  plugins: [
    [
      '@semantic-release/commit-analyzer',
      {
        preset: 'conventionalcommits',
        releaseRules: [
          { type: 'docs', scope: 'README', release: 'patch' },
          { type: 'refactor', release: 'patch' },
          { type: 'style', release: 'patch' }
        ]
      }
    ],
    [
      '@semantic-release/release-notes-generator',
      {
        preset: 'conventionalcommits',
        presetConfig: {
          types: [
            { type: 'feat', section: '🚀 Features' },
            { type: 'fix', section: '🐞 Bug Fixes' },
            { type: 'docs', section: '📚 Documentation' },
            { type: 'style', section: '💄 Styles' },
            { type: 'refactor', section: '♻️ Code Refactoring' },
            { type: 'perf', section: '⚡ Performance Improvements' },
            { type: 'test', section: '✅ Tests' },
            { type: 'build', section: '🏗️ Build System' },
            { type: 'ci', section: '👷 CI' }
          ]
        }
      }
    ],
    [
      '@semantic-release/changelog',
      {
        changelogFile: 'CHANGELOG.md'
      }
    ],
    [
      '@semantic-release/npm',
      {
        npmPublish: false
      }
    ],
    [
      '@semantic-release/exec',
      {
        prepareCmd: 'node scripts/prepare-release-assets.cjs ${nextRelease.version}'
      }
    ],
    [
      '@semantic-release/github',
      {
        assets: [
          { path: 'CHANGELOG.md', label: 'Changelog' },
          { path: 'dist/claudekit-engineer.zip', label: 'ClaudeKit Engineer Package' }
        ]
      }
    ],
    [
      '@semantic-release/git',
      {
        assets: ['CHANGELOG.md', 'package.json', 'package-lock.json', '.claude/metadata.json'],
        message: 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}'
      }
    ]
  ]
};

// Select and export the appropriate configuration
const config = currentBranch === 'dev' ? betaConfig : productionConfig;

console.error(`[semantic-release config] Using ${currentBranch === 'dev' ? 'BETA' : 'PRODUCTION'} config`);
console.error(`[semantic-release config] Branches: ${JSON.stringify(config.branches)}`);

module.exports = config;
