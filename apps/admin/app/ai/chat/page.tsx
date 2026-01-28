'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MD3Typography, MD3Button, MD3Card, MD3TextField } from '../../../components/md3';
import { Send, User, Bot, Loader2 } from 'lucide-react';
import { api } from '../../../lib/api';

interface Message {
  role: 'user' | 'model';
  content: string;
}

export default function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await api.post('/llm/chat', {
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          provider: 'gemini'
      });

      const data = response.data;
      const botMsg: Message = { role: 'model', content: data.result };
      setMessages(prev => [...prev, botMsg]);

    } catch (error) {
        console.error(error);
        setMessages(prev => [...prev, { role: 'model', content: 'Error: Could not get response from AI. Ensure backend is running.' }]);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col space-y-4">
        <div>
            <MD3Typography variant="headline-medium">AI Chat Assistant</MD3Typography>
            <MD3Typography variant="body-medium" className="text-gray-500">
                Powered by Unified LLM Layer (Gemini/OpenAI)
            </MD3Typography>
        </div>

        <MD3Card className="flex-1 flex flex-col p-4 overflow-hidden bg-white border border-gray-200 shadow-sm">
            <div className="flex-1 overflow-y-auto space-y-4 p-2">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-50">
                        <Bot size={48} className="mb-2" />
                        <p>Start a conversation...</p>
                    </div>
                )}
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex max-w-[80%] gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'}`}>
                                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                            </div>
                            <div className={`p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-gray-100 text-gray-800 rounded-tl-none'}`}>
                                {msg.content}
                            </div>
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                         <div className="flex gap-2">
                             <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center flex-shrink-0">
                                <Bot size={16} />
                            </div>
                            <div className="p-3 bg-gray-100 rounded-2xl rounded-tl-none flex items-center">
                                <Loader2 size={16} className="animate-spin text-gray-500" />
                            </div>
                         </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                <div className="flex-1">
                     <MD3TextField
                        label=""
                        placeholder="Type your message..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                        className="mb-0"
                    />
                </div>
                <MD3Button
                    onClick={handleSend}
                    disabled={loading || !input.trim()}
                    variant="filled"
                    className="h-10 mt-1"
                >
                    <Send size={18} />
                </MD3Button>
            </div>
        </MD3Card>
    </div>
  );
}
