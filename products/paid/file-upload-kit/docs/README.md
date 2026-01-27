# File Upload Kit

A production-ready file upload solution with AWS S3 and Cloudflare R2 integration, supporting multipart uploads, image optimization, and drag-and-drop UI.

## Features

- **Cloud Storage:** Support for AWS S3 and Cloudflare R2.
- **Multipart Uploads:** Handle large files (>100MB) with chunked uploads.
- **Image Optimization:** Resize, compress, and convert images to WebP on the fly.
- **Drag & Drop UI:** Ready-to-use React components.
- **Progress Tracking:** Real-time upload progress, speed, and ETA.
- **Secure:** Presigned URLs for direct-to-cloud uploads.

## Installation

1.  Copy the `src` directory into your Next.js project.
2.  Install dependencies:
    ```bash
    npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner axios clsx lucide-react react-dropzone sharp tailwind-merge zustand
    ```
3.  Configure environment variables (see `INSTALL.md`).

## Quick Start

```tsx
import { FileUploader } from '@/components/FileUploader';

export default function UploadPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Upload Files</h1>
      <FileUploader provider="s3" />
    </div>
  );
}
```

## API Routes

- `POST /api/presigned-url`: Generate a presigned URL for simple uploads.
- `POST /api/multipart/initiate`: Start a multipart upload.
- `POST /api/multipart/upload-part`: Get a presigned URL for a specific part.
- `POST /api/multipart/complete`: Finalize a multipart upload.
- `POST /api/multipart/abort`: Cancel a multipart upload.
- `POST /api/optimize-image`: Resize and optimize images.

## Documentation

- [Installation Guide](INSTALL.md)
- [AWS S3 Setup](S3_SETUP.md)
- [Cloudflare R2 Setup](R2_SETUP.md)
