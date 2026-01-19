# 🏆 TOP-TIER ARCHITECTURE REPOSITORIES
> **"Bản vẽ móng" cho hệ thống bền vững**

Dưới đây là danh sách các repository chuẩn mực nhất về kiến trúc phần mềm. AI Agent **BẮT BUỘC** phải tham chiếu các pattern này khi được yêu cầu xây dựng backend phức tạp.

## 1. Domain-Driven Hexagon (The Bible of DDD)
*   **Link:** [github.com/Sairyss/domain-driven-hexagon](https://github.com/Sairyss/domain-driven-hexagon) (⭐️ 12k+)
*   **Tech Stack:** TypeScript, NestJS, PostgreSQL.
*   **Đặc điểm:** Tài liệu học thuật cực kỳ chi tiết về DDD, Hexagonal, SOLID.
*   **Khi nào dùng:** 
    *   Dự án Backend Enterprise.
    *   Domain Logic cực kỳ phức tạp (Financial, Logistics, Healthcare).
    *   Cần tách biệt hoàn toàn Business Logic khỏi Framework.

## 2. Clean Architecture Next.js
*   **Link:** [github.com/Melzar/clean-architecture-nextjs-react-boilerplate](https://github.com/Melzar/clean-architecture-nextjs-react-boilerplate)
*   **Tech Stack:** Next.js 14, TypeScript, React.
*   **Đặc điểm:** Áp dụng Clean Arch cho Frontend/Fullstack. Tách rõ `Application Layer` (Use Cases) khỏi `UI Layer`.
*   **Khi nào dùng:** 
    *   Dự án Fullstack Next.js quy mô lớn.
    *   Tránh tình trạng "Spaghetti code" trong các file `page.tsx` hoặc `route.ts`.

## 3. DDD-Hexagonal-CQRS-ES-EDA (The All-in-One)
*   **Link:** [github.com/bitloops/ddd-hexagonal-cqrs-es-eda](https://github.com/bitloops/ddd-hexagonal-cqrs-es-eda)
*   **Tech Stack:** TypeScript, NestJS.
*   **Đặc điểm:** Combo hạng nặng: DDD + Hexagonal + CQRS + Event Sourcing.
*   **Khi nào dùng:** 
    *   Microservices.
    *   Hệ thống cần Audit Log chi tiết (Event Sourcing).
    *   Hệ thống có tải đọc/ghi chênh lệch lớn (CQRS).

## 4. TypeScript DDD Example (Codely)
*   **Link:** [github.com/CodelyTV/typescript-ddd-example](https://github.com/CodelyTV/typescript-ddd-example)
*   **Đặc điểm:** Code mẫu từ CodelyTV - team đào tạo DDD hàng đầu. Chuẩn mực từng dòng code.
*   **Khi nào dùng:** 
    *   Để học và copy các pattern nhỏ (Value Objects, Aggregates).

## 5. Node API Boilerplate (Clean & Simple)
*   **Link:** [github.com/talyssonoc/node-api-boilerplate](https://github.com/talyssonoc/node-api-boilerplate) (⭐️ 3.3k+)
*   **Tech Stack:** Node.js (Framework agnostic).
*   **Đặc điểm:** Đơn giản hóa Clean Architecture, dễ tiếp cận hơn Sairyss.
*   **Khi nào dùng:** 
    *   REST API Backend tiêu chuẩn.
    *   Team mới bắt đầu làm quen với Clean Arch.

## 6. Awesome DDD (The Map)
*   **Link:** [github.com/heynickc/awesome-ddd](https://github.com/heynickc/awesome-ddd)
*   **Đặc điểm:** Danh sách tổng hợp resources.
*   **Khi nào dùng:** Khi cần tìm kiếm các library hoặc pattern cụ thể khác.

---

## ⚠️ Nguyên Tắc Vibe Coding "Có Não"

1.  **Không:** "Viết cho tôi cái app bán hàng".
2.  **Nên:** "Dựa trên repo **Sairyss/domain-driven-hexagon**, hãy scaffold cấu trúc thư mục cho module `Order` gồm `CreateOrderUseCase` và `OrderAggregate`."
