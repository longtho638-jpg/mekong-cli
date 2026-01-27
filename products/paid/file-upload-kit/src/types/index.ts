export interface FileUploadConfig {
  endpoint?: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrl?: string; // For R2 or CloudFront
}

export interface PresignedUrlResponse {
  url: string;
  fields?: Record<string, string>; // For POST policy uploads if needed
  key: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  speed: number; // bytes per second
  eta: number; // seconds remaining
}

export interface UploadFile {
  id: string;
  file: File;
  previewUrl?: string;
  status: 'idle' | 'uploading' | 'completed' | 'error' | 'paused';
  progress: UploadProgress;
  s3Key?: string;
  url?: string;
  error?: string;
}

export type StorageProvider = 's3' | 'r2';
