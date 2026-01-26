import React, { useState } from 'react';
import TemplateSelector from '../components/TemplateSelector';
import EmailPreview from '../components/EmailPreview';

export default function PreviewPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  return (
    <div className="flex h-screen bg-white">
      <TemplateSelector
        selected={selectedTemplate}
        onSelect={setSelectedTemplate}
      />
      <EmailPreview template={selectedTemplate} />
    </div>
  );
}
