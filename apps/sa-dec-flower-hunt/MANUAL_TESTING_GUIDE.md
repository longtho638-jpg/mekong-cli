# PHASE 2 MANUAL TESTING GUIDE

**Date**: 07/12/2025  
**Duration**: 30 minutes  
**Server**: http://localhost:3000

---

## 🎯 TESTING SEQUENCE

### PART 1: Database Verification (5 phút)

**Via Supabase Dashboard → SQL Editor**

#### Test 1: Verify Tables Exist
```sql
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name IN (
  'order_status_history',
  'reviews',
  'farmer_ratings',
  'qr_codes',
  'qr_scans'
)
ORDER BY table_name;
```
✅ Expected: 5 rows

#### Test 2: Check Triggers
```sql
SELECT 
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_update_farmer_ratings';
```
✅ Expected: 1 row showing trigger on 'reviews' table

#### Test 3: Check Functions
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_type = 'FUNCTION'
AND routine_name IN ('update_farmer_ratings', 'generate_farmer_qr_code');
```
✅ Expected: 2 functions

---

### PART 2: Create Test Data (5 phút)

**Via Supabase Dashboard → Table Editor**

#### Step 1: Create Test Farmer
```sql
-- In profiles table (or via Auth)
INSERT INTO profiles (id, name, email, phone, role)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Test Farmer',
  'farmer@test.com',
  '0901234567',
  'farmer'
)
ON CONFLICT (id) DO NOTHING
RETURNING *;
```

#### Step 2: Create Test Order
```sql
INSERT INTO orders (
  id,
  recipient_name,
  recipient_phone,
  recipient_address,
  final_price,
  status
) VALUES (
  '00000000-0000-0000-0000-000000000100',
  'Test Buyer',
  '0909999999',
  '123 Test Street, Sa Dec',
  100000,
  'pending'
)
ON CONFLICT (id) DO NOTHING
RETURNING *;
```

#### Step 3: Create Order Item (link to farmer)
```sql
INSERT INTO order_items (
  order_id,
  farmer_id,
  product_id,
  quantity,
  price
) VALUES (
  '00000000-0000-0000-0000-000000000100',
  '00000000-0000-0000-0000-000000000001',
  NULL, -- or real product_id
  1,
  100000
)
ON CONFLICT DO NOTHING;
```

---

### PART 3: API Testing (10 phút)

**Open Terminal → Run these curl commands**

#### Test 1: Update Order Status ✅
```bash
curl -X POST http://localhost:3000/api/orders/00000000-0000-0000-0000-000000000100/update-status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "paid",
    "note": "Payment received via PayOS",
    "userRole": "system"
  }' | jq
```

**Expected Response**:
```json
{
  "success": true,
  "order": { "status": "paid", ... },
  "previousStatus": "pending"
}
```

**Verify in DB**:
```sql
SELECT * FROM order_status_history 
WHERE order_id = '00000000-0000-0000-0000-000000000100'
ORDER BY created_at DESC;
```
✅ Should show 2 entries: 'pending' → 'paid'

---

#### Test 2: View Order Timeline ✅
```bash
curl http://localhost:3000/api/orders/00000000-0000-0000-0000-000000000100/timeline | jq
```

**Expected Response**:
```json
{
  "order": { "id": "...", "currentStatus": "paid" },
  "timeline": [
    { "status": "pending", "timestamp": "..." },
    { "status": "paid", "timestamp": "..." }
  ]
}
```

---

#### Test 3: Update to Delivered ✅
```bash
# First: paid → shipped
curl -X POST http://localhost:3000/api/orders/00000000-0000-0000-0000-000000000100/update-status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "shipped",
    "note": "Sent via express delivery",
    "userRole": "farmer"
  }' | jq

# Then: shipped → delivered
curl -X POST http://localhost:3000/api/orders/00000000-0000-0000-0000-000000000100/update-status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "delivered",
    "note": "Customer confirmed receipt",
    "userRole": "buyer"
  }' | jq
```

---

#### Test 4: Submit Review ✅
```bash
curl -X POST http://localhost:3000/api/orders/00000000-0000-0000-0000-000000000100/review \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 5,
    "comment": "Hoa tươi đẹp, giao hàng nhanh chóng. Rất hài lòng!",
    "photos": [],
    "buyerId": "00000000-0000-0000-0000-000000000002"
  }' | jq
```

**Expected**: `{ "success": true, "review": {...} }`

**Verify Trigger Worked**:
```sql
-- Check review inserted
SELECT * FROM reviews 
WHERE order_id = '00000000-0000-0000-0000-000000000100';

-- Check farmer_ratings auto-updated
SELECT * FROM farmer_ratings 
WHERE farmer_id = '00000000-0000-0000-0000-000000000001';
```
✅ farmer_ratings should show:
- average_rating: 5.00
- total_reviews: 1
- five_star: 1

---

#### Test 5: Get Farmer Reviews ✅
```bash
curl "http://localhost:3000/api/farmers/00000000-0000-0000-0000-000000000001/reviews?limit=10" | jq
```

**Expected Response**:
```json
{
  "reviews": [
    {
      "rating": 5,
      "comment": "Hoa tươi đẹp...",
      "created_at": "...",
      "profiles": { "name": "..." }
    }
  ],
  "summary": {
    "average_rating": 5.00,
    "total_reviews": 1,
    "five_star": 1,
    ...
  }
}
```

---

#### Test 6: Generate QR Code ✅
```bash
# Get QR data
curl http://localhost:3000/api/farmers/00000000-0000-0000-0000-000000000001/qr-code | jq
```

**Expected Response**:
```json
{
  "qrCode": {
    "id": "...",
    "code": "F0001",
    "url": "http://localhost:3000/qr/F0001",
    "scanCount": 0
  }
}
```

**Download QR Image**:
```bash
curl "http://localhost:3000/api/farmers/00000000-0000-0000-0000-000000000001/qr-code?format=image" > test_qr.png
open test_qr.png  # Mac
# Or: xdg-open test_qr.png  # Linux
```
✅ Should see QR code image

---

#### Test 7: Scan QR Code ✅
```bash
# This will redirect, use -L to follow
curl -L "http://localhost:3000/qr/F0001"
```

**Expected**: Redirect to `/farmer-shop/00000000-0000-0000-0000-000000000001?ref=qr-F0001`

**Verify Scan Tracked**:
```sql
SELECT * FROM qr_scans ORDER BY scanned_at DESC LIMIT 5;
```
✅ Should show new scan entry

**Check Scan Count**:
```sql
SELECT code, scan_count FROM qr_codes 
WHERE farmer_id = '00000000-0000-0000-0000-000000000001';
```
✅ scan_count should increment

---

### PART 4: UI Component Testing (10 phút)

**Via Browser: http://localhost:3000**

#### Test 1: Create Test Page
Create: `app/test-phase2/page.tsx`

```tsx
"use client";

import { OrderTimeline } from "@/components/orders/OrderTimeline";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { FarmerRatingSummary } from "@/components/reviews/FarmerRatingSummary";
import { ReviewList } from "@/components/reviews/ReviewList";
import { ShareButton } from "@/components/marketing/ShareButton";
import { QRCodeDisplay } from "@/components/marketing/QRCodeDisplay";

const TEST_ORDER_ID = "00000000-0000-0000-0000-000000000100";
const TEST_FARMER_ID = "00000000-0000-0000-0000-000000000001";

export default function TestPhase2Page() {
  return (
    <div className="min-h-screen bg-black text-white p-8 space-y-12">
      <h1 className="text-3xl font-bold text-emerald-500">Phase 2 Component Testing</h1>
      
      {/* Test 1: Order Timeline */}
      <section className="border border-stone-800 p-6 rounded">
        <h2 className="text-xl font-bold mb-4 text-cyan-400">1. Order Timeline</h2>
        <OrderTimeline orderId={TEST_ORDER_ID} />
      </section>

      {/* Test 2: Review Form */}
      <section className="border border-stone-800 p-6 rounded">
        <h2 className="text-xl font-bold mb-4 text-cyan-400">2. Review Form</h2>
        <ReviewForm orderId={TEST_ORDER_ID} buyerId="test-buyer-id" />
      </section>

      {/* Test 3: Farmer Rating Summary */}
      <section className="border border-stone-800 p-6 rounded">
        <h2 className="text-xl font-bold mb-4 text-cyan-400">3. Farmer Rating Summary</h2>
        <FarmerRatingSummary farmerId={TEST_FARMER_ID} />
      </section>

      {/* Test 4: Review List */}
      <section className="border border-stone-800 p-6 rounded">
        <h2 className="text-xl font-bold mb-4 text-cyan-400">4. Review List</h2>
        <ReviewList farmerId={TEST_FARMER_ID} limit={5} />
      </section>

      {/* Test 5: Share Button */}
      <section className="border border-stone-800 p-6 rounded">
        <h2 className="text-xl font-bold mb-4 text-cyan-400">5. Share Button</h2>
        <ShareButton 
          url="http://localhost:3000/test"
          title="Test Product"
          description="Testing share functionality"
        />
      </section>

      {/* Test 6: QR Code Display */}
      <section className="border border-stone-800 p-6 rounded">
        <h2 className="text-xl font-bold mb-4 text-cyan-400">6. QR Code Display</h2>
        <QRCodeDisplay farmerId={TEST_FARMER_ID} />
      </section>
    </div>
  );
}
```

#### Navigate to Test Page
Open: **http://localhost:3000/test-phase2**

**Visual Checklist**:
- [ ] OrderTimeline shows vertical timeline with icons
- [ ] Current status is highlighted
- [ ] ReviewForm has 5 clickable stars
- [ ] Comment textarea is working
- [ ] FarmerRatingSummary shows 5.00 rating
- [ ] Rating distribution bars animate
- [ ] ReviewList shows the review we submitted
- [ ] ShareButton opens dropdown menu
- [ ] Facebook/Zalo/Copy options work
- [ ] QRCodeDisplay shows QR code image
- [ ] Download/Print buttons functional
- [ ] Scan count displays correctly

---

## ✅ FINAL CHECKLIST

### Database ✓
- [ ] 5 tables created and verified
- [ ] Triggers working (auto-update farmer_ratings)
- [ ] Functions executable

### APIs ✓
- [ ] Order status update: Works
- [ ] Order timeline: Returns history
- [ ] Review submission: Inserts + triggers
- [ ] Farmer reviews: Returns list + summary
- [ ] QR generation: Creates unique code
- [ ] QR scanning: Tracks + redirects

### UI Components ✓
- [ ] OrderTimeline: Renders correctly
- [ ] ReviewForm: Interactive stars
- [ ] FarmerRatingSummary: Shows stats
- [ ] ReviewList: Displays reviews
- [ ] ShareButton: Menu works
- [ ] QRCodeDisplay: Shows QR + actions

### Integration ✓
- [ ] Review → Auto-update ratings
- [ ] QR scan → Increment count
- [ ] Share → Track analytics

---

## 🎯 SUCCESS CRITERIA

**All tests pass = READY FOR BETA LAUNCH!** 🚀

---

**Testing Time**: ~30 minutes  
**Next**: Select 3 beta farmers + launch!
