'use client';

import React, { useState } from 'react';
import { MD3Typography, MD3Button, MD3Card, MD3TextField, MD3Select } from '../../../components/md3';
import { FileText, Loader2, Copy, Check } from 'lucide-react';
import { api } from '../../../lib/api';

export default function ContentGenerationPage() {
  const [activeTab, setActiveTab] = useState<'blog' | 'social' | 'seo'>('blog');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);

  // Blog State
  const [topic, setTopic] = useState('');
  const [keywords, setKeywords] = useState('');
  const [tone, setTone] = useState('professional');

  // Social State
  const [socialDesc, setSocialDesc] = useState('');
  const [platform, setPlatform] = useState('linkedin');

  // SEO State
  const [seoContent, setSeoContent] = useState('');

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateBlog = async () => {
    setLoading(true);
    try {
        const res = await api.post('/llm/content/blog', { topic, keywords, tone });
        setResult(res.data.result);
    } catch (e) {
        setResult('Error generating content');
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const generateSocial = async () => {
    setLoading(true);
    try {
        const res = await api.post('/llm/content/social', { description: socialDesc, platform });
        setResult(res.data.result);
    } catch (e) {
        setResult('Error generating content');
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const generateSEO = async () => {
    setLoading(true);
    try {
        const res = await api.post('/llm/content/seo', { content: seoContent });
        setResult(res.data.result);
    } catch (e) {
        setResult('Error generating content');
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8 space-y-8">
      <div>
        <MD3Typography variant="headline-medium">Content Studio</MD3Typography>
        <MD3Typography variant="body-large" className="text-gray-600">
          AI-powered content generation suite.
        </MD3Typography>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Panel: Inputs */}
        <div className="lg:col-span-1 space-y-6">
            <MD3Card className="p-0 overflow-hidden">
                <div className="flex border-b border-gray-200">
                    <button
                        className={`flex-1 py-3 text-sm font-medium ${activeTab === 'blog' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setActiveTab('blog')}
                    >
                        Blog Post
                    </button>
                    <button
                        className={`flex-1 py-3 text-sm font-medium ${activeTab === 'social' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setActiveTab('social')}
                    >
                        Social
                    </button>
                    <button
                        className={`flex-1 py-3 text-sm font-medium ${activeTab === 'seo' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setActiveTab('seo')}
                    >
                        SEO
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {activeTab === 'blog' && (
                        <>
                            <MD3TextField label="Topic" value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Future of AI in Marketing" />
                            <MD3TextField label="Keywords (Optional)" value={keywords} onChange={e => setKeywords(e.target.value)} placeholder="Comma separated" />
                            <MD3Select
                                label="Tone"
                                value={tone}
                                onChange={e => setTone(e.target.value)}
                                options={[
                                    { value: 'professional', label: 'Professional' },
                                    { value: 'casual', label: 'Casual' },
                                    { value: 'enthusiastic', label: 'Enthusiastic' },
                                    { value: 'educational', label: 'Educational' }
                                ]}
                            />
                            <MD3Button onClick={generateBlog} disabled={loading || !topic} className="w-full">
                                {loading ? <Loader2 className="animate-spin" /> : 'Generate Blog Post'}
                            </MD3Button>
                        </>
                    )}

                    {activeTab === 'social' && (
                        <>
                            <MD3TextField
                                label="Content Description"
                                value={socialDesc}
                                onChange={e => setSocialDesc(e.target.value)}
                                multiline rows={4}
                                placeholder="What is this post about?"
                            />
                             <MD3Select
                                label="Platform"
                                value={platform}
                                onChange={e => setPlatform(e.target.value)}
                                options={[
                                    { value: 'linkedin', label: 'LinkedIn' },
                                    { value: 'twitter', label: 'Twitter / X' },
                                    { value: 'facebook', label: 'Facebook' },
                                    { value: 'instagram', label: 'Instagram' }
                                ]}
                            />
                            <MD3Button onClick={generateSocial} disabled={loading || !socialDesc} className="w-full">
                                {loading ? <Loader2 className="animate-spin" /> : 'Generate Caption'}
                            </MD3Button>
                        </>
                    )}

                     {activeTab === 'seo' && (
                        <>
                            <MD3TextField
                                label="Content to Optimize"
                                value={seoContent}
                                onChange={e => setSeoContent(e.target.value)}
                                multiline rows={8}
                                placeholder="Paste your content here..."
                            />
                            <MD3Button onClick={generateSEO} disabled={loading || !seoContent} className="w-full">
                                {loading ? <Loader2 className="animate-spin" /> : 'Optimize SEO'}
                            </MD3Button>
                        </>
                    )}
                </div>
            </MD3Card>
        </div>

        {/* Right Panel: Output */}
        <div className="lg:col-span-2">
            <MD3Card className="h-full min-h-[500px] flex flex-col p-6 relative bg-gray-50">
                 <div className="flex justify-between items-center mb-4">
                    <MD3Typography variant="title-medium" className="text-gray-700">Generated Output</MD3Typography>
                    {result && (
                        <button
                            onClick={handleCopy}
                            className="text-sm flex items-center gap-1 text-gray-500 hover:text-blue-600 transition-colors"
                        >
                            {copied ? <Check size={16} /> : <Copy size={16} />}
                            {copied ? 'Copied!' : 'Copy'}
                        </button>
                    )}
                 </div>

                 {loading ? (
                     <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                         <Loader2 size={48} className="animate-spin mb-4 text-blue-500" />
                         <p>Generating high-quality content...</p>
                     </div>
                 ) : result ? (
                     <div className="flex-1 bg-white p-6 rounded-lg border border-gray-200 overflow-y-auto whitespace-pre-wrap font-mono text-sm">
                         {result}
                     </div>
                 ) : (
                     <div className="flex-1 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                         <FileText size={48} className="mb-2 opacity-50" />
                         <p>Fill the form to generate content</p>
                     </div>
                 )}
            </MD3Card>
        </div>
      </div>
    </div>
  );
}
