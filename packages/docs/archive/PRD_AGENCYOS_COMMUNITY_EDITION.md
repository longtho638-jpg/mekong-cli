# CHIẾN LƯỢC & PRD: AGENCYOS OPEN CORE (DEVELOPER KIT)

## PHẦN 1: CHIẾN LƯỢC SẢN PHẨM (STRATEGY)

### 1. Triết lý: "Docs as Code"

- **Vấn đề:** Dev rất ghét đọc tài liệu dài dòng. Họ thích chạy code.
- **Giải pháp:** Biến kho tài liệu (SOPs) thành **Executable Recipes**.
- File `sales_process.md` không chỉ để đọc → Nó là file cấu hình để Agent chạy việc sales.

### 2. Viral Hook: "Magic Button"

- Tận dụng tính năng **"Open in IDX/Antigravity"**.
- User chỉ cần bấm 1 nút → Có ngay môi trường VS Code trên mây → OpenClaw + AgencyOS Recipes → Bấm `Run` là chạy.
- **Wow Factor:** Không cần cài Docker, không cần config Python, không lỗi môi trường.

### 3. Phễu chuyển đổi (The Trap)

- Bản Community (Github): Chạy Local/Antigravity của user. Tự lo Proxy, Captcha, tốc độ chậm, đơn luồng.
- **Upsell:** Khi Terminal chạy xong task, in dòng log màu vàng:
  > "Bạn muốn chạy 100 luồng cùng lúc và không lo Captcha? Dùng bản Cloud RaaS tại agencyos.network"

---

## PHẦN 2: ĐẶC TẢ KỸ THUẬT

### Component A: The "Recipe" Parser (The Bridge)

**Input:** Markdown file với headers chuẩn:

- `# Goal`: What to do.
- `## Inputs`: Variables required.
- `## Steps`: Natural language instructions.
  **Output:** JSON Configuration → OpenClaw can execute.

### Component B: Antigravity Configuration (.idx)

**File `.idx/dev.nix`:**

- Install: Python 3.11, Node.js 20, Docker
- Define `previews`: Auto-start CLI menu
- Environment Variables: API Keys template

### Component C: The CLI Interface (`agency-cli`)

1. `agency list`: List all Recipes
2. `agency run <recipe_name>`: Execute recipe
3. `agency contribute`: PR guidelines

---

## PHẦN 3: IMPLEMENTATION LOGIC

### Logic 1: The "Soft Upsell"

Every command finish:

- Print execution time
- If execution > 2 minutes → Print stylized upsell message

### Logic 2: Recipe Format Standard

```markdown
# Recipe: Competitor Spy

## Description

Analyze 5 competitors' pricing.

## Inputs

- competitors_list (list)

## Steps

1. Visit each URL
2. Find pricing page
3. Extract cheapest price
4. Save to CSV
```

---

## MẸO VIRAL (SECRET SAUCE)

**Tạo `RECIPE_TEMPLATE.md` thật dễ hiểu:**

> "Chỉ cần biết viết tiếng Việt/Anh, bạn có thể tạo Agent. Viết quy trình vào Markdown và PR. Nếu được merge, nhận 500 Credits bản Cloud."

→ Repo trở thành **Wikipedia của quy trình Agency** = **Viral Loop**
