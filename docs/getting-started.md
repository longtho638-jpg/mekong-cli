# 🚀 Getting Started with Agency OS (Zero to Hero)

Chào mừng Anh đến với **Agency OS** - Hệ điều hành dành cho "One-Person Unicorn".
Tài liệu này sẽ giúp Anh đi từ con số 0 đến một Agency vận hành tự động chỉ trong 15 phút.

> 🏯 **"Công dục thiện kỳ sự, tất tiên lợi kỳ khí"**
> (Muốn làm việc tốt, trước hết phải mài sắc công cụ)

**Philosophy**: Agency OS is built on **[Binh Pháp](./binh-phap-philosophy.md)** (兵法 - Art of War) principles. Every command follows strategic wisdom from Sun Tzu, optimized for modern agencies. See the philosophy guide to understand the "why" behind each feature.

---

## 📚 Documentation Navigation

- **[CLI Reference](./CLI_REFERENCE.md)** - Complete command documentation (all modules + legacy commands)
- **[Command Index](./command-index.md)** - Quick alphabetical and category-based command lookup
- **This Guide** - Quick start tutorial for first-time users

> **⚠️ Command Evolution Note**
> This guide has been updated to use **modern `cc` module commands** (recommended for all new workflows). Legacy slash commands (`/cook`, `/quote`) and mekong commands are still supported but considered deprecated. See [Command Migration Guide](./CLI_REFERENCE.md#-command-migration-guide) for full details.

---

## 1. Cài Đặt (Setup)

Yêu cầu: Python 3.9+, Node.js 18+.

```bash
# 1. Clone kho vũ khí
git clone https://github.com/longtho638-jpg/mekong-cli.git
cd mekong-cli

# 2. Cài đặt dependencies (Vũ khí)
pip install -e .
npm install -g @anthropic/mcp-server-filesystem

# 3. Kích hoạt môi trường (Lên đạn)
cc agent configure-vibe --location "Ho Chi Minh" --tone "Professional"
```

<details>
<summary>📜 Legacy command (deprecated)</summary>

```bash
mekong setup-vibe --location "Ho Chi Minh" --tone "Professional"
```
See [mekong setup-vibe documentation](./CLI_REFERENCE.md#mekong-setup-vibe---configure-environment)
</details>

---

## 2. Khởi Tạo "Linh Hồn" (DNA)

Bước đầu tiên là định hình bản sắc cho Agency của Anh.

```bash
# Chạy lệnh khởi tạo
cc client init "Alpha Digital"
```

<details>
<summary>📜 Legacy command (deprecated)</summary>

```bash
mekong init "Alpha Digital"
```
See [mekong init documentation](./CLI_REFERENCE.md#mekong-init---initialize-agency-dna)
</details>

Hệ thống sẽ hỏi Anh các câu hỏi chiến lược:
- **Niche (Thị trường ngách):** Anh phục vụ ai? (VD: Spa, Bất động sản, SaaS...)
- **Model (Mô hình):** Retainer, Project hay Hybrid?
- **Goal (Mục tiêu):** $10k/tháng hay $1M ARR?

---

## 3. "Nấu" Tính Năng Đầu Tiên (First Cook)

Hãy để AI Dev (Fullstack Developer) xây dựng landing page cho Anh.

```bash
# Bước 1: Research và phân tích
cc workflow scout "Landing page giới thiệu dịch vụ SEO cho Spa"

# Bước 2: Triển khai với AI
cc agent spawn --type coder --task "Build a landing page for Spa SEO service using Next.js and Tailwind"
```

<details>
<summary>📜 Legacy commands (deprecated)</summary>

```bash
# Research
mekong run-scout "Landing page giới thiệu dịch vụ SEO cho Spa"

# Implementation
/cook "Build a landing page for Spa SEO service using Next.js and Tailwind"
```
See [/cook](./CLI_REFERENCE.md#cook---build-features-with-ai) and [mekong run-scout](./CLI_REFERENCE.md#mekong-run-scout---research-and-scout) documentation
</details>

AI sẽ:
1.  **Plan:** Lập kế hoạch 3 bước.
2.  **Code:** Viết code React/Next.js.
3.  **Test:** Tự động kiểm tra lỗi.

---

## 4. Kiếm Tiền (Money Making)

Khi có khách hàng tiềm năng (Lead), hãy dùng bộ công cụ "Tài" để chốt deal.

```bash
# 1. Tạo báo giá chuẩn Binh Pháp (13 chương)
cc sales quote "Lotus Spa" --budget 5000

# 2. Kiểm tra luật Tam Thắng (WIN-WIN-WIN)
cc strategy validate-win

# 3. Xuất Proposal (Kế sách)
cc sales proposal "Lotus Spa"
```

<details>
<summary>📜 Legacy commands (deprecated)</summary>

```bash
/quote "Lotus Spa" --budget 5000
/win3
/proposal "Lotus Spa"
```
See [/quote](./CLI_REFERENCE.md#quote---generate-pricing-quotes), [/win3](./CLI_REFERENCE.md#win3---validate-win-win-win-alignment), and [/proposal](./CLI_REFERENCE.md#proposal---generate-client-proposals) documentation
</details>

Nếu điểm `cc strategy validate-win` > 70, Anh có thể tự tin gửi báo giá. Nếu thấp hơn, AI sẽ cảnh báo Anh đang chịu thiệt hoặc khách hàng chưa nhận đủ giá trị.

---

## 5. Quản Trị Tổng Thể (The Dashboard)

Để xem bức tranh toàn cảnh:

```bash
# Master Dashboard
cc analytics dashboard

# Additional monitoring commands
cc monitor status      # System health
cc analytics kpi        # Key performance indicators
cc revenue dashboard    # Financial metrics
```

<details>
<summary>📜 Legacy command (deprecated)</summary>

```bash
/antigravity
```
See [/antigravity documentation](./CLI_REFERENCE.md#antigravity---master-dashboard)
</details>

Anh sẽ thấy:
- **💰 Doanh thu:** Tiến độ tới $1M.
- **🏰 Hào bảo vệ (Moat):** Độ khó để đối thủ sao chép Anh.
- **🤖 Đội quân AI:** Trạng thái hoạt động của các Agent.

---

## 6. Kết Nối Thanh Toán (Billing)

Agency OS hỗ trợ thanh toán địa phương hóa tối ưu cho Đông Nam Á.

### Việt Nam 🇻🇳 - PayOS
1.  Đăng ký tại [my.payos.vn](https://my.payos.vn).
2.  Lấy **Client ID** và **API Key**.
3.  Cập nhật `.env`:
    ```bash
    PAYOS_CLIENT_ID=...
    PAYOS_API_KEY=...
    ```

### Thái Lan 🇹🇭 - Omise
Hỗ trợ PromptPay, TrueMoney.

### Indo/Phil 🇮🇩🇵🇭 - Xendit
Hỗ trợ OVO, GoPay, GCash.

---

## ❓ FAQ (Hỏi Nhanh Đáp Gọn)

**Q: Agency OS có hỗ trợ tiếng Việt không?**
A: **Có!** Toàn bộ giao diện và AI Agent đều ưu tiên Tiếng Việt ("Vietnamese First").

**Q: Tôi có cần biết code không?**
A: **Không nhất thiết.** Với lệnh `cc agent spawn --type coder`, AI sẽ code thay bạn. Tuy nhiên, biết chút ít sẽ giúp bạn "chỉ đạo" AI tốt hơn.

**Q: Data của tôi nằm ở đâu?**
A: Data nằm ngay trên máy của bạn (Local First) hoặc trên Cloud riêng của bạn (Supabase). Chúng tôi không sở hữu data của bạn.

---

## 💡 Bí Kíp (Pro Tips)

- **Gõ `cc --help`**: Để xem tất cả quyền năng và modules.
- **Sửa `.claude/agents/*.md`**: Để dạy AI cách nói chuyện giống Anh hơn.
- **Chạy `cc devops cleanup`**: Vào cuối tuần để AI tự dọn dẹp code rác.

<details>
<summary>📜 Legacy commands (deprecated)</summary>

- `/help` - Use `cc --help` instead
- `/jules` - Use `cc devops cleanup` instead

See [/help](./CLI_REFERENCE.md#help---view-all-commands) and [/jules](./CLI_REFERENCE.md#jules---weekend-code-cleanup) documentation
</details>

> **Pro Tip**: Explore all `cc` modules with `cc --help` to see the full power of Agency OS!

Chúc Anh "Bách chiến bách thắng"! 🏯

---

## 📖 Next Steps

**Ready to go deeper?**

1. **[Complete CLI Reference](./CLI_REFERENCE.md)** - Explore all 60+ commands across 9 modules
2. **[Command Index](./command-index.md)** - Quick command lookup (alphabetical + category-based)
3. **[Command Migration Guide](./CLI_REFERENCE.md#-command-migration-guide)** - Transition to modern `cc` commands

**Advanced Topics**:
- Revenue Module for financial automation
- Agent Module for AI orchestration
- DevOps Module for deployment automation
- Analytics Module for business intelligence

**Need help?** Use `cc --help` to explore available commands and modules.