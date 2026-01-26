import { useState, useEffect } from 'react';

interface EmailPreviewProps {
  template: string;
}

export default function EmailPreview({ template }: EmailPreviewProps) {
  const [html, setHtml] = useState<string>('');
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!template) return;

    setLoading(true);
    fetch(`/api/preview?template=${template}`)
      .then(res => res.text())
      .then(html => {
        setHtml(html);
        setLoading(false);
      });
  }, [template]);

  if (!template) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100 text-gray-400">
        Select a template to preview
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen">
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="font-medium text-gray-700">{template}</span>
          {loading && <span className="text-xs text-gray-400">Loading...</span>}
        </div>
        <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('desktop')}
            className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${
              viewMode === 'desktop' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Desktop
          </button>
          <button
            onClick={() => setViewMode('mobile')}
            className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${
              viewMode === 'mobile' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Mobile
          </button>
        </div>
      </div>

      <div className="flex-1 bg-gray-100 p-8 overflow-auto flex justify-center">
        <div
          className={`bg-white shadow-xl transition-all duration-300 ${
            viewMode === 'mobile' ? 'w-[375px] h-[812px]' : 'w-[800px] h-full'
          }`}
        >
          <iframe
            srcDoc={html}
            className="w-full h-full border-0"
            title="Email Preview"
          />
        </div>
      </div>
    </div>
  );
}
