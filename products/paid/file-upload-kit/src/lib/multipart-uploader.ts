import axios from 'axios';
import { UploadProgress } from '../types';

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
const CONCURRENCY = 3; // Parallel uploads

interface MultipartUploadOptions {
  file: File;
  provider?: 's3' | 'r2';
  onProgress?: (progress: UploadProgress) => void;
  maxRetries?: number;
}

export class MultipartUploader {
  private file: File;
  private provider: 's3' | 'r2';
  private onProgress?: (progress: UploadProgress) => void;
  private uploadId: string | null = null;
  private key: string | null = null;
  private aborted = false;
  private maxRetries: number;
  private uploadedBytes = 0;
  private startTime = 0;

  constructor(options: MultipartUploadOptions) {
    this.file = options.file;
    this.provider = options.provider || 's3';
    this.onProgress = options.onProgress;
    this.maxRetries = options.maxRetries ?? 3;
  }

  async start(): Promise<{ location: string; key: string }> {
    this.startTime = Date.now();
    try {
      // 1. Initiate
      const { UploadId, Key } = await this.initiateUpload();
      this.uploadId = UploadId;
      this.key = Key;

      if (this.aborted) throw new Error('Upload aborted');

      // 2. Upload Parts
      const parts = await this.uploadParts();

      if (this.aborted) throw new Error('Upload aborted');

      // 3. Complete
      const result = await this.completeUpload(parts);

      // Final progress update
      this.reportProgress(this.file.size);

      return { location: result.Location, key: this.key };
    } catch (error) {
      if (this.uploadId && this.key) {
        await this.abortUpload().catch(console.error);
      }
      throw error;
    }
  }

  abort() {
    this.aborted = true;
  }

  private async initiateUpload() {
    const response = await axios.post('/api/multipart/initiate', {
      filename: this.file.name,
      contentType: this.file.type,
      provider: this.provider,
    });
    return response.data;
  }

  private async uploadParts() {
    const totalParts = Math.ceil(this.file.size / CHUNK_SIZE);
    const parts: { ETag: string; PartNumber: number }[] = [];
    const queue = Array.from({ length: totalParts }, (_, i) => i + 1);
    const activeUploads = new Set<Promise<void>>();

    // Helper to process queue
    const processQueue = async () => {
      while (queue.length > 0 && !this.aborted) {
        const partNumber = queue.shift();
        if (!partNumber) break;

        const start = (partNumber - 1) * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, this.file.size);
        const chunk = this.file.slice(start, end);

        const uploadPromise = this.uploadPartWithRetry(partNumber, chunk)
          .then((part) => {
            parts.push(part);
            this.uploadedBytes += chunk.size;
            this.reportProgress(this.uploadedBytes);
          })
          .catch((err) => {
             this.aborted = true; // Fail fast on part failure after retries
             throw err;
          })
          .finally(() => {
             activeUploads.delete(uploadPromise);
          });

        activeUploads.add(uploadPromise);

        // Throttle concurrency
        if (activeUploads.size >= CONCURRENCY) {
          await Promise.race(activeUploads);
        }
      }
    };

    await processQueue();
    await Promise.all(activeUploads);

    if (this.aborted) throw new Error('Upload failed or aborted');

    return parts.sort((a, b) => a.PartNumber - b.PartNumber);
  }

  private async uploadPartWithRetry(partNumber: number, chunk: Blob) {
    let retries = 0;
    // If maxRetries is 0, we still want to try at least once.
    // Actually, "maxRetries" usually means "max *additional* attempts".
    // But the loop condition `while (retries < this.maxRetries)` implies total attempts if logic is inside?
    // Let's adjust logic. We want to attempt once, then retry `maxRetries` times.
    // Total attempts = 1 + maxRetries.

    // Original logic:
    // while (retries < this.maxRetries) { ... }
    // If maxRetries is 3, it runs for 0, 1, 2. Total 3 attempts.
    // If maxRetries is 0, it runs 0 times. That is a bug.

    // New logic:
    // We want at least one attempt.
    const totalAttempts = this.maxRetries + 1;

    for (let attempt = 1; attempt <= totalAttempts; attempt++) {
      try {
        if (this.aborted) throw new Error('Aborted');

        // Get presigned URL
        const { data: { url } } = await axios.post('/api/multipart/upload-part', {
          key: this.key,
          uploadId: this.uploadId,
          partNumber,
          provider: this.provider,
        });

        // Upload to S3/R2
        const response = await axios.put(url, chunk, {
          headers: { 'Content-Type': this.file.type }
        });

        return { ETag: response.headers.etag, PartNumber: partNumber };
      } catch (err) {
        if (attempt === totalAttempts) throw err; // Last attempt failed, throw error
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
      }
    }
    throw new Error(`Failed to upload part ${partNumber}`);
  }

  private reportProgress(loaded: number) {
    if (this.onProgress) {
      const total = this.file.size;
      const percentage = Math.round((loaded / total) * 100);

      const elapsedTime = (Date.now() - this.startTime) / 1000; // seconds
      const speed = elapsedTime > 0 ? loaded / elapsedTime : 0; // bytes per second
      const remainingBytes = total - loaded;
      const eta = speed > 0 ? remainingBytes / speed : 0; // seconds

      this.onProgress({
        loaded,
        total,
        percentage,
        speed,
        eta
      });
    }
  }

  private async completeUpload(parts: { ETag: string; PartNumber: number }[]) {
    const response = await axios.post('/api/multipart/complete', {
      key: this.key,
      uploadId: this.uploadId,
      parts,
      provider: this.provider,
    });
    return response.data;
  }

  private async abortUpload() {
    await axios.post('/api/multipart/abort', {
      key: this.key,
      uploadId: this.uploadId,
      provider: this.provider,
    });
  }
}
