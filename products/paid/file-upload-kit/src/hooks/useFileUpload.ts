import { create } from 'zustand';
import { UploadFile, StorageProvider } from '../types';
import { MultipartUploader } from '../lib/multipart-uploader';

interface FileUploadStore {
  files: UploadFile[];
  addFiles: (files: File[]) => void;
  removeFile: (id: string) => void;
  updateFileStatus: (id: string, status: UploadFile['status'], error?: string) => void;
  updateFileProgress: (id: string, progress: UploadFile['progress']) => void;
  startUpload: (id: string, provider: StorageProvider) => Promise<void>;
  cancelUpload: (id: string) => void;
  uploaders: Map<string, MultipartUploader>;
}

export const useFileUploadStore = create<FileUploadStore>((set, get) => ({
  files: [],
  uploaders: new Map(),

  addFiles: (newFiles: File[]) => {
    const uploadFiles: UploadFile[] = newFiles.map((file) => ({
      id: Math.random().toString(36).substring(7),
      file,
      previewUrl: URL.createObjectURL(file),
      status: 'idle',
      progress: {
        loaded: 0,
        total: file.size,
        percentage: 0,
        speed: 0,
        eta: 0,
      },
    }));

    set((state) => ({
      files: [...state.files, ...uploadFiles],
    }));
  },

  removeFile: (id: string) => {
    const { uploaders, files } = get();
    const uploader = uploaders.get(id);
    if (uploader) {
      uploader.abort();
      uploaders.delete(id);
    }

    // Revoke object URL to avoid memory leaks
    const file = files.find(f => f.id === id);
    if (file?.previewUrl) {
      URL.revokeObjectURL(file.previewUrl);
    }

    set((state) => ({
      files: state.files.filter((f) => f.id !== id),
    }));
  },

  updateFileStatus: (id, status, error) => {
    set((state) => ({
      files: state.files.map((f) =>
        f.id === id ? { ...f, status, error } : f
      ),
    }));
  },

  updateFileProgress: (id, progress) => {
    set((state) => ({
      files: state.files.map((f) =>
        f.id === id ? { ...f, progress } : f
      ),
    }));
  },

  startUpload: async (id: string, provider: StorageProvider) => {
    const { files, updateFileStatus, updateFileProgress, uploaders } = get();
    const fileObj = files.find((f) => f.id === id);

    if (!fileObj) return;

    updateFileStatus(id, 'uploading');

    const uploader = new MultipartUploader({
      file: fileObj.file,
      provider,
      onProgress: (progress) => {
        updateFileProgress(id, progress);
      },
    });

    uploaders.set(id, uploader);

    try {
      const result = await uploader.start();
      set((state) => ({
        files: state.files.map((f) =>
          f.id === id ? { ...f, status: 'completed', s3Key: result.key, url: result.location } : f
        ),
      }));
    } catch (error: any) {
        if (fileObj.status !== 'paused') { // Don't overwrite if paused/cancelled manually
             updateFileStatus(id, 'error', error.message);
        }
    } finally {
      uploaders.delete(id);
    }
  },

  cancelUpload: (id: string) => {
    const { uploaders, updateFileStatus } = get();
    const uploader = uploaders.get(id);
    if (uploader) {
      uploader.abort();
      uploaders.delete(id);
      updateFileStatus(id, 'idle'); // Reset to idle or 'cancelled'
    }
  },
}));
