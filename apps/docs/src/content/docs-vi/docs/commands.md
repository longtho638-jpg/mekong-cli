---
title: "Tham Khảo Lệnh CLI"
description: "Hướng dẫn đầy đủ cho Mekong CLI và lệnh kinh doanh"
section: "docs"
---

# Tham Khảo Lệnh Mekong CLI

> 🌊 Mekong CLI: Triển khai Agency trong 15 phút

---

## 🚀 Bắt Đầu Nhanh

```bash
# Cài đặt Mekong CLI
git clone https://github.com/longtho638-jpg/mekong-cli.git
cd mekong-cli
pip install -r requirements.txt

# Tạo dự án đầu tiên
python main.py init my-agency
cd my-agency
python main.py setup-vibe --location "Cần Thơ"
```

---

## 🔧 Lệnh CLI (11)

### Thiết Lập Dự Án

| Lệnh | Mô tả |
|------|-------|
| `mekong init <tên>` | Khởi tạo dự án mới từ template |
| `mekong setup-vibe` | Cấu hình giọng AI cho vùng miền |
| `mekong generate-secrets` | Tạo file .env với API keys |
| `mekong mcp-setup` | Cài đặt MCP servers |

### Triển Khai

| Lệnh | Mô tả |
|------|-------|
| `mekong deploy` | Triển khai lên Google Cloud Run |

### Quản Lý License

| Lệnh | Mô tả |
|------|-------|
| `mekong activate --key <key>` | Kích hoạt license |
| `mekong status` | Xem trạng thái license và quota |

### Test & Debug

| Lệnh | Mô tả |
|------|-------|
| `mekong run-scout <feature>` | Test Scout Agent |
| `mekong agents` | Xem trạng thái AI agents |
| `mekong costs` | Phân tích chi phí Hybrid Router |
| `mekong vibes` | Xem các tùy chọn Vibe |

---

## 🤖 AI Agents (7)

### Hệ thống Quad-Agent (Lõi)

| Agent | Vai trò | Icon |
|-------|---------|------|
| **Scout** | Thu thập thông tin thị trường | 🔍 |
| **Editor** | Biên tập nội dung | ✏️ |
| **Director** | Đạo diễn video | 🎬 |
| **Community** | Đăng bài & tương tác | 🤝 |

### Agents Chuyên Biệt Mekong

| Agent | Vai trò | Icon |
|-------|---------|------|
| **Market Analyst** | Phân tích giá nông sản ĐBSCL | 📊 |
| **Zalo Integrator** | Tích hợp Zalo OA/Mini App | 💬 |
| **Local Copywriter** | Viết content giọng địa phương | 🎤 |

---

## 🏯 Lệnh Kinh Doanh Mekong (28)

> Lệnh tương tác với hỗ trợ song ngữ (VN/EN)

### Chiến Lược & Kế Hoạch

| Lệnh VN | Lệnh EN | Câu hỏi | Mục đích |
|---------|---------|---------|----------|
| `/ke-hoach-kinh-doanh` | `/business-plan` | 9 | Kế hoạch kinh doanh |
| `/nghien-cuu-thi-truong` | `/market-research` | 8 | Phân tích TAM/SAM/SOM |
| `/ke-hoach-tang-truong` | `/growth-strategy` | 8 | Lộ trình tăng trưởng |

### Khách Hàng & Bán Hàng

| Lệnh VN | Lệnh EN | Câu hỏi | Mục đích |
|---------|---------|---------|----------|
| `/khach-hang` | `/customer-profile` | 7 | Chân dung khách hàng |
| `/ban-hang` | `/sales` | 6 | Tối ưu bán hàng |
| `/chien-luoc-ban-hang` | `/sales-strategy` | 8 | Playbook bán hàng |

### Marketing

| Lệnh VN | Lệnh EN | Câu hỏi | Mục đích |
|---------|---------|---------|----------|
| `/tiep-thi` | `/marketing` | 8 | Tự động hóa chiến dịch |
| `/ke-hoach-tiep-thi` | `/marketing-strategy` | 9 | Kế hoạch marketing năm |
| `/noi-dung-tiep-thi` | `/content-marketing` | 8 | Chiến lược nội dung |
| `/y-tuong-social-media` | `/social-media` | 7 | Ý tưởng mạng xã hội |
| `/thong-diep-tiep-thi` | `/messaging` | 7 | Slogan & copy |

### Thương Hiệu & PR

| Lệnh VN | Lệnh EN | Câu hỏi | Mục đích |
|---------|---------|---------|----------|
| `/nhan-dien-thuong-hieu` | `/brand-identity` | 9 | Hệ thống nhận diện |
| `/ke-hoach-pr` | `/pr-plan` | 7 | PR & truyền thông |

### Chuyên Biệt

| Lệnh VN | Lệnh EN | Câu hỏi | Mục đích |
|---------|---------|---------|----------|
| `/nong-san` | `/commodity` | 5 | Phân tích giá nông sản |

**[→ Xem chi tiết Lệnh Mekong](/vi/docs/mekong)**

---

## 📦 Core Modules (154)

Mekong CLI bao gồm 154 Python modules:

- **Hubs**: marketing_hub, sales_hub, finance_hub...
- **Generators**: proposal_generator, content_generator...
- **Binh Pháp**: 13 chương chiến lược
- **Tích hợp**: telegram_bot, slack_integration...

---

## 🎤 Vibe Tuning

Cấu hình giọng AI cho vùng miền:

| ID | Tên | Giọng | Từ khóa |
|----|-----|-------|---------|
| mien-tay | Miền Tây | Thân thiện, ấm áp | hen, nghen, tui |
| mien-bac | Miền Bắc | Lịch sự, trang trọng | ạ, nhé, xin phép |
| mien-trung | Miền Trung | Mộc mạc, thật thà | mô, tê, răng, rứa |
| gen-z | Gen Z | Trendy, năng động | slay, vibe, chill |
| professional | Chuyên nghiệp | Chuyên nghiệp | chiến lược, tối ưu |

---

## 💰 Hybrid Router

Định tuyến AI tối ưu chi phí:

| Provider | Chi phí/1K tokens | Dùng cho |
|----------|-------------------|----------|
| Llama 3.1 8B | $0.0001 | Text đơn giản |
| Llama 3.1 70B | $0.0006 | Công việc vừa |
| Gemini 2.5 Flash | $0.0007 | Vision, context dài |
| Gemini 2.5 Pro | $0.006 | Suy luận phức tạp |
| Claude Sonnet | $0.018 | Code, phân tích |

**Mục tiêu: Giảm 70% chi phí** so với chỉ dùng GPT-4

---

*Mekong CLI v2.0 | 11 Lệnh CLI | 28 Lệnh Kinh Doanh | 154 Modules*
