'use strict';

/**
 * 🏭 Project Bootstrapper — Auto-scaffold từ Client Intake
 * Nhận intake.json → tạo project folder → gen configs → register vào Vibe Factory
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { validateIntake } = require('./client-intake-schema');

const MEKONG_DIR = path.resolve(__dirname, '..', '..', '..');

function generateReadme(intake) {
    const d = intake.data || intake;
    return `# ${d.company.name} — ${d.project.name}

> ${d.project.goal}

## 📋 Project Info

| Field | Value |
|-------|-------|
| **Client** | ${d.company.name} |
| **Industry** | ${d.company.industry} |
| **Type** | ${d.project.type} |
| **Target** | ${d.target.audience} |
| **Devices** | ${d.target.devices} |
| **Locale** | ${d.target.locale} |
| **Framework** | ${d.tech.framework} |
| **Database** | ${d.tech.database} |
| **Auth** | ${d.tech.auth} |
| **Hosting** | ${d.tech.hosting} |

## 🎯 Core Features

${(d.features.core || []).map(f => `- ${f}`).join('\n')}

${(d.features.nice_to_have || []).length ? `## Nice to Have\n${d.features.nice_to_have.map(f => `- ${f}`).join('\n')}` : ''}

${(d.features.integrations || []).length ? `## Integrations\n${d.features.integrations.map(f => `- ${f}`).join('\n')}` : ''}

## 🎨 Design

- **Style**: ${d.design.style}
- **Primary Color**: ${d.design.primaryColor}
${(d.design.references || []).length ? `- **References**: ${d.design.references.join(', ')}` : ''}

## 🚀 Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

---
_Bootstrapped by AgencyOS RaaS AGI Engine_
`;
}

function generateClaudeMd(intake) {
    const d = intake.data || intake;
    return `# CLAUDE.md — ${d.project.name}

## Project Context
- **Client**: ${d.company.name} (${d.company.industry})
- **Goal**: ${d.project.goal}
- **Type**: ${d.project.type}
- **Locale**: ${d.target.locale}
- **Tech**: ${d.tech.framework} + ${d.tech.database} + ${d.tech.auth}

## Core Features to Implement
${(d.features.core || []).map(f => `- [ ] ${f}`).join('\n')}

## Design Guidelines
- Style: ${d.design.style}
- Primary: ${d.design.primaryColor}
- Secondary: ${d.design.secondaryColor || '#f59e0b'}
- Mobile-first: ${d.target.devices === 'mobile-first' ? 'YES' : 'NO'}

## Quality Standards
- TypeScript strict mode
- 100% i18n (${d.target.locale})
- npm audit 0 critical
- Build must pass clean
- Production-code-audit before delivery

## Binh Pháp Target: 100/100 Grade S
`;
}

function generateEnvExample(intake) {
    const d = intake.data || intake;
    let env = `# Environment Variables for ${d.project.name}\n\n`;
    env += `# App\nNEXT_PUBLIC_APP_NAME="${d.company.name}"\nNEXT_PUBLIC_APP_URL="https://${d.tech.domain || 'localhost:3000'}"\n\n`;

    if (d.tech.database === 'supabase') {
        env += `# Supabase\nNEXT_PUBLIC_SUPABASE_URL=\nNEXT_PUBLIC_SUPABASE_ANON_KEY=\nSUPABASE_SERVICE_ROLE_KEY=\n\n`;
    }
    if (d.features.integrations.includes('PayOS') || d.features.integrations.includes('payos')) {
        env += `# PayOS\nPAYOS_CLIENT_ID=\nPAYOS_API_KEY=\nPAYOS_CHECKSUM_KEY=\n\n`;
    }
    if (d.features.integrations.includes('Stripe') || d.features.integrations.includes('stripe')) {
        env += `# Stripe\nSTRIPE_SECRET_KEY=\nNEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=\n\n`;
    }
    env += `# Analytics\nNEXT_PUBLIC_GA_ID=\n`;
    return env;
}

function generateProjectBrief(intake) {
    const d = intake.data || intake;
    const date = new Date().toISOString().split('T')[0];
    return `# 📋 Project Brief — ${d.project.name}

**Created**: ${date}
**Client**: ${d.company.name} (${d.company.contact.name} — ${d.company.contact.email})
**Industry**: ${d.company.industry}
**Budget**: ${d.commercial.budget || 'TBD'}
**Deadline**: ${d.commercial.deadline || 'TBD'}
**Tier**: ${d.commercial.tier}

## Problems to Solve
${(d.project.problems || []).map(p => `- ${p}`).join('\n') || '- (To be defined)'}

## Success Criteria
- [ ] All core features implemented
- [ ] Build passes clean (npm run build)
- [ ] Tests passing (npm test)
- [ ] Security audit clean (npm audit)
- [ ] Production deployed + HTTP 200
- [ ] Score ≥ 90/100 (Grade S)
- [ ] Handover package generated

---
_AgencyOS Project Brief Standard v1.0_
`;
}

/**
 * Bootstrap a new project from intake data.
 * @param {object} intakeData — raw intake JSON (will be validated)
 * @returns {{ success: boolean, projectDir: string, errors?: string[], files: string[] }}
 */
function bootstrapProject(intakeData) {
    // 1. Validate
    const validation = validateIntake(intakeData);
    if (!validation.valid) {
        return { success: false, errors: validation.errors, projectDir: '', files: [] };
    }

    const data = validation.data;
    const projectName = data.project.name;
    const projectDir = path.join(MEKONG_DIR, 'apps', projectName);

    // 2. Create project directory
    if (fs.existsSync(projectDir)) {
        return { success: false, errors: [`Project directory already exists: ${projectDir}`], projectDir, files: [] };
    }

    const dirs = [
        projectDir,
        path.join(projectDir, 'src'),
        path.join(projectDir, 'docs'),
        path.join(projectDir, 'plans'),
        path.join(projectDir, 'public'),
        path.join(projectDir, '.github', 'workflows'),
    ];
    dirs.forEach(d => fs.mkdirSync(d, { recursive: true }));

    // 3. Generate files
    const files = [];

    const fileMap = {
        'README.md': generateReadme(data),
        'CLAUDE.md': generateClaudeMd(data),
        '.env.example': generateEnvExample(data),
        'docs/PROJECT_BRIEF.md': generateProjectBrief(data),
        'intake.json': JSON.stringify(intakeData, null, 2),
    };

    for (const [fileName, content] of Object.entries(fileMap)) {
        const filePath = path.join(projectDir, fileName);
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, content, 'utf-8');
        files.push(filePath);
    }

    // 4. Generate package.json
    const pkgJson = {
        name: projectName,
        version: '0.1.0',
        private: true,
        scripts: {
            dev: data.tech.framework === 'nextjs' ? 'next dev' : 'vite',
            build: data.tech.framework === 'nextjs' ? 'next build' : 'vite build',
            start: data.tech.framework === 'nextjs' ? 'next start' : 'vite preview',
            test: 'echo "No tests yet" && exit 0',
            lint: 'eslint . --ext .ts,.tsx',
        },
    };
    const pkgPath = path.join(projectDir, 'package.json');
    fs.writeFileSync(pkgPath, JSON.stringify(pkgJson, null, 2), 'utf-8');
    files.push(pkgPath);

    // 5. Generate tsconfig
    const tsconfig = { compilerOptions: { target: 'es2017', lib: ['dom', 'es2017'], strict: true, esModuleInterop: true, jsx: 'react-jsx', moduleResolution: 'bundler', outDir: 'dist' }, include: ['src'] };
    const tscPath = path.join(projectDir, 'tsconfig.json');
    fs.writeFileSync(tscPath, JSON.stringify(tsconfig, null, 2), 'utf-8');
    files.push(tscPath);

    // 6. Generate CI workflow
    const ciYml = `name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run build
      - run: npm test
`;
    const ciPath = path.join(projectDir, '.github', 'workflows', 'ci.yml');
    fs.writeFileSync(ciPath, ciYml, 'utf-8');
    files.push(ciPath);

    // 7. Create HIGH priority task for Vibe Factory
    const taskContent = `/cook "NEW PROJECT: ${projectName} for ${data.company.name}. Goal: ${data.project.goal}. Tech: ${data.tech.framework}+${data.tech.database}. 1/ DEEP 10x PLAN architecture. 2/ COOK implement core features: ${data.features.core.slice(0, 3).join(', ')}. 3/ production-code-audit: lint-and-validate, security-review. npm audit fix. 4/ VERIFY GREEN GOLIVE. Commit."`;
    const taskPath = path.join(__dirname, '..', 'tasks', `HIGH_${projectName}_bootstrap.txt`);
    fs.writeFileSync(taskPath, taskContent, 'utf-8');
    files.push(taskPath);

    // 8. Git init
    try {
        execSync('git init', { cwd: projectDir, stdio: 'pipe' });
        execSync('git add -A && git commit -m "feat: bootstrap from client intake"', { cwd: projectDir, stdio: 'pipe' });
    } catch { /* ok if fails */ }

    return { success: true, projectDir, files, score: { total: 0, grade: 'F' } };
}

module.exports = { bootstrapProject, generateReadme, generateClaudeMd, generateEnvExample, generateProjectBrief };
