# 🔐 Auth Starter - Supabase Edition

> Complete authentication system with Next.js 15 and Supabase. Login, signup, OAuth, and protected routes ready.

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![Supabase](https://img.shields.io/badge/Supabase-Auth-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)

## ✨ Features

- 🔑 **Email/Password Auth** - Classic login with validation
- 🌐 **OAuth Providers** - Google, GitHub, Discord ready
- 🛡️ **Protected Routes** - Middleware-based auth guards
- 👤 **User Profiles** - Avatar, name, settings
- 🔄 **Session Management** - Auto-refresh, persistence
- 📧 **Email Templates** - Verify, reset, magic link
- 🎨 **Beautiful UI** - Dark mode login forms

## 📦 What's Included

```
auth-starter-supabase/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── reset-password/page.tsx
│   ├── (protected)/
│   │   ├── dashboard/page.tsx
│   │   └── profile/page.tsx
│   └── api/auth/
├── components/
│   ├── auth-form.tsx
│   ├── oauth-buttons.tsx
│   └── user-dropdown.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   └── auth-utils.ts
└── middleware.ts
```

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Add your Supabase keys

# Start development
npm run dev
```

## 🔧 Supabase Setup

1. Create project at [supabase.com](https://supabase.com)
2. Enable Email auth in Authentication settings
3. Add OAuth providers (optional)
4. Copy keys to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_secret
```

## 🛡️ Protected Routes

Routes under `(protected)` require authentication:

```tsx
// middleware.ts handles auth check
export const config = {
    matcher: ["/dashboard/:path*", "/profile/:path*"],
};
```

## 📄 License

MIT License - Use commercially, modify freely.

## 🤝 Support

- 📧 Email: billwill.mentor@gmail.com
- 💬 Twitter: @MekongDev

---

Built with ❤️ by MekongDev
