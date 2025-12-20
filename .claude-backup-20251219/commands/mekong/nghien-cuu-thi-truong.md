# /nghien-cuu-thi-truong - Market Research (Nghiên cứu Thị trường)

Spawn agent: `scout` + `researcher` + `scout-external`

## Mục đích

Nghiên cứu thị trường toàn diện cho ngành hàng/sản phẩm tại ĐBSCL và Việt Nam.

## Cách sử dụng

```
/nghien-cuu-thi-truong "thị trường nông sản hữu cơ ĐBSCL"
/nghien-cuu-thi-truong "ngành logistics nông nghiệp"
/nghien-cuu-thi-truong "thương mại điện tử nông thôn"
```

## Workflow

1. **Thu thập dữ liệu**
   - Số liệu thống kê ngành
   - Báo cáo thị trường
   - Tin tức và xu hướng

2. **Phân tích Quy mô**
   - TAM (Total Addressable Market)
   - SAM (Serviceable Available Market)
   - SOM (Serviceable Obtainable Market)

3. **Phân tích Cạnh tranh**
   - Đối thủ trực tiếp
   - Đối thủ gián tiếp
   - Market share estimates

4. **Xu hướng & Dự báo**
   - Industry trends
   - Growth drivers
   - Threats & challenges

5. **Cơ hội Thị trường**
   - Gaps trong thị trường
   - Unmet needs
   - Entry strategies

## Output Format

```markdown
# Nghiên Cứu Thị Trường: [Ngành/Sản phẩm]

📅 Ngày: [date]
🎯 Độ tin cậy: [X]%
📍 Khu vực: ĐBSCL / Việt Nam

---

## 1. Tổng Quan Thị Trường

### 1.1 Định nghĩa Ngành
[Mô tả ngành, phạm vi nghiên cứu]

### 1.2 Quy Mô Thị Trường

| Metric | Giá trị | Nguồn |
|--------|---------|-------|
| TAM | X tỷ VNĐ | [source] |
| SAM | X tỷ VNĐ | [source] |
| SOM | X tỷ VNĐ | Estimate |
| CAGR | X% | [source] |

### 1.3 Tăng trưởng Lịch sử
[Chart/data về growth qua các năm]

---

## 2. Phân Tích Cạnh Tranh

### 2.1 Landscape
| Player | Market Share | Điểm mạnh | Điểm yếu |
|--------|--------------|-----------|----------|
| A | X% | ... | ... |
| B | X% | ... | ... |
| C | X% | ... | ... |

### 2.2 Porter's Five Forces
- Threat of New Entrants: [High/Medium/Low]
- Bargaining Power of Suppliers: [High/Medium/Low]
- Bargaining Power of Buyers: [High/Medium/Low]
- Threat of Substitutes: [High/Medium/Low]
- Industry Rivalry: [High/Medium/Low]

### 2.3 Competitive Advantages
[Những yếu tố tạo lợi thế cạnh tranh trong ngành]

---

## 3. Xu Hướng Thị Trường

### 3.1 Macro Trends
- 📈 [Trend 1]: [Impact]
- 📈 [Trend 2]: [Impact]
- 📉 [Decline 1]: [Impact]

### 3.2 Consumer Behavior Shifts
[Thay đổi trong hành vi người tiêu dùng]

### 3.3 Technology Trends
[Công nghệ ảnh hưởng đến ngành]

---

## 4. Cơ Hội & Thách Thức

### 4.1 Market Gaps
| Gap | Size | Difficulty |
|-----|------|------------|
| [Gap 1] | X tỷ | Medium |
| [Gap 2] | X tỷ | Low |

### 4.2 Entry Barriers
- [Barrier 1]
- [Barrier 2]

### 4.3 Success Factors
- [KSF 1]
- [KSF 2]

---

## 5. Khuyến Nghị

### 5.1 Chiến lược Entry
> [Recommendation tóm tắt]

### 5.2 Target Segments
1. **Primary**: [Segment]
2. **Secondary**: [Segment]

### 5.3 Action Items
- [ ] [Action 1]
- [ ] [Action 2]
- [ ] [Action 3]

---

## Nguồn Tham Khảo
1. [Source 1]
2. [Source 2]
3. [Source 3]
```

## Ví dụ

```
/nghien-cuu-thi-truong "thị trường trái cây xuất khẩu ĐBSCL"

# Nghiên Cứu: Trái Cây Xuất Khẩu ĐBSCL

## Quy Mô
- TAM: $3.5 tỷ (trái cây VN 2024)
- SAM: $1.2 tỷ (ĐBSCL)
- SOM: $50 triệu (premium segment)

## Top Competitors
- Vina T&T: 15% market share
- Chánh Thu: 12%
- Hoàng Gia: 8%

## Xu Hướng
📈 Organic +25%/năm
📈 E-commerce +40%/năm
📉 Traditional retail -5%/năm

## Cơ Hội
- Gap: Truy xuất nguồn gốc (~$100M)
- Gap: D2C fresh fruit (~$50M)
```

## Data Sources

| Nguồn | Loại data |
|-------|-----------|
| GSO Vietnam | Thống kê quốc gia |
| Sở NN&PTNT | Data địa phương |
| Nielsen | Consumer insights |
| VIRAC | Industry reports |

## Best Practices

1. **Primary + Secondary** - Kết hợp nhiều nguồn
2. **Recent data** - Ưu tiên data < 2 năm
3. **Local context** - Hiểu rõ đặc thù ĐBSCL
4. **Validate** - Cross-check với experts
