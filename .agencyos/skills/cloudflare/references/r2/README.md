# Cloudflare R2 Reference

## Overview

R2 is S3-compatible object storage with **zero egress fees**.

**Use When:**

- Storing files, images, videos
- Static asset hosting
- Backup and archive
- High egress workloads (cost savings vs S3)

**Pricing Advantage:**

- S3: $0.09/GB egress
- R2: $0.00/GB egress ✨

## Quick Start

```bash
# Create bucket
wrangler r2 bucket create my-bucket

# Upload file
wrangler r2 object put my-bucket/file.txt --file=./file.txt

# Download file
wrangler r2 object get my-bucket/file.txt

# List objects
wrangler r2 object list my-bucket
```

## Configuration

```toml
# wrangler.toml
[[r2_buckets]]
binding = "BUCKET"
bucket_name = "my-bucket"

# For public access
[[r2_buckets]]
binding = "PUBLIC_BUCKET"
bucket_name = "public-assets"
```

## API Reference

### Basic Operations

```javascript
// GET object
const object = await env.BUCKET.get("path/to/file.pdf");
if (object === null) {
    return new Response("Not found", { status: 404 });
}
return new Response(object.body, {
    headers: { "Content-Type": object.httpMetadata.contentType },
});

// PUT object
await env.BUCKET.put("path/to/file.pdf", request.body, {
    httpMetadata: { contentType: "application/pdf" },
});

// DELETE object
await env.BUCKET.delete("path/to/file.pdf");

// HEAD (metadata only)
const head = await env.BUCKET.head("path/to/file.pdf");
console.log(head.size, head.uploaded);

// LIST objects
const listed = await env.BUCKET.list({
    prefix: "images/",
    limit: 100,
});
for (const object of listed.objects) {
    console.log(object.key, object.size);
}
```

### Object Metadata

```javascript
// Custom metadata
await env.BUCKET.put("file.pdf", body, {
    httpMetadata: {
        contentType: "application/pdf",
        contentDisposition: "attachment; filename=report.pdf",
        cacheControl: "public, max-age=3600",
    },
    customMetadata: {
        uploadedBy: "user123",
        originalName: "quarterly-report.pdf",
    },
});

// Read metadata
const object = await env.BUCKET.get("file.pdf");
console.log(object.customMetadata.uploadedBy);
```

### Multipart Upload

```javascript
// For large files (>5MB recommended)
const upload = await env.BUCKET.createMultipartUpload("large-file.zip");

const parts = [];
let partNumber = 1;

// Upload parts (must be >5MB except last)
for await (const chunk of getLargeFileChunks()) {
    const part = await upload.uploadPart(partNumber, chunk);
    parts.push(part);
    partNumber++;
}

// Complete upload
await upload.complete(parts);
```

## Patterns

### File Upload API

```javascript
export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        if (request.method === "PUT") {
            const key = url.pathname.slice(1); // Remove leading /
            const contentType =
                request.headers.get("Content-Type") ||
                "application/octet-stream";

            await env.BUCKET.put(key, request.body, {
                httpMetadata: { contentType },
            });

            return Response.json({
                success: true,
                key,
                url: `https://assets.example.com/${key}`,
            });
        }

        if (request.method === "GET") {
            const key = url.pathname.slice(1);
            const object = await env.BUCKET.get(key);

            if (!object) {
                return new Response("Not found", { status: 404 });
            }

            return new Response(object.body, {
                headers: {
                    "Content-Type":
                        object.httpMetadata?.contentType ||
                        "application/octet-stream",
                    "Cache-Control": "public, max-age=31536000",
                },
            });
        }

        return new Response("Method not allowed", { status: 405 });
    },
};
```

### Presigned URLs (Public Access)

```javascript
// Enable public access in dashboard, then:
const publicUrl = `https://pub-${bucketId}.r2.dev/${key}`;

// Or use custom domain:
const customUrl = `https://assets.yourdomain.com/${key}`;
```

### Image Optimization Pipeline

```javascript
export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const [, width, key] = url.pathname.match(/\/(\d+)\/(.+)/) || [];

        if (!key) return new Response("Invalid path", { status: 400 });

        // Check cache
        const cacheKey = `${width}/${key}`;
        const cached = await env.BUCKET.get(`cache/${cacheKey}`);
        if (cached) return new Response(cached.body);

        // Get original
        const original = await env.BUCKET.get(`originals/${key}`);
        if (!original) return new Response("Not found", { status: 404 });

        // Resize (using cf.image or external service)
        const resized = await resizeImage(original.body, parseInt(width));

        // Cache result
        await env.BUCKET.put(`cache/${cacheKey}`, resized);

        return new Response(resized);
    },
};
```

## S3 Compatibility

```javascript
// Use with AWS SDK
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const S3 = new S3Client({
    region: "auto",
    endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
});

await S3.send(
    new PutObjectCommand({
        Bucket: "my-bucket",
        Key: "file.txt",
        Body: "Hello, R2!",
    }),
);
```

## Gotchas

1. **No Directory Concept**: Use prefixes (`images/2024/photo.jpg`). List with prefix filter.

2. **Object Size**: Max 5TB per object. Use multipart for >100MB.

3. **Eventual Consistency**: LIST may not immediately reflect recent writes.

4. **CORS**: Configure in dashboard for browser uploads.

5. **Rate Limits**: 1000 requests/second per bucket. Contact support for higher.

6. **Public Access**: Requires enabling in dashboard. Creates `pub-xxx.r2.dev` URL.
