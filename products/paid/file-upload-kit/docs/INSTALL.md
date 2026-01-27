# Installation Guide

## Prerequisites

- Node.js 18+
- Next.js 14+ (App Router or Pages Router)
- AWS Account (for S3) or Cloudflare Account (for R2)

## Environment Variables

Create a `.env.local` file in your project root:

```env
# AWS S3 Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_BUCKET_NAME=your-bucket-name

# Cloudflare R2 Configuration (Optional)
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_NAME=your-r2-bucket-name

# Public URLs (Optional, for displaying images)
NEXT_PUBLIC_S3_DOMAIN=https://your-bucket.s3.amazonaws.com
NEXT_PUBLIC_R2_DOMAIN=https://pub-your-r2-id.r2.dev
```

## Dependencies

Install the required packages:

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner axios clsx lucide-react react-dropzone sharp tailwind-merge zustand
```

## Integration

1.  **Copy Components:** Move `src/components`, `src/hooks`, `src/lib`, `src/types` to your project's source directory.
2.  **Setup API Routes:** Move `src/pages/api` (Pages Router) or adapt the logic for Route Handlers (App Router) in `src/app/api`.
3.  **Use the Component:** Import `FileUploader` and drop it into your page.

## Configuration

You can customize the chunk size and concurrency in `src/lib/multipart-uploader.ts`:

```typescript
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
const CONCURRENCY = 3; // Number of parallel uploads
```
