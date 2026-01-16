---
description: Hướng dẫn sử dụng Cloudflare cho người không biết code (wizard tiếng Việt)
---

# 🌩️ CF-Easy - Cloudflare cho Mọi Người

> Workflow này hướng dẫn từng bước để deploy lên Cloudflare, **không cần biết code**.

// turbo-all

## Bước 1: Xác định mục tiêu

Hỏi người dùng:

```
🌩️ CF-EASY - Cloudflare Wizard
═══════════════════════════════════════

Bạn muốn làm gì với Cloudflare?

1. 🌐 Đăng website tĩnh (HTML, React, Vue...)
2. ⚡ Tạo API serverless
3. 📁 Lưu trữ file/hình ảnh
4. 🗄️ Tạo database online
5. 🤖 Dùng AI tại edge

Nhập số (1-5):
```

## Bước 2: Hướng dẫn theo lựa chọn

### Nếu chọn 1 (Website tĩnh):

```
📋 ĐĂNG WEBSITE TĨNH

Bước 1: Chuẩn bị
   - Folder chứa website của bạn (có file index.html)
   - Ví dụ: ./my-website hoặc ./dist

Bước 2: Cài đặt Wrangler
   npm install -g wrangler

Bước 3: Đăng nhập Cloudflare
   wrangler login
   (Mở trình duyệt để xác thực)

Bước 4: Deploy
   wrangler pages deploy ./my-website

✅ Xong! Website sẽ có link dạng: https://xxx.pages.dev
```

### Nếu chọn 2 (API Serverless):

```
📋 TẠO API SERVERLESS

Bước 1: Tạo project
   wrangler init my-api
   cd my-api

Bước 2: Viết API (sửa file src/index.js)
   // Ví dụ API đơn giản
   export default {
     async fetch(request) {
       return Response.json({ message: "Hello!" });
     }
   };

Bước 3: Test local
   wrangler dev

Bước 4: Deploy
   wrangler deploy

✅ Xong! API sẽ có link dạng: https://my-api.xxx.workers.dev
```

### Nếu chọn 3 (Lưu file):

```
📋 LƯU TRỮ FILE (R2 Storage)

Bước 1: Tạo bucket
   wrangler r2 bucket create my-files

Bước 2: Upload file
   wrangler r2 object put my-files/photo.jpg --file=./photo.jpg

Bước 3: Xem file
   wrangler r2 object list my-files

💡 Mẹo: R2 KHÔNG tính phí download (khác S3)!
   - Upload: Miễn phí 10GB/tháng
   - Download: Miễn phí hoàn toàn
```

### Nếu chọn 4 (Database):

```
📋 TẠO DATABASE (D1)

Bước 1: Tạo database
   wrangler d1 create my-database

Bước 2: Tạo bảng
   wrangler d1 execute my-database --command="
     CREATE TABLE users (
       id INTEGER PRIMARY KEY,
       name TEXT,
       email TEXT
     )
   "

Bước 3: Thêm dữ liệu
   wrangler d1 execute my-database --command="
     INSERT INTO users (name, email) VALUES ('Anh', 'anh@email.com')
   "

Bước 4: Xem dữ liệu
   wrangler d1 execute my-database --command="SELECT * FROM users"

✅ Database SQLite miễn phí, replicate toàn cầu!
```

### Nếu chọn 5 (AI):

```
📋 SỬ DỤNG AI TẠI EDGE

Bước 1: Tạo Worker với AI
   wrangler init my-ai-app
   cd my-ai-app

Bước 2: Thêm AI binding (wrangler.toml)
   [ai]
   binding = "AI"

Bước 3: Viết code AI (src/index.js)
   export default {
     async fetch(request, env) {
       const result = await env.AI.run('@cf/meta/llama-2-7b-chat-int8', {
         messages: [{ role: 'user', content: 'Hello!' }]
       });
       return Response.json(result);
     }
   };

Bước 4: Deploy
   wrangler deploy

✅ Miễn phí 10,000 tokens/ngày!
```

## Bước 3: Xác nhận thành công

```
🎉 HOÀN THÀNH!

✅ Đã deploy thành công lên Cloudflare
📍 Link: [hiển thị link deploy]

📊 Bước tiếp theo:
   - Xem dashboard: https://dash.cloudflare.com
   - Thêm custom domain
   - Xem analytics

Cần hỗ trợ thêm? Chạy /cloudflare hoặc hỏi em!
```

## Các lệnh hữu ích

| Việc cần làm | Lệnh                               |
| ------------ | ---------------------------------- |
| Đăng nhập    | `wrangler login`                   |
| Xem projects | `wrangler pages project list`      |
| Xóa deploy   | `wrangler pages deployment delete` |
| Xem logs     | `wrangler tail`                    |
| Xem secrets  | `wrangler secret list`             |
