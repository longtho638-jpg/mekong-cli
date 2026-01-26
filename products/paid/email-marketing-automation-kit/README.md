# Antigravity Email Marketing Automation Kit 📧

**Production-ready email templates + multi-provider integration. Stop wrestling with HTML tables—start sending professional emails in 5 minutes.**

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-Commercial-green.svg)
![React](https://img.shields.io/badge/React-18.2-61DAFB.svg)
![Next.js](https://img.shields.io/badge/Next.js-14.0-black.svg)

## 🎯 What's Included?

### 13+ Production-Ready Templates
Stop designing from scratch. Get responsive, tested templates for every SaaS use case:
- **Transactional:** Order Confirmation, Password Reset, Welcome, Invoice, Verification
- **Welcome Sequence:** Complete 7-day automated drip campaign (Day 0, 2, 4, 7)
- **Newsletters:** Product Updates, Monthly Digest, Promotional/Sales

### Multi-Provider Infrastructure
Built-in resilience with automatic failover:
- **Primary:** Resend (Modern, fast, great free tier)
- **Fallback:** SendGrid (Reliable backup)
- **Zero Downtime:** Automatic provider switching if primary fails

### Developer Tools
- **Browser Preview:** Real-time email rendering with mobile/desktop toggle
- **Spam Score Checker:** Catch spammy keywords before sending
- **Link Validator:** Ensure no broken links reach users
- **Type-Safe:** 100% TypeScript with Zod validation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- API keys from [Resend](https://resend.com) and/or [SendGrid](https://sendgrid.com)

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment**:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your API keys:
   ```env
   RESEND_API_KEY=re_your_key_here
   SENDGRID_API_KEY=SG.your_key_here
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. **Run Development Server**:
   ```bash
   npm run dev
   ```

4. **Open Preview Tool**:
   Visit `http://localhost:3000/preview` to see your templates.

## 📁 Project Structure

```
email-marketing-automation-kit/
├── components/         # UI components for preview tool
├── pages/
│   └── api/           # Next.js API routes for sending emails
├── services/          # Email provider integration logic
│   ├── resend.ts      # Resend provider
│   ├── sendgrid.ts    # SendGrid provider
│   └── email-service.ts  # Multi-provider orchestration
├── templates/         # React Email template components
│   ├── transactional/
│   ├── welcome-sequence/
│   └── newsletters/
├── docs/              # Full documentation
│   ├── API_REFERENCE.md
│   ├── SETUP.md
│   └── TEMPLATES_GUIDE.md
└── .env.example       # Environment variables template
```

## 💡 Usage Examples

### Send a Transactional Email

```typescript
import { sendEmail } from './services/email-service';
import { WelcomeEmail } from './templates/transactional/welcome';

await sendEmail({
  to: 'user@example.com',
  subject: 'Welcome to Our Platform!',
  template: WelcomeEmail,
  props: {
    userName: 'John Doe',
    loginUrl: 'https://app.example.com/login'
  }
});
```

### Trigger Welcome Sequence

```typescript
import { startWelcomeSequence } from './services/sequences';

await startWelcomeSequence({
  userId: '123',
  email: 'user@example.com',
  userName: 'Jane Smith'
});
```

### Preview Template in Browser

```typescript
// Visit http://localhost:3000/preview
// Select template from dropdown
// Toggle mobile/desktop view
// Check spam score
// Validate links
```

## 📚 Documentation

- **[Setup Guide](./docs/SETUP.md)** - Detailed installation and configuration
- **[API Reference](./docs/API_REFERENCE.md)** - Complete API documentation
- **[Templates Guide](./docs/TEMPLATES_GUIDE.md)** - Customize existing templates

## 🛠 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run preview` | Open email preview tool |
| `npm run email` | Start React Email dev environment |
| `npm test` | Run test suite |
| `npm run lint` | Run ESLint |

## 🔧 Configuration

### Email Provider Priority
Edit `services/email-service.ts` to change provider priority:

```typescript
const providers = [
  new ResendProvider(process.env.RESEND_API_KEY),
  new SendGridProvider(process.env.SENDGRID_API_KEY)
];
```

### Custom Templates
1. Create new template in `templates/` folder
2. Follow React Email component patterns
3. Export from appropriate category folder
4. Add to preview tool dropdown

## 🧪 Testing

```bash
# Run all tests
npm test

# Test specific template
npm test -- templates/welcome.test.ts

# Test email sending (requires API keys)
npm test -- services/email-service.test.ts
```

## 📦 What You Get

- ✅ Complete source code (React Email + Next.js)
- ✅ 13+ professional email templates
- ✅ Multi-provider sending infrastructure
- ✅ Browser-based preview tool
- ✅ Spam checker and link validator
- ✅ Full TypeScript support
- ✅ Production deployment guides
- ✅ Lifetime updates

## 💰 The ROI

- **Option A:** Build yourself → 20+ hours ($2,000+ value)
- **Option B:** SaaS like Mailchimp → $29/mo forever ($348/year)
- **Option C (This Kit):** $57 one-time → Own forever

## 📄 License

**Standard License** (Included):
- Use in unlimited personal and commercial projects
- Modify and customize for your needs
- No attribution required

**Cannot:**
- Redistribute or resell as a standalone product
- Share source code publicly

See [LICENSE.md](./LICENSE.md) for full terms.

## 🆘 Support

- **Documentation:** Check `docs/` folder
- **Issues:** GitHub Issues (if provided)
- **Questions:** support@antigravity.dev

## 🏗 Built With

- [React Email](https://react.email/) - Modern email development
- [Next.js 14](https://nextjs.org/) - React framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Email styling
- [Zod](https://zod.dev/) - Runtime validation
- [Resend](https://resend.com/) - Primary email provider
- [SendGrid](https://sendgrid.com/) - Backup email provider

## 🙏 Perfect For

- **SaaS Founders** needing professional transactional emails
- **Indie Hackers** launching on Gumroad/LemonSqueezy
- **Agencies** wanting standardized email stack for clients
- **Developers** building email-heavy applications

---

**Built with ❤️ by Antigravity**

*Get the code that powers 6-figure SaaS products.*
