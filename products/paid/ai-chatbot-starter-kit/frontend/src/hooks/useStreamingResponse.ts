import { useState, useCallback } from 'react';

export function useStreamingResponse() {
  const [isStreaming, setIsStreaming] = useState(false);

  const streamMessage = useCallback(async (
    message: string,
    conversationId: string,
    onToken: (token: string) => void
  ) => {
    setIsStreaming(true);
    try {
      // Use our backend API directly (proxied via Next.js if needed to hide keys,
      // but here we call backend directly for simplicity as per requirements)
      // Wait, requirements said use /api/chat/route.ts as proxy.
      // Let's assume we call the Next.js API route which calls backend.

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: message }],
          conversation_id: conversationId
        }),
      });

      if (!response.body) return;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const token = line.slice(6);
            if (token === '[DONE]') break;
            onToken(token);
          }
        }
      }
    } catch (error) {
      console.error("Streaming error:", error);
      onToken("\n[Error: Connection failed]");
    } finally {
      setIsStreaming(false);
    }
  }, []);

  return { streamMessage, isStreaming };
}
