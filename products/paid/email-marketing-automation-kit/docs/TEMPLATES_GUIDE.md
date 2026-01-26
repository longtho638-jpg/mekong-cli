# Templates Guide

This kit includes 12+ professionally designed templates categorized by use case. All templates are located in `templates/`.

## Layout

All templates use `templates/layout.tsx` for consistent branding (Logo, Footer, Styles). Update this file to change the look and feel globally.

## 1. Transactional Templates

Located in `templates/transactional/`.

| Template Name | File | Description | Props |
| :--- | :--- | :--- | :--- |
| **Order Confirmation** | `order-confirmation.tsx` | Receipt with line items | `orderId`, `items`, `total`, `customerName` |
| **Password Reset** | `password-reset.tsx` | Secure reset link | `resetLink`, `customerName` |
| **Welcome** | `welcome.tsx` | Simple welcome message | `customerName`, `loginLink` |
| **Invoice** | `invoice.tsx` | B2B Invoice style | `invoiceId`, `items`, `total`, `downloadLink` |
| **Account Verification** | `account-verification.tsx` | Email ownership check | `verifyLink`, `customerName` |
| **Payment Failed** | `payment-failed.tsx` | Dunning/Recovery email | `invoiceId`, `amount`, `cardLast4`, `updateLink` |

## 2. Welcome Sequence

Located in `templates/sequences/welcome-sequence/`. Designed to be sent over 7 days.

| Day | File | Purpose | Props |
| :--- | :--- | :--- | :--- |
| **Day 0** | `day-0-welcome.tsx` | Immediate welcome + next steps | `firstName`, `dashboardLink` |
| **Day 2** | `day-2-feature-1.tsx` | Highlight key feature (Analytics) | `firstName`, `featureLink` |
| **Day 4** | `day-4-feature-2.tsx` | Highlight automation/workflow | `firstName`, `automationLink` |
| **Day 7** | `day-7-success-stories.tsx` | Social proof + Upgrade CTA | `firstName`, `upgradeLink` |

## 3. Newsletters

Located in `templates/newsletters/`.

| Template Name | File | Description | Props |
| :--- | :--- | :--- | :--- |
| **Product Update** | `product-update.tsx` | Changelog & New Features | `version`, `changes` (array), `releaseNoteLink` |
| **Monthly Newsletter** | `monthly-newsletter.tsx` | Content digest | `month`, `year`, `articles` (array) |
| **Promotional** | `promotional.tsx` | Sales & Discounts | `offerName`, `discountCode`, `discountAmount` |

## Customization

### Changing Colors
Open `templates/layout.tsx` and modify the Tailwind config in the `<Tailwind>` component:

```tsx
<Tailwind
  config={{
    theme: {
      extend: {
        colors: {
          brand: "#YOUR_COLOR", // Change this
          offwhite: "#fafafa",
        },
      },
    },
  }}
>
```

### Changing Logo
Update the `Img` tag in `templates/layout.tsx`:

```tsx
<Img
  src="https://your-domain.com/static/logo.png"
  width="40"
  height="37"
  alt="Your Brand"
/>
```
