# Quick Start Guide ⚡️

**Goal:** Get all available services running in under 15 minutes.

## Prerequisites

*   **Node.js** (v18 or higher)
*   **npm** or **pnpm** or **yarn**
*   **Docker** (Optional, but recommended for full stack database/redis)

## Step-by-Step

### 1. Unzip the Bundle
You've likely already done this. If not:
```bash
unzip antigravity-starter-bundle-v1.0.0.zip
cd antigravity-starter-bundle-v1.0.0
```

### 2. Run the Universal Installer
We've provided a script to bootstrap everything.

**Mac/Linux:**
```bash
cd setup
chmod +x install-all.sh
./install-all.sh
```

**Windows:**
You can run the Node.js installer:
```bash
cd setup
node install-all.js
```

### 3. Verify Installation
The script will output the status of each component. You should see "SUCCESS" next to Social Auth, User Prefs, and AgencyOS.

### 4. Run the Full Stack Example
To see everything working together, let's run the `full-stack-saas` example.

```bash
cd examples/full-stack-saas
npm install
npm run dev
```

Open your browser to `http://localhost:3000`.

### 5. Manual Setup (If scripts fail)

**Social Auth Kit:**
```bash
cd products/social-auth-kit
cp .env.example .env
npm install
npm run dev
```

**AgencyOS Workspace:**
```bash
cd products/agencyos-workspace
cp .env.example .env
npm install
npm run dev
```

**User Preferences Kit:**
```bash
cd products/user-preferences-kit
cp .env.example .env
npm install
npm run dev
```

## Next Steps
Now that you have the basics running, check out the [Architecture Guide](ARCHITECTURE.md) to see how to integrate these into your own existing project.
