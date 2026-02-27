# 👋 Contributing to Mekong CLI

Thank you for your interest in contributing to **Mekong CLI** — the world's first Revenue-as-a-Service (RaaS) Agency Operating System.

This project follows the **Binh Phap (Art of War) Constitution**. By contributing, you agree to uphold these standards of precision and quality.

---

## 🏯 The Constitution & Rules

Before you start, you **MUST** read:
1. **[CLAUDE.md](./CLAUDE.md)**: The supreme constitution.
2. **[Binh Phap Quality](./.claude/rules/binh-phap-quality.md)**: Our strict quality standards.

---

## 🛠 Setting Up Your Environment

Mekong CLI is a Python + Node.js monorepo.

### Requirements
- **Python**: >= 3.11
- **Node.js**: >= 20 (for Tôm Hùm daemon)
- **Poetry**: For Python dependency management

### Installation
```bash
# 1. Clone the repository
git clone https://github.com/mekong-cli/mekong-cli.git
cd mekong-cli

# 2. Install Python dependencies
pip install poetry
poetry install

# 3. Configure environment
cp .env.example .env

# 4. Verify setup
python3 -m pytest tests/ -v
```

---

## 🔄 Pull Request (PR) Workflow

We follow **GitHub Flow** combined with **Binh Phap Quality Gates**.

1. **Fork & Branch**:
   - Create a branch from `main`.
   - Name format: `type/short-description` (e.g., `feat/add-login`, `fix/proxy-timeout`).

2. **Commit Strategy**:
   - Use **Conventional Commits**:
     - `feat`: New feature
     - `fix`: Bug fix
     - `docs`: Documentation changes
     - `refactor`: Code restructuring
     - `test`: Adding tests
     - `chore`: Maintenance/tools
   - **NEVER** commit sensitive files (`.env`, keys, credentials).

3. **Verification**:
   - Before pushing, you **MUST** pass the local test suite:
     ```bash
     python3 -m pytest tests/ -v
     ```
   - Ensure your code passes all 6 Binh Phap Quality Gates.

4. **Submit PR**:
   - Use a clear title and description.
   - Link any related issues.
   - PRs are merged only when:
     - CI/CD is **GREEN**.
     - At least one maintainer approves.

---

## 🛡️ The 6 Binh Phap Quality Gates

Your code will be rejected if it violates any of these gates:

| Gate | Criterion |
|------|-----------|
| **Tech Debt** | 0 `console.log`, `TODO`, or `FIXME` in production code. |
| **Type Safety** | 0 `any` types in TypeScript. 100% type hinting in Python. |
| **Security** | 0 hardcoded secrets. Restricted CORS. Validated inputs. |
| **Performance** | Build time < 10s. LCP < 2.5s (for web). |
| **Docs** | Updated README/docs for any logic changes. |
| **Tests** | Coverage must not decrease. All tests must pass. |

---

## 🤝 Code of Conduct

We are committed to providing a welcoming and inspiring environment. Please treat all contributors with respect.

---

<div align="center">
*"Speed is the essence of war. Take advantage of the enemy's unreadiness, make your way by unexpected routes, and attack unguarded spots."*
</div>
