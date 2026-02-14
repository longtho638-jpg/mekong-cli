# Analytics Setup Guide - Sa Đéc Flower Hunt

## ✅ What Was Added

### 1. Google Analytics 4 (GA4)
**Location**: `app/layout.tsx`

**Setup Steps**:
1. Go to https://analytics.google.com
2. Create new property: "Sa Đéc Flower Hunt"
3. Get Measurement ID (starts with G-XXXXXXXXXX)
4. Replace `G-XXXXXXXXXX` in layout.tsx with your real ID

**What it tracks**:
- Page views
- Add to cart events (need to add manually)
- Checkout initiated
- Purchase completed
- User demographics

### 2. Facebook Pixel
**Location**: `app/layout.tsx`

**Setup Steps**:
1. Go to https://business.facebook.com/events_manager
2. Create new Pixel
3. Get Pixel ID (numbers only, like 1234567890)
4. Replace `YOUR_PIXEL_ID` in layout.tsx with your real ID

**What it tracks**:
- Page views (auto)
- ViewContent (need custom events)
- AddToCart (need custom events)
- InitiateCheckout (need custom events)
- Purchase (need custom events)

---

## 🎯 Next: Add Custom Events

### For Add to Cart Button
**Location**: Where users click "Thêm vào giỏ"

```typescript
// Track add to cart
if (typeof window !== 'undefined' && window.fbq) {
  window.fbq('track', 'AddToCart', {
    content_name: flower.name,
    content_ids: [flower.id],
    content_type: 'product',
    value: flower.price,
    currency: 'VND'
  });
}

// GA4 event
if (typeof window !== 'undefined' && window.gtag) {
  window.gtag('event', 'add_to_cart', {
    currency: 'VND',
    value: flower.price,
    items: [{
      item_id: flower.id,
      item_name: flower.name,
      price: flower.price,
      quantity: 1
    }]
  });
}
```

### For Checkout
**Location**: Checkout page

```typescript
// Track checkout
if (typeof window !== 'undefined' && window.fbq) {
  window.fbq('track', 'InitiateCheckout', {
    content_ids: cartItems.map(i => i.id),
    contents: cartItems,
    value: total,
    currency: 'VND'
  });
}
```

### For Purchase
**Location**: Order success page

```typescript
// Track purchase
if (typeof window !== 'undefined' && window.fbq) {
  window.fbq('track', 'Purchase', {
    content_ids: orderItems.map(i => i.id),
    contents: orderItems,
    value: orderTotal,
    currency: 'VND'
  });
}

// GA4 purchase
if (typeof window !== 'undefined' && window.gtag) {
  window.gtag('event', 'purchase', {
    transaction_id: orderId,
    value: orderTotal,
    currency: 'VND',
    items: orderItems.map(item => ({
      item_id: item.id,
      item_name: item.name,
      price: item.price,
      quantity: item.quantity
    }))
  });
}
```

---

## 📊 What to Monitor (After Setup)

### In Google Analytics:
1. **Reports** → **Realtime**: See live visitors
2. **Reports** → **Acquisition**: Where visitors come from
3. **Reports** → **Engagement**: Which pages they visit
4. **Reports** → **Monetization**: Purchases (after adding custom events)

### In Facebook Events Manager:
1. **Overview**: Total events today
2. **Test Events**: Verify pixel firing correctly
3. **Data Sources**: Check pixel status (Active/Inactive)

---

## ⚠️ Important Notes

1. **REPLACE PLACEHOLDER IDs**:
   - `G-XXXXXXXXXX` → Your real GA4 ID
   - `YOUR_PIXEL_ID` → Your real Facebook Pixel ID

2. **Privacy Policy Required**:
   - Must have privacy policy page
   - Mention Google Analytics and Facebook Pixel
   - GDPR/PDPA compliance (cookie consent)

3. **Testing**:
   ```bash
   # After deployment
   # Open browser console
   # Type: fbq('track', 'PageView')
   # Should see success in Facebook Events Manager → Test Events
   ```

4. **Conversion Tracking**:
   - Custom events must be added manually (see code above)
   - Test each event before running ads
   - Verify in both GA4 and Facebook

---

## 🚀 Deployment

```bash
# Commit changes
git add app/layout.tsx
git commit -m "feat: add Google Analytics 4 and Facebook Pixel tracking"
git push origin master

# Auto-deploys to Vercel
# Wait 2-3 minutes, then visit site
# Open browser console → check for tracking scripts
```

---

## ✅ Verification Checklist

- [ ] GA4 Measurement ID replaced in code
- [ ] Facebook Pixel ID replaced in code
- [ ] Deployed to production
- [ ] Visited website → saw "PageView" in GA4 Realtime
- [ ] Visited website → saw "PageView" in Facebook Events Manager
- [ ] Tested add to cart → event fired (after adding custom code)
- [ ] Tested checkout → event fired (after adding custom code)
- [ ] Privacy policy page created and linked

---

**Status**: Ready for GA4 and Pixel ID setup  
**Next Step**: Get IDs from Google Analytics and Facebook Business Manager
