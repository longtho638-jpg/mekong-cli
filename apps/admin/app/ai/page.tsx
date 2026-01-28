import React from 'react';
import Link from 'next/link';
import { MD3Typography, MD3Card, MD3Button } from '../../components/md3';
import { MessageSquare, FileText, Settings, Wand2 } from 'lucide-react';

export default function AIHubPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8 space-y-8">
      <div>
        <MD3Typography variant="display-small" className="mb-2">AI Hub</MD3Typography>
        <MD3Typography variant="body-large" className="text-gray-600">
          Central intelligence unit for content generation, chatbots, and automation.
        </MD3Typography>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/ai/chat" className="block">
            <MD3Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
                <div className="flex flex-col h-full space-y-4">
                    <div className="p-3 bg-blue-100 w-fit rounded-lg">
                        <MessageSquare className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <MD3Typography variant="headline-small" className="mb-2">AI Chat</MD3Typography>
                        <MD3Typography variant="body-medium" className="text-gray-500">
                            Interact with your Unified LLM service. Test prompts and get answers.
                        </MD3Typography>
                    </div>
                    <div className="mt-auto pt-4">
                         <MD3Button variant="text" endIcon={<span className="ml-1">→</span>}>Open Chat</MD3Button>
                    </div>
                </div>
            </MD3Card>
        </Link>

        <Link href="/ai/content" className="block">
            <MD3Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
                <div className="flex flex-col h-full space-y-4">
                    <div className="p-3 bg-purple-100 w-fit rounded-lg">
                        <FileText className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                        <MD3Typography variant="headline-small" className="mb-2">Content Studio</MD3Typography>
                        <MD3Typography variant="body-medium" className="text-gray-500">
                            Generate blog posts, social media captions, and SEO optimized content.
                        </MD3Typography>
                    </div>
                    <div className="mt-auto pt-4">
                         <MD3Button variant="text" color="secondary" endIcon={<span className="ml-1">→</span>}>Create Content</MD3Button>
                    </div>
                </div>
            </MD3Card>
        </Link>

        {/* Future: Prompt Management */}
        <div className="block opacity-75">
            <MD3Card className="p-6 h-full border-dashed border-2">
                 <div className="flex flex-col h-full space-y-4">
                    <div className="p-3 bg-gray-100 w-fit rounded-lg">
                        <Settings className="w-6 h-6 text-gray-500" />
                    </div>
                    <div>
                        <MD3Typography variant="headline-small" className="mb-2">Prompt Library</MD3Typography>
                        <MD3Typography variant="body-medium" className="text-gray-500">
                            Manage system prompts and fine-tuning templates. (Coming Soon)
                        </MD3Typography>
                    </div>
                </div>
            </MD3Card>
        </div>
      </div>
    </div>
  );
}
