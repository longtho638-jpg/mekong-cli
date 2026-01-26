"use client";

import { useEffect, useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useFileStore } from '@/store/files';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Folder,
  FileText,
  Image as ImageIcon,
  Music,
  Video,
  MoreVertical,
  Upload,
  Grid,
  List as ListIcon,
  Search,
  ArrowLeft
} from 'lucide-react';
import { formatBytes } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function FilesPage() {
  const {
    items,
    quota,
    currentFolderId,
    fetchFiles,
    uploadFiles,
    createFolder,
    setCurrentFolder
  } = useFileStore();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    fetchFiles(currentFolderId);
  }, [currentFolderId, fetchFiles]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    uploadFiles(acceptedFiles);
  }, [uploadFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return <ImageIcon className="h-8 w-8 text-blue-500" />;
      case 'pdf': return <FileText className="h-8 w-8 text-red-500" />;
      case 'audio': return <Music className="h-8 w-8 text-yellow-500" />;
      case 'video': return <Video className="h-8 w-8 text-purple-500" />;
      default: return <FileText className="h-8 w-8 text-gray-500" />;
    }
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">File Manager</h2>
          <p className="text-muted-foreground">
            Manage and organize your digital assets.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-64">
            <Progress value={quota.usedPercentage} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1 text-right">
              {formatBytes(quota.used)} used of {formatBytes(quota.limit)}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between py-4">
        <div className="flex items-center space-x-2">
          {currentFolderId && (
            <Button variant="ghost" onClick={() => setCurrentFolder(undefined)}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          )}
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search files..." className="pl-8 w-64" />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={() => setViewMode('grid')}>
            <Grid className={`h-4 w-4 ${viewMode === 'grid' ? 'text-primary' : ''}`} />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setViewMode('list')}>
            <ListIcon className={`h-4 w-4 ${viewMode === 'list' ? 'text-primary' : ''}`} />
          </Button>
          <Button onClick={() => createFolder('New Folder')}>
            <Folder className="mr-2 h-4 w-4" /> New Folder
          </Button>
        </div>
      </div>

      <div {...getRootProps()} className={`
        border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
        ${isDragActive ? 'border-primary bg-primary/10' : 'border-muted-foreground/25 hover:border-primary/50'}
      `}>
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          <Upload className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {isDragActive ? 'Drop files here...' : 'Drag & drop files here, or click to select files'}
          </p>
        </div>
      </div>

      <div className={viewMode === 'grid' ? "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4" : "space-y-2"}>
        {items.map((item) => (
          <Card key={item.id} className={`${viewMode === 'list' ? 'flex items-center p-2' : ''} hover:bg-muted/50 transition-colors cursor-pointer group`}>
            {viewMode === 'grid' ? (
              <CardContent className="p-4 flex flex-col items-center text-center">
                <div
                  className="mb-3 p-2 bg-muted rounded-full"
                  onClick={() => 'itemCount' in item ? setCurrentFolder(item.id) : null}
                >
                  {'itemCount' in item ? (
                    <Folder className="h-8 w-8 text-yellow-500" />
                  ) : (
                    getFileIcon(item.type)
                  )}
                </div>
                <p className="font-medium text-sm truncate w-full">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  {'itemCount' in item ? `${item.itemCount} items` : formatBytes(item.size)}
                </p>
              </CardContent>
            ) : (
              <div className="flex items-center w-full px-4 py-2 gap-4">
                 {'itemCount' in item ? (
                    <Folder className="h-6 w-6 text-yellow-500" />
                  ) : (
                    getFileIcon(item.type)
                  )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.name}</p>
                </div>
                <div className="text-sm text-muted-foreground w-32">
                   {'itemCount' in item ? `${item.itemCount} items` : formatBytes(item.size)}
                </div>
                <div className="text-sm text-muted-foreground w-40">
                  {new Date(item.createdAt).toLocaleDateString()}
                </div>
              </div>
            )}

            <div className={`absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity ${viewMode === 'list' ? 'right-4 top-1/2 -translate-y-1/2' : ''}`}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Rename</DropdownMenuItem>
                  <DropdownMenuItem>Download</DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
