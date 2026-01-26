# OAuth Provider Setup

## Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project.
3. Go to **APIs & Services > OAuth consent screen**.
   - Select "External".
   - Fill in app name and support email.
4. Go to **Credentials > Create Credentials > OAuth client ID**.
   - Application type: **Web application**.
   - Authorized redirect URIs: `https://<your-project>.supabase.co/auth/v1/callback`.
5. Copy **Client ID** and **Client Secret**.
6. Paste them into Supabase Dashboard > Authentication > Providers > Google.

## GitHub OAuth

1. Go to [GitHub Developer Settings](https://github.com/settings/developers).
2. Click **New OAuth App**.
   - Application Name: Your App Name.
   - Homepage URL: `http://localhost:3000` (or production URL).
   - Authorization callback URL: `https://<your-project>.supabase.co/auth/v1/callback`.
3. Click **Register application**.
4. Generate a **Client Secret**.
5. Copy **Client ID** and **Client Secret**.
6. Paste them into Supabase Dashboard > Authentication > Providers > GitHub.

## Discord OAuth

1. Go to [Discord Developer Portal](https://discord.com/developers/applications).
2. Click **New Application**.
3. Go to **OAuth2**.
   - Add Redirect: `https://<your-project>.supabase.co/auth/v1/callback`.
4. Copy **Client ID** and **Client Secret**.
5. Paste them into Supabase Dashboard > Authentication > Providers > Discord.
