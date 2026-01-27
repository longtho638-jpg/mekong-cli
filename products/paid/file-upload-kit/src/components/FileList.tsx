import React from 'react';
import { useFileUploadStore } from '../hooks/useFileUpload';
import { X, FileIcon, CheckCircle, AlertCircle, Play, Pause } from 'lucide-react';
import { StorageProvider } from '../types';

interface FileListProps {
  provider?: StorageProvider;
}

export const FileList: React.FC<FileListProps> = ({ provider = 's3' }) => {
  const { files, removeFile, startUpload, cancelUpload } = useFileUploadStore();

  if (files.length === 0) return null;

  return (
    <div className="mt-6 space-y-4">
      {files.map((file) => (
        <div
          key={file.id}
          className="flex items-center p-4 bg-white border rounded-lg shadow-sm"
        >
          {/* Preview */}
          <div className="flex-shrink-0 w-12 h-12 mr-4 overflow-hidden rounded bg-gray-100">
            {file.file.type.startsWith('image/') ? (
              <img
                src={file.previewUrl}
                alt={file.file.name}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="flex items-center justify-center w-full h-full">
                <FileIcon className="w-6 h-6 text-gray-400" />
              </div>
            )}
          </div>

          {/* Info & Progress */}
          <div className="flex-1 min-w-0 mr-4">
            <div className="flex justify-between mb-1">
              <h4 className="text-sm font-medium text-gray-900 truncate">
                {file.file.name}
              </h4>
              <span className="text-xs text-gray-500">
                {(file.file.size / 1024 / 1024).toFixed(2)} MB
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  file.status === 'error' ? 'bg-red-500' : 'bg-blue-500'
                }`}
                style={{ width: `${file.progress.percentage}%` }}
              />
            </div>

            {/* Status Text */}
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              <span className="capitalize">
                {file.status === 'error' ? file.error : file.status}
              </span>
              {file.status === 'uploading' && (
                <span>
                  {file.progress.speed > 0
                    ? `${(file.progress.speed / 1024 / 1024).toFixed(1)} MB/s`
                    : ''}
                  {' • '}
                  {file.progress.eta > 0
                    ? `${file.progress.eta.toFixed(0)}s remaining`
                    : ''}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {file.status === 'idle' && (
              <button
                onClick={() => startUpload(file.id, provider)}
                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                title="Start Upload"
              >
                <Play className="w-5 h-5" />
              </button>
            )}
            {file.status === 'uploading' && (
              <button
                onClick={() => cancelUpload(file.id)}
                className="p-1 text-yellow-600 hover:bg-yellow-50 rounded"
                title="Pause/Cancel"
              >
                <Pause className="w-5 h-5" />
              </button>
            )}
            {file.status === 'completed' && (
              <CheckCircle className="w-5 h-5 text-green-500" />
            )}
            {file.status === 'error' && (
              <AlertCircle className="w-5 h-5 text-red-500" />
            )}

            <button
              onClick={() => removeFile(file.id)}
              className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
              title="Remove"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
