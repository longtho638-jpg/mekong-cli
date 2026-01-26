import { useState, useEffect } from 'react';

interface TemplateSelectorProps {
  onSelect: (template: string) => void;
  selected: string;
}

export default function TemplateSelector({ onSelect, selected }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/preview?list=true')
      .then(res => res.json())
      .then(data => setTemplates(data.templates));
  }, []);

  return (
    <div className="w-64 border-r border-gray-200 h-screen overflow-y-auto bg-gray-50 p-4">
      <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Templates</h2>
      <div className="space-y-1">
        {templates.map(template => (
          <button
            key={template}
            onClick={() => onSelect(template)}
            className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
              selected === template
                ? 'bg-blue-100 text-blue-700 font-medium'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {template}
          </button>
        ))}
      </div>
    </div>
  );
}
