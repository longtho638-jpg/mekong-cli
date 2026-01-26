export type FileType = 'image' | 'pdf' | 'text' | 'archive' | 'unknown';

export interface FileItem {
  id: string;
  name: string;
  type: FileType;
  size: number; // bytes
  url: string;
  createdAt: string;
  modifiedAt: string;
  folderId?: string;
  mimeType: string;
}

export interface FolderItem {
  id: string;
  name: string;
  parentId?: string;
  createdAt: string;
  itemCount: number;
}

export type FileSystemItem = FileItem | FolderItem;

export interface StorageQuota {
  used: number; // bytes
  limit: number; // bytes
  usedPercentage: number;
}
