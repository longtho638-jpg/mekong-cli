# 🌊 Mekong-CLI: Trình khởi tạo Local Agency tự động

Công cụ dòng lệnh giúp triển khai mô hình "Local Marketing Hub" trong 15 phút, dựa trên kiến trúc Hybrid Agentic (Google Cloud Run + Supabase + Vercel).

## Tính năng chính
- **🏗 Auto Scaffold:** Clone cấu trúc chuẩn từ `hybrid-agent-template`.
- **🎨 Vibe Tuning:** Tự động điều chỉnh giọng văn AI (`GEMINI.md`) theo địa phương (VD: Giọng miền Tây, Giọng Bắc).
- **🚀 One-Command Deploy:** Tự động inject secrets và deploy lên Google Cloud Run.

## Cài đặt & Sử dụng

### 1. Cài đặt
```bash
git clone https://github.com/YOUR_USERNAME/mekong-cli.git
cd mekong-cli
pip install -r requirements.txt
```

### 2. Khởi tạo Agency mới (Ví dụ: Long Xuyên)
```bash
python3 main.py init long-xuyen-hub
cd long-xuyen-hub
```

### 3. Cấu hình "Linh hồn" (Vibe)
```bash
python3 ../main.py setup-vibe
# Nhập: Niche="Lúa Gạo", Location="An Giang", Tone="Chân chất"
```

### 4. Tạo Secrets
```bash
python3 ../main.py generate-secrets
```

### 5. Kích hoạt hệ thống
```bash
python3 ../main.py deploy
```

---

## Kiến trúc

- **Mekong-CLI**: Python (Typer, Rich)
- **Template**:
  - Frontend: Next.js (Mission Control)
  - Backend: Python FastAPI (Agent Core)
  - Engine: Google Gemini (Vision) + OpenRouter (Text) + ElevenLabs (Voice)

## Chiến lược Nhượng quyền Agency

1. **Chuẩn hóa**: Mọi Agency con đều dùng chung cấu trúc code (Golden Template).
2. **Tốc độ**: Setup 15 phút thay vì 2 tuần.
3. **An toàn**: Data Diet & Hybrid Router tích hợp sẵn để tối ưu chi phí.
