# Data Diet Rules

> **Bảo mật tuyệt đối - "Cẩn tắc vô ưu"**

## 1. Absolute Prohibitions (Cấm tuyệt đối)

### KHÔNG BAO GIỜ đọc/log:
- `.env` files
- API keys (AWS, Stripe, OpenAI, etc.)
- Credentials (DB passwords, SSH keys)
- User Personal Identifiable Information (PII)

### KHÔNG BAO GIỜ commit:
- Passwords
- Private keys
- `.env` files (Use `.env.example` instead)
- Secrets in git history

### KHÔNG BAO GIỜ share:
- Startup financials without permission
- VC intelligence without anonymizing
- Client proprietary strategies

## 2. Privacy Hook Compliance
- Respect `privacy-block.cjs`
- If blocked, ask user for permission using `AskUserQuestion`
- Default to "NO" if unsure

## 3. Data Handling
- Use Mock Data for testing
- Sanitize logs before outputting
- Local-first processing whenever possible
