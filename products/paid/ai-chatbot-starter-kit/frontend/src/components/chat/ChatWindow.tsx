"use client";

import { useState, useEffect } from 'react';
import { useStreamingResponse } from '@/hooks/useStreamingResponse';
import { MessageList, Message } from './MessageList';
import { MessageInput } from './MessageInput';
import { v4 as uuidv4 } from 'uuid';

export function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([]);
  const { streamMessage, isStreaming } = useStreamingResponse();
  const [conversationId, setConversationId] = useState<string>("");

  useEffect(() => {
    setConversationId(uuidv4());
  }, []);

  const handleSend = async (content: string) => {
    const userMessage: Message = { role: 'user', content };
    setMessages(prev => [...prev, userMessage]);

    const aiMessage: Message = { role: 'assistant', content: '' };
    setMessages(prev => [...prev, aiMessage]);

    await streamMessage(content, conversationId, (token) => {
      setMessages(prev => {
        const updated = [...prev];
        const lastMsg = updated[updated.length - 1];
        lastMsg.content += token;
        return updated;
      });
    });
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="p-4 border-b flex justify-between items-center bg-background z-10">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
          AI Chatbot Starter Kit
        </h1>
        <div className="text-xs text-muted-foreground">
          ID: {conversationId.slice(0, 8)}
        </div>
      </header>

      <MessageList messages={messages} />
      <MessageInput onSend={handleSend} disabled={isStreaming} />
    </div>
  );
}
