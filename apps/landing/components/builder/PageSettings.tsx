import React, { useState } from 'react';
import { X, Settings } from 'lucide-react';

interface PageSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  settings: {
    title: string;
    description: string;
    ogImage: string;
    slug: string;
  };
  onSave: (settings: { title: string; description: string; ogImage: string; slug: string }) => void;
}

export const PageSettings: React.FC<PageSettingsProps> = ({ isOpen, onClose, settings, onSave }) => {
  const [formData, setFormData] = useState(settings);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Settings className="w-5 h-5 text-gray-500" />
            Page Settings & SEO
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Page Title</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g. Best SaaS Product"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            <p className="text-xs text-gray-500">Appears in browser tab and search results.</p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">URL Slug</label>
            <div className="flex items-center">
              <span className="bg-gray-100 border border-r-0 rounded-l-md px-3 py-2 text-gray-500 text-sm">/</span>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border rounded-r-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="my-page"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Meta Description</label>
            <textarea
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
              placeholder="Brief description for SEO..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Open Graph Image URL</label>
            <input
              type="url"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="https://..."
              value={formData.ogImage}
              onChange={(e) => setFormData({ ...formData, ogImage: e.target.value })}
            />
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
            >
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
