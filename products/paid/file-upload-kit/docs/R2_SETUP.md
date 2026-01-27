# Cloudflare R2 Setup Guide

## 1. Create a Bucket

1.  Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/).
2.  Go to **R2** from the sidebar.
3.  Click **Create bucket**.
4.  Enter a **Bucket name**.
5.  Click **Create bucket**.

## 2. Configure CORS

1.  Open your bucket settings.
2.  Go to **CORS Policy**.
3.  Add the following configuration:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://your-production-domain.com"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "DELETE",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

## 3. Generate API Tokens

1.  Go back to the R2 overview page.
2.  Click **Manage R2 API Tokens**.
3.  Click **Create API token**.
4.  Select **Object Read & Write**.
5.  Limit the permissions to specific buckets if desired.
6.  Click **Create API Token**.
7.  Copy the **Access Key ID**, **Secret Access Key**, and **Account ID** to your `.env.local` file.

## 4. Public Access (Optional)

If you want files to be publicly accessible:

1.  Go to your bucket settings.
2.  Enable **R2.dev subdomain** or connect a **Custom Domain**.
3.  Use this domain as your `NEXT_PUBLIC_R2_DOMAIN`.
