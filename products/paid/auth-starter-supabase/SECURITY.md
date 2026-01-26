# Security Best Practices

Security is critical for authentication. This starter kit implements standard best practices, but you should be aware of the following:

## 1. Environment Variables

- **NEVER** commit your `.env` files to version control.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` is safe to expose to the browser (it adheres to Row Level Security), but `SERVICE_ROLE_KEY` (if you use it) must **NEVER** be exposed to the client.

## 2. Row Level Security (RLS)

This starter kit handles the *authentication* (who is the user?), but you must handle *authorization* (what can they access?) in your Supabase database.

- **Enable RLS** on ALL tables in Supabase.
- Create policies for each table.

**Example Policy:**
```sql
-- Allow users to see only their own profile
create policy "Users can view own profile"
on profiles for select
to authenticated
using ( auth.uid() = user_id );
```

## 3. Middleware Protection

The middleware provided (`middleware/auth-middleware.ts`) protects routes at the edge/server level.

- Ensure you update the `protectedPaths` array in the middleware file to match your application structure.
- Do not rely solely on client-side protection (`ProtectedRoute` component); always verify session on the server/API.

## 4. Input Validation

The forms included perform basic validation. For production apps:
- Use strict schema validation (like Zod) on the server/API endpoints.
- Sanitize all user inputs before processing.

## 5. Site URL Configuration

In Supabase Dashboard > Authentication > URL Configuration:
- Set your **Site URL** (e.g., `https://myapp.com`)
- Add your **Redirect URLs** (e.g., `https://myapp.com/auth/callback`, `http://localhost:3000/auth/callback`)
- Ensure wildcards are used carefully.

## 6. Email Security

- Enable "Confirm email" in Supabase settings if you want to verify users before they can sign in.
- Configure SMTP settings in Supabase to use your own domain for better deliverability and trust.
