import React from 'react';
import { FileDropzone } from './FileDropzone';
import { FileList } from './FileList';
import { StorageProvider } from '../types';

interface FileUploaderProps {
  provider?: StorageProvider;
  className?: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  provider = 's3',
  className
}) => {
  return (
    <div className={className}>
      <FileDropzone />
      <FileList provider={provider} />
    </div>
  );
};
