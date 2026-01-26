# 🔧 Troubleshooting Guide

Encountering issues? Don't panic. Here are solutions to the most common problems developers face when setting up the SaaS Starter Kit Bundle.

## 🐳 Docker Issues

### "Bind for 0.0.0.0:5432 failed: port is already allocated"
**Cause:** You already have a PostgreSQL instance running on your machine (maybe installed via Homebrew or another Docker container).
**Solution:**
1.  Stop the existing Postgres service: `brew services stop postgresql` (Mac).
2.  OR change the port in `docker-compose.yml`:
    ```yaml
    ports:
      - "5433:5432" # Maps host 5433 to container 5432
    ```
    *Remember to update your `DATABASE_URL` in `.env` to use port 5433.*

### "Connection refused" to Redis or DB
**Cause:** The services haven't finished starting up yet.
**Solution:**
1.  Wait a few seconds.
2.  Check logs: `docker-compose logs -f db` or `docker-compose logs -f redis`.
3.  Ensure your `init.sh` script ran successfully.

## 📦 Package Manager (pnpm)

### "ERR_PNPM_PEER_DEP_ISSUES"
**Cause:** Strict peer dependency rules.
**Solution:**
We have configured `.npmrc` to be lenient, but if this persists, try:
```bash
pnpm install --no-strict-peer-dependencies
```

### "sh: turbo: command not found"
**Cause:** `turbo` is not installed globally or in the project devDependencies.
**Solution:**
1.  Run `pnpm install`.
2.  Or install globally: `npm install -g turbo`.

## 🔐 Authentication & Cookies

### "Session is null" in Dashboard after login
**Cause:** Cookie domain mismatch or HTTP/HTTPS issues.
**Solution:**
1.  **Localhost**: Ensure both apps run on `localhost`. Cookies set on `localhost` are visible to all ports.
2.  **Production**: Ensure `apps/auth` sets the cookie domain to `.yourdomain.com` (note the leading dot) so `app.yourdomain.com` can read it.
3.  **Secure Flag**: In `apps/auth/lib/auth.ts`, ensure `secure: process.env.NODE_ENV === 'production'`. If you run production build locally without HTTPS, secure cookies won't be set.

### "OAuthCallback Error"
**Cause:** The callback URL in Google/GitHub console doesn't match your local URL.
**Solution:**
1.  Go to your provider's developer console.
2.  Add `http://localhost:3002/api/auth/callback/google` (adjust port if needed) to Authorized Redirect URIs.

## 💳 Stripe / Payments

### "No such payment_intent"
**Cause:** Using Test keys in Live mode or vice versa.
**Solution:** Check `.env`. If `STRIPE_SECRET_KEY` starts with `sk_test_`, ensure you are viewing "Test Data" in the Stripe Dashboard.

### Webhooks not triggering locally
**Cause:** Stripe cannot reach `localhost`.
**Solution:**
1.  Use the Stripe CLI to forward events:
    ```bash
    stripe listen --forward-to localhost:3001/api/webhooks/stripe
    ```
2.  Copy the **Webhook Signing Secret** output by the CLI into your `.env` as `STRIPE_WEBHOOK_SECRET`.

## 💾 Database (Prisma)

### "P1001: Can't reach database server"
**Cause:** Incorrect `DATABASE_URL`.
**Solution:**
1.  If running app in Docker: Host is `db` (service name).
2.  If running app on Host: Host is `localhost`.
    *   Docker container: `postgresql://user:pass@db:5432/db`
    *   Local Node: `postgresql://user:pass@localhost:5432/db`

### "P3000: The provided database string is invalid"
**Cause:** Special characters in password.
**Solution:** URL-encode your password.
*   Example: `p@ssword` -> `p%40ssword`.

---
**Still stuck?**
1.  Run `pnpm clean` and try again.
2.  Delete `node_modules` and `pnpm-lock.yaml`, then `pnpm install`.
3.  Check the specific `README.md` in the relevant `apps/` folder.
