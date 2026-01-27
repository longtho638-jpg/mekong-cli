import React from 'react';
import { LandingComponent } from '../../lib/builder/types';
import saasLaunch from '../../templates/saas-launch.json';
import ecommerceProduct from '../../templates/ecommerce-product.json';
import leadGen from '../../templates/lead-gen.json';
import webinarRegistration from '../../templates/webinar-registration.json';
import appDownload from '../../templates/app-download.json';
import agencyPortfolio from '../../templates/agency-portfolio.json';
import { X, Layout } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description: string;
  thumbnail: string; // Color or image placeholder
  data: LandingComponent[];
}

const TEMPLATES: Template[] = [
  {
    id: 'saas-launch',
    name: 'SaaS Launch',
    description: 'Perfect for launching your new software product.',
    thumbnail: 'bg-blue-500',
    data: saasLaunch as LandingComponent[],
  },
  {
    id: 'ecommerce-product',
    name: 'E-commerce Product',
    description: 'Showcase a single product with high-converting layout.',
    thumbnail: 'bg-green-500',
    data: ecommerceProduct as LandingComponent[],
  },
  {
    id: 'lead-gen',
    name: 'Lead Generation',
    description: 'Capture emails and leads effectively.',
    thumbnail: 'bg-purple-500',
    data: leadGen as LandingComponent[],
  },
  {
    id: 'webinar',
    name: 'Webinar Registration',
    description: 'Get signups for your next event.',
    thumbnail: 'bg-orange-500',
    data: webinarRegistration as LandingComponent[],
  },
  {
    id: 'app-download',
    name: 'Mobile App',
    description: 'Drive downloads for your iOS or Android app.',
    thumbnail: 'bg-black',
    data: appDownload as LandingComponent[],
  },
  {
    id: 'agency',
    name: 'Agency Portfolio',
    description: 'Showcase your work and services.',
    thumbnail: 'bg-gray-700',
    data: agencyPortfolio as LandingComponent[],
  },
];

interface TemplateGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (components: LandingComponent[]) => void;
}

export const TemplateGallery: React.FC<TemplateGalleryProps> = ({ isOpen, onClose, onSelect }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Layout className="w-6 h-6 text-primary" />
              Choose a Template
            </h2>
            <p className="text-sm text-gray-500 mt-1">Start with a pre-built design to save time.</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {TEMPLATES.map((template) => (
              <div
                key={template.id}
                className="group relative bg-white border rounded-xl overflow-hidden hover:shadow-lg transition-all cursor-pointer ring-offset-2 hover:ring-2 hover:ring-primary"
                onClick={() => {
                  onSelect(template.data);
                  onClose();
                }}
              >
                <div className={`h-40 w-full ${template.thumbnail} flex items-center justify-center text-white opacity-90 group-hover:opacity-100 transition-opacity`}>
                   {/* Placeholder visual */}
                   <span className="font-bold text-2xl opacity-50 select-none">{template.name[0]}</span>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg text-gray-900">{template.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
