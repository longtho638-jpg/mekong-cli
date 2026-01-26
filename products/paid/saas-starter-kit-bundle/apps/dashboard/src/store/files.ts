import { create } from 'zustand';
import { FileItem, FolderItem, StorageQuota } from '@/types/files';

interface FileState {
  items: (FileItem | FolderItem)[];
  currentFolderId: string | undefined;
  quota: StorageQuota;
  isLoading: boolean;

  fetchFiles: (folderId?: string) => Promise<void>;
  uploadFiles: (files: File[]) => Promise<void>;
  createFolder: (name: string) => void;
  deleteItems: (ids: string[]) => void;
  setCurrentFolder: (folderId?: string) => void;
}

const MOCK_FILES: (FileItem | FolderItem)[] = [
  {
    id: 'fld_1',
    name: 'Documents',
    parentId: undefined,
    createdAt: new Date().toISOString(),
    itemCount: 5,
  },
  {
    id: 'fld_2',
    name: 'Images',
    parentId: undefined,
    createdAt: new Date().toISOString(),
    itemCount: 12,
  },
  {
    id: 'file_1',
    name: 'Project_Proposal.pdf',
    type: 'pdf',
    size: 2500000,
    url: '#',
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
    mimeType: 'application/pdf'
  },
  {
    id: 'file_2',
    name: 'logo.png',
    type: 'image',
    size: 500000,
    url: 'https://via.placeholder.com/150',
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
    mimeType: 'image/png'
  }
];

export const useFileStore = create<FileState>((set, get) => ({
  items: [],
  currentFolderId: undefined,
  quota: {
    used: 3000000,
    limit: 100000000, // 100MB
    usedPercentage: 3
  },
  isLoading: false,

  fetchFiles: async (folderId) => {
    set({ isLoading: true });
    // Simulate API
    await new Promise(resolve => setTimeout(resolve, 500));

    // Filter mock files based on current folder
    const filteredFiles = MOCK_FILES.filter(item =>
      // @ts-ignore
      item.parentId === folderId
    );

    set({ items: MOCK_FILES, isLoading: false });
  },

  uploadFiles: async (files) => {
    set({ isLoading: true });
    // Simulate upload
    await new Promise(resolve => setTimeout(resolve, 1500));

    const newFiles: FileItem[] = files.map(file => ({
      id: `file_${Date.now()}_${Math.random()}`,
      name: file.name,
      type: file.type.startsWith('image') ? 'image' :
            file.type.includes('pdf') ? 'pdf' : 'unknown',
      size: file.size,
      url: URL.createObjectURL(file),
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
      folderId: get().currentFolderId,
      mimeType: file.type
    }));

    set(state => {
      const newUsed = state.quota.used + newFiles.reduce((acc, f) => acc + f.size, 0);
      return {
        items: [...state.items, ...newFiles],
        quota: {
          ...state.quota,
          used: newUsed,
          usedPercentage: (newUsed / state.quota.limit) * 100
        },
        isLoading: false
      };
    });
  },

  createFolder: (name) => {
    const newFolder: FolderItem = {
      id: `fld_${Date.now()}`,
      name,
      parentId: get().currentFolderId,
      createdAt: new Date().toISOString(),
      itemCount: 0
    };
    set(state => ({ items: [...state.items, newFolder] }));
  },

  deleteItems: (ids) => {
    set(state => ({
      items: state.items.filter(item => !ids.includes(item.id))
    }));
  },

  setCurrentFolder: (folderId) => {
    set({ currentFolderId: folderId });
  }
}));
