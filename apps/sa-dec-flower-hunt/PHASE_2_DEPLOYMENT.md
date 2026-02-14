# PHASE 2 DEPLOYMENT GUIDE

**Date**: 07/12/2025  
**Execute these steps in order**

---

## STEP 1: RUN DATABASE MIGRATIONS ✅

### Option A: Via Supabase Dashboard (RECOMMENDED)

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" in left sidebar
4. Create new query

**Migration 1 - Trust & Safety**:
```sql
-- Copy entire contents of:
-- supabase/migrations/20251207_phase2_trust_safety.sql

-- Paste and run
```

**Migration 2 - Marketing Tools**:
```sql
-- Copy entire contents of:
-- supabase/migrations/20251207_phase2_marketing_tools.sql

-- Paste and run
```

### Option B: Via Supabase CLI

```bash
# If you have Supabase CLI installed
cd /Users/macbookprom1/Documents/sa-dec-flower-hunt

# Apply migrations
supabase db push

# Or manually
psql -h [your-db-host] -U postgres -d postgres -f supabase/migrations/20251207_phase2_trust_safety.sql
psql -h [your-db-host] -U postgres -d postgres -f supabase/migrations/20251207_phase2_marketing_tools.sql
```

### Verification:
```sql
-- Check new tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('order_status_history', 'reviews', 'farmer_ratings', 'qr_codes', 'qr_scans', 'referrals');

-- Should return 6 rows
```

---

## STEP 2: TEST FEATURES 🧪

### 2.1 Test Order Tracking

**Create test order** (via Supabase SQL Editor):
```sql
-- Insert test order
INSERT INTO orders (id, recipient_name, recipient_phone, recipient_address, final_price, status)
VALUES (
  gen_random_uuid(),
  'Test Buyer',
  '0901234567',
  '123 Test Street',
  100000,
  'pending'
)
RETURNING id;

-- Copy the returned ID
```

**Update status via API**:
```bash
# Replace [ORDER_ID] with actual ID
curl -X POST http://localhost:3000/api/orders/[ORDER_ID]/update-status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "paid",
    "note": "Payment received",
    "userRole": "system"
  }'
```

**View timeline**:
```bash
curl http://localhost:3000/api/orders/[ORDER_ID]/timeline
```

---

### 2.2 Test Reviews

**Submit test review**:
```sql
-- First, update order to delivered
UPDATE orders SET status = 'delivered' WHERE id = '[ORDER_ID]';
```

```bash
# Submit review via API
curl -X POST http://localhost:3000/api/orders/[ORDER_ID]/review \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 5,
    "comment": "Hoa đẹp, giao hàng nhanh!",
    "buyerId": "[BUYER_ID]"
  }'
```

**Check farmer rating updated**:
```sql
SELECT * FROM farmer_ratings WHERE farmer_id = '[FARMER_ID]';
-- Should show average_rating = 5, total_reviews = 1
```

---

### 2.3 Test QR Code

**Generate QR for farmer**:
```bash
# Via browser
http://localhost:3000/api/farmers/[FARMER_ID]/qr-code

# Download QR image
http://localhost:3000/api/farmers/[FARMER_ID]/qr-code?format=image
```

**Test QR scan**:
```bash
# Get QR code first
curl http://localhost:3000/api/farmers/[FARMER_ID]/qr-code

# Extract the "code" field (e.g., "F0001")

# Scan (will redirect)
curl -L http://localhost:3000/qr/F0001
```

**Check scan count**:
```sql
SELECT * FROM qr_codes WHERE farmer_id = '[FARMER_ID]';
-- scan_count should be incremented

SELECT * FROM qr_scans ORDER BY scanned_at DESC LIMIT 5;
-- Should show your scan
```

---

### 2.4 Test Social Sharing

**Visit product page and click share button** (manual test):
1. Navigate to any flower product
2. Click "Chia sẻ" button
3. Try Facebook, Zalo, Copy link
4. Check analytics:

```sql
SELECT * FROM analytics WHERE event_name = 'product_shared' ORDER BY created_at DESC;
```

---

## STEP 3: LAUNCH SETUP 🚀

### 3.1 Prepare Beta Farmers

**Select 3 farmers from database**:
```sql
-- Get farmers with products
SELECT 
  p.id,
  p.name,
  p.email,
  p.phone,
  COUNT(pr.id) as product_count
FROM profiles p
LEFT JOIN products pr ON pr.farmer_id = p.id
WHERE p.role = 'farmer'
AND pr.id IS NOT NULL
GROUP BY p.id, p.name, p.email, p.phone
ORDER BY product_count DESC
LIMIT 3;
```

### 3.2 Initialize Farmer Data

**For each beta farmer**:
```sql
-- Generate QR code (will auto-create on first API call)
-- Check via: /api/farmers/[FARMER_ID]/qr-code

-- Create sample review (optional, for demo)
INSERT INTO reviews (order_id, buyer_id, farmer_id, rating, comment)
VALUES (
  '[ORDER_ID]',
  '[BUYER_ID]',
  '[FARMER_ID]',
  5,
  'Hoa tươi, đẹp như hình. Sẽ ủng hộ tiếp!'
);
```

### 3.3 Send Beta Invitation

**Email template** (for each farmer):
```
Subject: 🌺 Chúc mừng! Bạn được chọn làm Farmer Beta

Chào [Farmer Name],

Chúc mừng bạn được chọn làm 1 trong 3 nông dân đầu tiên tham gia chương trình Beta của SADEC.OS!

🎁 Quyền lợi Beta Farmer:
- Miễn phí sử dụng 1 tháng
- Ưu tiên hiển thị trên trang chủ
- Hỗ trợ 1-1 từ đội ngũ
- Được tặng QR code in sẵn

📱 Tính năng mới:
1. Theo dõi đơn hàng real-time
2. Nhận đánh giá từ khách
3. Mã QR để khách quét tại chợ
4. Chia sẻ lên Facebook/Zalo

🚀 Bắt đầu ngay:
1. Đăng nhập: https://sadec.os/farmer
2. Xem QR code tại Dashboard
3. In QR và dán tại quầy hàng

Hỗ trợ: [Phone/Zalo]

Trân trọng,
SADEC.OS Team
```

---

## VERIFICATION CHECKLIST

Before considering Phase 2 complete:

- [ ] Both SQL migrations run successfully
- [ ] All 6 new tables created
- [ ] Order timeline displayed correctly
- [ ] Review submission works
- [ ] Farmer rating auto-updates
- [ ] QR code generates and scans
- [ ] Share button posts to Facebook
- [ ] Analytics tracks all events
- [ ] 3 beta farmers identified
- [ ] Beta invitations sent

---

## ROLLBACK (If Needed)

If something breaks:

```sql
-- Drop tables (in reverse order)
DROP TABLE IF EXISTS qr_scans CASCADE;
DROP TABLE IF EXISTS qr_codes CASCADE;
DROP TABLE IF EXISTS referrals CASCADE;
DROP TABLE IF EXISTS farmer_ratings CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS order_status_history CASCADE;

-- Remove escrow columns
ALTER TABLE transactions 
DROP COLUMN IF EXISTS escrow_status,
DROP COLUMN IF EXISTS escrow_released_at,
DROP COLUMN IF EXISTS release_reason;

-- Remove referral code
ALTER TABLE profiles DROP COLUMN IF EXISTS referral_code;
```

---

## POST-DEPLOYMENT MONITORING

**First 24 hours**:
1. Monitor database errors
2. Check API response times
3. Watch QR scan counts
4. Track review submissions

**First week**:
1. Collect farmer feedback
2. Fix any bugs
3. Optimize slow queries
4. Plan Phase 3

**Success Metrics**:
- 10+ QR scans
- 3+ reviews submitted
- 5+ social shares
- 0 major bugs

---

**READY TO DEPLOY!** 🚀
