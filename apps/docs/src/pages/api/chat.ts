import type { APIRoute } from 'astro';
import { OpenRouterClient } from '../../lib/openrouter';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: messages array required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate API key
    const apiKey = import.meta.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: 'OpenRouter API key not configured. Please contact support.'
        }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Add system context about AgencyOS
    const systemMessage = {
      role: 'system' as const,
      content: `You are a helpful AI assistant for AgencyOS documentation.
AgencyOS is a production-grade framework for Claude Code with agents, commands, and skills.
Provide accurate, concise answers based on the documentation.
If you don't know something, be honest about it.`
    };

    const client = new OpenRouterClient(apiKey);

    const response = await client.chat({
      messages: [systemMessage, ...messages],
      model: 'anthropic/claude-3.5-sonnet',
      temperature: 0.7,
      max_tokens: 2048,
    });

    return new Response(
      JSON.stringify({ content: response }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('AI chat API error:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to process your request. Please try again later.',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
