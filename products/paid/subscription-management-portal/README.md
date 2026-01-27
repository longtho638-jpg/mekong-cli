# Subscription Management Portal

Production-ready subscription management portal for AgencyOS SaaS products with Stripe integration.

## Features

### For Customers
- ✅ View current subscription plan and status
- ✅ Upgrade/downgrade plans with automatic proration
- ✅ View complete billing history with PDF invoices
- ✅ Manage payment methods (add, remove, set default)
- ✅ Cancel subscription with retention flow
- ✅ Material Design 3 compliant UI
- ✅ Mobile-responsive design

### For Admins
- ✅ Webhook-based event handling
- ✅ Automatic invoice generation
- ✅ Payment failure recovery
- ✅ Usage tracking integration
- ✅ Multi-tenant support

## Tech Stack

**Backend:**
- FastAPI 0.104+
- Python 3.11+
- Stripe Python SDK
- Supabase (PostgreSQL)
- Pydantic for validation

**Frontend:**
- Next.js 14+ (App Router)
- TypeScript 5+
- Tailwind CSS
- Material Design 3 tokens
- React 18+

## Installation

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL (via Supabase)
- Stripe account

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Configure environment variables (`.env`):
```bash
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key

# App
APP_NAME=Subscription Portal
APP_ENV=development
```

5. Run database migration:
```bash
psql $DATABASE_URL < database/migrations/0001_initial_schema.sql
```

6. Start backend server:
```bash
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables (`.env.local`):
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

4. Start development server:
```bash
npm run dev
```

Visit `http://localhost:3000`

## API Endpoints

### Subscriptions
- `GET /api/subscriptions/current` - Get current subscription
- `POST /api/subscriptions/upgrade` - Upgrade plan
- `POST /api/subscriptions/downgrade` - Downgrade plan
- `POST /api/subscriptions/cancel` - Cancel subscription

### Billing
- `GET /api/billing/history` - List invoices
- `GET /api/billing/payment-methods` - List payment methods
- `POST /api/billing/payment-method` - Add payment method
- `PUT /api/billing/payment-method/default` - Set default payment method
- `DELETE /api/billing/payment-method/{id}` - Remove payment method

### Webhooks
- `POST /api/webhooks/stripe` - Stripe webhook receiver

## Stripe Configuration

### Required Webhook Events
Configure in Stripe Dashboard → Developers → Webhooks:

- `invoice.paid`
- `invoice.payment_failed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `payment_method.attached`
- `payment_method.detached`

### Price IDs
Update `app/core/config.py` with your Stripe Price IDs:

```python
STRIPE_PRICES = {
    "solo": "price_...",
    "team": "price_...",
    "enterprise": "price_...",
}
```

## Testing

### Backend Tests
```bash
cd backend
pytest tests/ -v --cov=app
```

### Frontend Tests
```bash
cd frontend
npm test
```

### End-to-End Testing
```bash
# Start both backend and frontend
npm run test:e2e
```

## Deployment

### Backend (Google Cloud Run)
```bash
cd backend
gcloud run deploy subscription-portal-api \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Frontend (Vercel)
```bash
cd frontend
vercel --prod
```

## Security Considerations

- ✅ Webhook signature verification (MANDATORY)
- ✅ Authentication required for all endpoints
- ✅ Row-level security (RLS) in Supabase
- ✅ HTTPS only in production
- ✅ API rate limiting
- ✅ Input validation with Pydantic
- ✅ CORS configured for trusted domains only

## Business Rules

### Proration
- **Upgrades**: Charged immediately, prorated credit for unused time
- **Downgrades**: Applied at end of current billing period

### Cancellation
- Customer retains access until period end
- No refunds for partial periods
- Retention offer shown before final cancellation

### Payment Failures
- 3 retry attempts (D+1, D+3, D+7)
- Email notifications sent
- Subscription paused after final failure

## Usage Tracking (Optional)

Integrate with usage metering:
```python
from app.services.usage import track_usage

track_usage(user_id="user_123", metric="api_calls", value=1)
```

## Troubleshooting

### Common Issues

**"Webhook signature verification failed"**
- Ensure `STRIPE_WEBHOOK_SECRET` matches your Stripe webhook secret
- Check that webhook endpoint URL is correct

**"Subscription not found"**
- Verify user has active subscription in Stripe
- Check Supabase `subscriptions` table has correct `stripe_subscription_id`

**Frontend can't connect to backend**
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check CORS settings in backend `main.py`

## Support

For issues or questions:
- Email: support@agencyos.dev
- GitHub: https://github.com/agencyos/subscription-portal

## License

Proprietary - AgencyOS Paid Product
License key required for production use.

---

**Built with ❤️ by Binh Pháp Venture Studio**
