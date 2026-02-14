import React from 'react';

interface CodeViewerProps {
  content: string | null;
  fileName: string | null;
  loading?: boolean;
}

export function CodeViewer({ content, fileName, loading }: CodeViewerProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-stone-500">
        Loading...
      </div>
    );
  }

  if (!content) {
    return (
      <div className="flex items-center justify-center h-full text-stone-500">
        Select a file to view its content
      </div>
    );
  }

  const lines = content.split('\n');

  return (
    <div className="h-full flex flex-col bg-stone-900 text-stone-200 rounded-lg overflow-hidden border border-stone-800 font-mono text-sm">
      <div className="bg-stone-800 px-4 py-2 text-xs text-stone-400 border-b border-stone-700 flex justify-between items-center">
        <span>{fileName}</span>
        <span>{lines.length} lines</span>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <pre className="font-mono text-sm leading-6">
          {lines.map((line, i) => (
            <div key={i} className="table-row">
              <span className="table-cell text-right pr-4 select-none text-stone-600 w-10">
                {i + 1}
              </span>
              <span className="table-cell whitespace-pre-wrap break-all">{line}</span>
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}
