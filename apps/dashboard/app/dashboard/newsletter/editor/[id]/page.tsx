"use client";
import Link from "next/link";
import { useState, use } from "react";
import { useRouter } from "next/navigation";

interface EditorProps {
    params: Promise<{ id: string }>;
}

export default function EditorPage({ params }: EditorProps) {
    const { id } = use(params);
    const router = useRouter();

    const [subject, setSubject] = useState("🚀 AI Trends in 2025: What You Need to Know");
    const [content, setContent] = useState(`# The Future is Here

Hey there,

The landscape of artificial intelligence is shifting faster than ever. Here's what's actually mattering right now.

## 🎯 The Big Picture

AI adoption has moved from "nice to have" to "must have" in 2025. Companies that aren't leveraging AI are falling behind.

**Key trends we're seeing:**
- Autonomous agents handling routine tasks
- AI-native applications replacing traditional software
- Personalization at unprecedented scale

## 💡 What This Means For You

1. **Embrace AI tools** - Start small with writing assistants
2. **Focus on prompting** - The skill of the decade
3. **Stay curious** - The field moves fast

## 📊 By The Numbers

- 78% of enterprises now use AI in production
- $150B invested in AI startups in 2024
- 10x productivity gains reported

---

**What are your thoughts on AI in 2025?** Reply to this email - I read every response.

Until next time,
Your Name`);

    const [aiTopic, setAiTopic] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [showAI, setShowAI] = useState(false);

    const generateWithAI = async () => {
        if (!aiTopic) return;
        setIsGenerating(true);

        // Simulate AI generation
        await new Promise(resolve => setTimeout(resolve, 2000));

        setSubject(`🚀 ${aiTopic}: What You Need to Know`);
        setContent(`# ${aiTopic}

Hey there,

The world of ${aiTopic.toLowerCase()} is evolving rapidly. Here's your essential update.

## 🎯 The Big Picture

[AI-generated overview of ${aiTopic.toLowerCase()} with current trends and insights]

## 💡 Key Takeaways

1. **Trend 1** - Description of first key trend
2. **Trend 2** - Description of second key trend
3. **Trend 3** - Description of third key trend

## 📊 What's Next

Looking ahead, we expect to see continued growth and innovation in this space.

---

**Got questions about ${aiTopic.toLowerCase()}?** Reply to this email.

Best,
Your Name`);

        setIsGenerating(false);
        setShowAI(false);
        setAiTopic("");
    };

    const handleSave = () => {
        alert("Newsletter saved as draft!");
    };

    const handleSend = () => {
        alert("Newsletter scheduled for sending!");
        router.push("/dashboard");
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a]">
            {/* Top Bar */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-[#12121a] border-b border-gray-800 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">
                        ← Back
                    </Link>
                    <span className="text-gray-600">|</span>
                    <h1 className="font-semibold">Tech Weekly</h1>
                    <span className="px-2 py-1 rounded bg-yellow-500/20 text-yellow-400 text-xs">Draft</span>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setShowAI(true)}
                        className="px-4 py-2 rounded-lg border border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/10 transition-colors flex items-center gap-2"
                    >
                        <span>🤖</span> AI Write
                    </button>
                    <button onClick={handleSave} className="btn-secondary">
                        Save Draft
                    </button>
                    <button onClick={handleSend} className="btn-primary">
                        Send →
                    </button>
                </div>
            </header>

            {/* Editor */}
            <main className="pt-24 pb-12 px-6">
                <div className="max-w-3xl mx-auto">
                    {/* Subject Line */}
                    <div className="mb-6">
                        <label className="block text-sm text-gray-400 mb-2">Subject Line</label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="w-full px-4 py-3 text-xl font-semibold bg-transparent border-b border-gray-700 focus:border-indigo-500 focus:outline-none transition-colors"
                            placeholder="Enter your subject line"
                        />
                    </div>

                    {/* Preview Text */}
                    <div className="mb-8">
                        <label className="block text-sm text-gray-400 mb-2">Preview Text</label>
                        <input
                            type="text"
                            className="w-full px-4 py-2 text-gray-400 bg-transparent border-b border-gray-800 focus:border-gray-700 focus:outline-none transition-colors"
                            placeholder="The text that appears in email previews..."
                        />
                    </div>

                    {/* Content Editor */}
                    <div className="glass rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-700">
                            <button className="p-2 hover:bg-gray-700 rounded transition-colors font-bold">B</button>
                            <button className="p-2 hover:bg-gray-700 rounded transition-colors italic">I</button>
                            <button className="p-2 hover:bg-gray-700 rounded transition-colors underline">U</button>
                            <span className="text-gray-600 mx-2">|</span>
                            <button className="p-2 hover:bg-gray-700 rounded transition-colors">H1</button>
                            <button className="p-2 hover:bg-gray-700 rounded transition-colors">H2</button>
                            <span className="text-gray-600 mx-2">|</span>
                            <button className="p-2 hover:bg-gray-700 rounded transition-colors">📎</button>
                            <button className="p-2 hover:bg-gray-700 rounded transition-colors">🖼️</button>
                            <button className="p-2 hover:bg-gray-700 rounded transition-colors">🔗</button>
                        </div>

                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full min-h-[500px] bg-transparent text-gray-200 focus:outline-none resize-none leading-relaxed font-mono text-sm"
                            placeholder="Start writing your newsletter..."
                        />
                    </div>

                    {/* Stats Preview */}
                    <div className="mt-8 grid grid-cols-4 gap-4">
                        <div className="glass rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold">1,247</div>
                            <div className="text-gray-400 text-sm">Recipients</div>
                        </div>
                        <div className="glass rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-indigo-400">~650</div>
                            <div className="text-gray-400 text-sm">Est. Opens</div>
                        </div>
                        <div className="glass rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-green-400">~180</div>
                            <div className="text-gray-400 text-sm">Est. Clicks</div>
                        </div>
                        <div className="glass rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold">3 min</div>
                            <div className="text-gray-400 text-sm">Read Time</div>
                        </div>
                    </div>
                </div>
            </main>

            {/* AI Modal */}
            {showAI && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="glass rounded-2xl p-8 w-full max-w-md">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold">🤖 AI Writer</h2>
                            <button onClick={() => setShowAI(false)} className="text-gray-400 hover:text-white">✕</button>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium mb-2">What's the topic?</label>
                                <input
                                    type="text"
                                    value={aiTopic}
                                    onChange={(e) => setAiTopic(e.target.value)}
                                    className="w-full px-4 py-3 bg-[#12121a] border border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    placeholder="e.g. Top productivity tips for 2025"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Tone</label>
                                <select className="w-full px-4 py-3 bg-[#12121a] border border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500">
                                    <option>Professional</option>
                                    <option>Casual</option>
                                    <option>Friendly</option>
                                    <option>Formal</option>
                                </select>
                            </div>

                            <button
                                onClick={generateWithAI}
                                disabled={isGenerating || !aiTopic}
                                className="w-full btn-primary flex items-center justify-center gap-2"
                            >
                                {isGenerating ? (
                                    <><span className="animate-spin">⏳</span> Generating...</>
                                ) : (
                                    <>✨ Generate Newsletter</>
                                )}
                            </button>

                            <p className="text-gray-500 text-sm text-center">
                                AI will generate a full draft based on your topic
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
