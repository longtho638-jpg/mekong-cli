# 🌊 MEKONG-CLI: Trình Khởi Tạo Local Agency Tự Động

> **"Deploy Your Agency in 15 Minutes"**  
> Công cụ dòng lệnh giúp triển khai mô hình "Local Marketing Hub" với chi phí tối ưu.

## ✨ Tính Năng Chính

| Tính năng | Mô tả |
|-----------|-------|
| 🏗 **Auto Scaffold** | Clone cấu trúc chuẩn từ Golden Template |
| 🎨 **Vibe Tuning** | Điều chỉnh giọng văn AI theo địa phương |
| 🔌 **MCP Integration** | Tích hợp 7 MCP servers (Genmedia, Playwright, Twitter...) |
| 🚀 **One-Command Deploy** | Tự động inject secrets và deploy lên Cloud Run |
| 🔐 **License System** | 3 tiers: Starter, Pro, Enterprise |

## 📦 Cài Đặt

```bash
# Clone repo
git clone https://github.com/longtho638-jpg/mekong-cli.git
cd mekong-cli

# Install dependencies
pip install -r requirements.txt

# Install globally (optional)
pip install -e .
```

## 🚀 Quick Start

### 1. Khởi Tạo Project

```bash
mekong init my-agency
cd my-agency
```

### 2. Cấu Hình "Linh Hồn" (Vibe)

```bash
mekong setup-vibe
# Chọn: Niche, Location, Tone
```

### 3. Setup MCP Servers

```bash
mekong mcp-setup
```

### 4. Tạo Secrets

```bash
mekong generate-secrets
```

### 5. Deploy

```bash
mekong deploy
```

## 💰 Pricing

| Tier | Price | Features |
|------|-------|----------|
| **Starter** | $0 | 1 video/day, 1 niche |
| **Pro** | $497 | 10 videos/day, 10 niches, white-label |
| **Enterprise** | $2,997 | Unlimited, custom training |

```bash
# Activate license
mekong activate --key mk_live_pro_xxxxx

# Check status
mekong status
```

## 🏗 Kiến Trúc

```
MEKONG-CLI
├── Golden Template (hybrid-agent-template)
│   ├── Backend: Python + FastAPI + Cloud Run
│   ├── Frontend: Next.js (Mission Control)
│   └── Agents: Scout, Editor, Director, Community
├── Hybrid Router
│   ├── OpenRouter (text/code - cheap)
│   └── Google Vertex AI (vision/media)
└── MCP Integration
    ├── genmedia (Imagen/Veo)
    ├── playwright (scraping)
    ├── twitter/reddit (posting)
    └── gcloud (deploy)
```

## 📋 CLI Commands

| Command | Description |
|---------|-------------|
| `mekong init <name>` | Khởi tạo project mới |
| `mekong setup-vibe` | Cấu hình giọng văn AI |
| `mekong mcp-setup` | Cài đặt MCP servers |
| `mekong generate-secrets` | Tạo file .env |
| `mekong deploy` | Deploy lên Cloud Run |
| `mekong activate --key` | Kích hoạt license |
| `mekong status` | Xem trạng thái license |
| `mekong run-scout <feature>` | Test Scout Agent |

## 🎯 Use Cases

1. **Marketing Agency**: Tự động hóa content cho SMEs địa phương
2. **Franchise Model**: Nhân bản agency với cấu trúc chuẩn
3. **AI Content Hub**: Tạo video/blog/post tự động từ code

## 📚 Links

- **Landing Page**: https://mekong-landing.vercel.app
- **Pro Template**: Private repo (license required)
- **Documentation**: `/docs` directory

---

© 2024 MEKONG-CLI | Built with ❤️ for Vietnamese SMEs
