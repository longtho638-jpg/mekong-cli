import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useFileUploadStore } from '../hooks/useFileUpload';
import { UploadCloud, File, X } from 'lucide-react';
import clsx from 'clsx';

interface FileDropzoneProps {
  className?: string;
  accept?: Record<string, string[]>;
  maxSize?: number; // bytes
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  className,
  accept,
  maxSize = 100 * 1024 * 1024, // 100MB default
}) => {
  const addFiles = useFileUploadStore((state) => state.addFiles);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    addFiles(acceptedFiles);
  }, [addFiles]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept,
    maxSize,
  });

  return (
    <div
      {...getRootProps()}
      className={clsx(
        'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
        isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400',
        isDragReject && 'border-red-500 bg-red-50',
        className
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="p-4 bg-gray-100 rounded-full">
          <UploadCloud className="w-8 h-8 text-gray-500" />
        </div>
        <div className="space-y-1">
          <p className="text-lg font-medium text-gray-700">
            {isDragActive ? 'Drop files here' : 'Click or drag files to upload'}
          </p>
          <p className="text-sm text-gray-500">
            Max file size: {(maxSize / (1024 * 1024)).toFixed(0)}MB
          </p>
        </div>
      </div>
    </div>
  );
};
