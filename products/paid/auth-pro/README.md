# Antigravity Auth PRO ($97)

Enterprise-grade authentication system for Next.js applications, built on Supabase.

![Auth PRO Banner](public/banner.png)

## Features

### 🔐 Enterprise Auth
- **Multi-Factor Authentication (MFA)**: TOTP (Authenticator App), SMS backup codes, and recovery codes.
- **Advanced OAuth**: Google, GitHub, Discord with automatic account linking and profile sync.
- **Session Management**: Real-time session tracking, device detection, and remote revocation.
- **Security Dashboard**: Password strength meter, login history, and suspicious activity alerts.

### 🏢 Organization Management
- **Multi-Tenancy**: Create and switch between organizations.
- **Team Roles**: Owner, Admin, Member, Guest role-based access control (RBAC).
- **Invitations**: Secure email invitation flow for team members.

### 🛡️ Admin & Compliance
- **User Management**: Admin panel to list, search, impersonate, and ban users.
- **Audit Logs**: Detailed tracking of all security-critical actions.
- **RBAC System**: Fine-grained permission templates.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database & Auth**: Supabase
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS + shadcn/ui
- **Validation**: Zod + React Hook Form

## Quick Start

1. **Clone & Install**
   ```bash
   npm install
   ```

2. **Environment Setup**
   Copy `.env.example` to `.env.local` and add your Supabase credentials.

3. **Run Development Server**
   ```bash
   npm run dev
   ```

See [INSTALL.md](./INSTALL.md) for detailed setup instructions.

## Documentation

- [Installation Guide](./INSTALL.md)
- [OAuth Setup](./OAUTH_SETUP.md)
- [Security Best Practices](./SECURITY.md)

## License

Standard Commercial License. View LICENSE file for details.
