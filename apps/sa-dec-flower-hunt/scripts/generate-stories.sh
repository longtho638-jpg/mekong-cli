#!/bin/bash
# =============================================================================
# 🌸 SADEC FARMER STORY GENERATOR - WOW EDITION
# =============================================================================
# Generate 10 authentic, emotional farmer stories using Gemini AI
# Each story captures the heart, soul, and passion of Sa Đéc flower artisans
#
# SECURITY: Uses GEMINI_API_KEY from environment (never hardcode!)
# USAGE: GEMINI_API_KEY=your_key ./generate-stories.sh
# =============================================================================

set -e

# Check API Key
API_KEY="${GEMINI_API_KEY:-}"
if [ -z "$API_KEY" ]; then
  echo "❌ Error: GEMINI_API_KEY environment variable not set"
  echo ""
  echo "Usage:"
  echo "  export GEMINI_API_KEY='your-gemini-api-key'"
  echo "  ./scripts/generate-stories.sh"
  echo ""
  echo "Get your API key at: https://makersuite.google.com/app/apikey"
  exit 1
fi

OUTPUT_DIR="content/farmer-stories"
mkdir -p "$OUTPUT_DIR"

echo "🌸 ═══════════════════════════════════════════════════════════"
echo "   SADEC FARMER STORY GENERATOR - WOW EDITION"
echo "   Tạo 10 câu chuyện cảm động từ làng hoa Sa Đéc"
echo "🌸 ═══════════════════════════════════════════════════════════"
echo ""

# Farmer data - Based on real Sa Đéc flower village structure
declare -a FARMERS=(
  "Nguyễn Văn Thanh|52|Cúc mâm xôi vàng|30 năm|Ấp Tân Quy Đông|nguyen-van-thanh"
  "Trần Thị Mai|45|Hoa hồng cổ|25 năm|Làng hoa Sa Đéc|tran-thi-mai"
  "Lê Hoàng Long|38|Mai vàng Bình Định|15 năm|Ấp Tân Khánh|le-hoang-long"
  "Phạm Thị Hương|60|Vạn thọ đỏ|40 năm|Làng hoa Tân Quy Đông|pham-thi-huong"
  "Võ Văn Minh|55|Cẩm chướng Pháp|35 năm|Ấp Tân Mỹ|vo-van-minh"
  "Nguyễn Thị Lan|42|Lily trắng|20 năm|Làng hoa Sa Đéc|nguyen-thi-lan"
  "Trần Văn Đức|48|Đồng tiền đỏ|27 năm|Ấp Tân Phú|tran-van-duc"
  "Huỳnh Thị Kim|35|Hướng dương Nhật|12 năm|Làng hoa Tân Quy|huynh-thi-kim"
  "Lý Văn Thành|65|Cúc đại đóa|45 năm|Ấp cổ Sa Đéc|ly-van-thanh"
  "Đặng Thị Ngọc|50|Lan Hồ Điệp|30 năm|Làng hoa Sa Đéc|dang-thi-ngoc"
)

TOTAL=${#FARMERS[@]}
ALL_STORIES="["

for i in "${!FARMERS[@]}"; do
  IFS='|' read -r NAME AGE SPECIALTY EXPERIENCE LOCATION SLUG <<< "${FARMERS[$i]}"
  
  INDEX=$((i + 1))
  echo "🌺 [$INDEX/$TOTAL] Đang tạo câu chuyện: $NAME..."
  echo "   └── Đặc sản: $SPECIALTY | Kinh nghiệm: $EXPERIENCE"
  
  # Create the prompt
  PROMPT="Bạn là nhà văn chuyên viết về văn hóa làng nghề Việt Nam. Hãy viết một profile CẢM ĐỘNG và CHÂN THỰC cho nông dân trồng hoa Sa Đéc.

THÔNG TIN:
- Tên: $NAME
- Tuổi: $AGE
- Đặc sản: $SPECIALTY  
- Kinh nghiệm: $EXPERIENCE
- Địa điểm: $LOCATION, Sa Đéc, Đồng Tháp

YÊU CẦU VIẾT:
1. JOURNEY (Hành trình): Họ bắt đầu với nghề trồng hoa như thế nào? Có chi tiết cụ thể về thời điểm, hoàn cảnh gia đình.
2. PASSION (Đam mê): Điều gì khiến họ yêu công việc này qua bao năm? Khoảnh khắc nào khiến họ tự hào nhất?
3. CHALLENGES (Thử thách): Những khó khăn lớn nhất họ đã vượt qua - thiên tai, dịch bệnh, kinh tế.
4. MASTERY (Bí quyết): Kỹ thuật độc đáo riêng, bí mật nghề nghiệp được truyền qua thế hệ.
5. DREAM (Ước mơ): Platform SADEC.OS có ý nghĩa gì với họ và tương lai làng hoa?

PHONG CÁCH:
- Viết ngôi thứ nhất (Tôi...)
- Giọng văn THÂN MẬT, CHÂN THÀNH như đang kể chuyện cho bạn bè
- Có CẢM XÚC thật sự - đọc xong phải RƠI NƯỚC MẮT hoặc MỈM CƯỜI
- 400-500 từ tiếng Việt
- Dùng từ ngữ miền Tây tự nhiên

OUTPUT JSON (NGHIÊM NGẶT):
{
  \"id\": \"$SLUG\",
  \"farmerName\": \"$NAME\",
  \"age\": $AGE,
  \"specialty\": \"$SPECIALTY\",
  \"experience\": \"$EXPERIENCE\",
  \"location\": \"$LOCATION\",
  \"title\": \"[Tiêu đề cảm xúc về họ]\",
  \"subtitle\": \"[Câu phụ đề ngắn gọn]\",
  \"story\": \"[Câu chuyện đầy đủ 400-500 từ]\",
  \"quote\": \"[Câu nói đặc trưng của họ - sâu sắc, đọng lại]\",
  \"funFact\": \"[Điều thú vị ít ai biết về họ]\",
  \"tags\": [\"tag1\", \"tag2\", \"tag3\"]
}

CHỈ TRẢ VỀ JSON, KHÔNG CÓ TEXT KHÁC."

  # Call Gemini API
  RESPONSE=$(curl -s -X POST \
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=$API_KEY" \
    -H 'Content-Type: application/json' \
    -d "{
      \"contents\": [{
        \"parts\": [{
          \"text\": $(echo "$PROMPT" | jq -Rs .)
        }]
      }],
      \"generationConfig\": {
        \"temperature\": 0.9,
        \"topP\": 0.95,
        \"maxOutputTokens\": 2048
      }
    }")
  
  # Extract JSON from response
  STORY=$(echo "$RESPONSE" | jq -r '.candidates[0].content.parts[0].text' 2>/dev/null | grep -oP '\{[\s\S]*\}' | head -1)
  
  if [ -n "$STORY" ] && [ "$STORY" != "null" ]; then
    # Add avatar URL
    STORY=$(echo "$STORY" | jq --arg avatar "https://api.dicebear.com/7.x/personas/svg?seed=$SLUG&backgroundColor=fef3c7" '. + {avatar: $avatar}')
    
    # Save individual file
    echo "$STORY" | jq '.' > "$OUTPUT_DIR/$SLUG.json"
    echo "   ✅ Đã lưu: $OUTPUT_DIR/$SLUG.json"
    
    # Add to collection
    if [ "$i" -gt 0 ]; then
      ALL_STORIES="$ALL_STORIES,"
    fi
    ALL_STORIES="$ALL_STORIES$STORY"
  else
    echo "   ⚠️  Lỗi tạo câu chuyện cho $NAME"
    echo "   Response: $(echo "$RESPONSE" | head -c 200)"
  fi
  
  # Rate limit - wait between requests
  if [ "$INDEX" -lt "$TOTAL" ]; then
    echo "   ⏳ Đang chờ 3 giây..."
    sleep 3
  fi
  echo ""
done

# Close array and save all stories
ALL_STORIES="$ALL_STORIES]"
echo "$ALL_STORIES" | jq '.' > "$OUTPUT_DIR/all-stories.json"

echo "🌸 ═══════════════════════════════════════════════════════════"
echo "   ✅ HOÀN TẤT! Đã tạo $TOTAL câu chuyện nông dân Sa Đéc"
echo "   📁 Output: $OUTPUT_DIR/"
echo "   📄 All stories: $OUTPUT_DIR/all-stories.json"
echo "🌸 ═══════════════════════════════════════════════════════════"
echo ""
echo "💡 Các bước tiếp theo:"
echo "   1. Review từng file JSON trong $OUTPUT_DIR/"
echo "   2. Chỉnh sửa nếu cần thiết"
echo "   3. Deploy website để xem trên /farmers"
echo ""
