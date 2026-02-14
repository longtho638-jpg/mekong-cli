const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.0-pro-001:generateContent`;

export async function callGemini(prompt: string) {
    return GeminiService.generateText(prompt);
}

export const GeminiService = {
    generateText: async (prompt: string) => {
        const payload = {
            contents: [{ parts: [{ text: prompt }] }],
        };
        return callGeminiWithRetry(payload);
    },

    generateFromImage: async ({ imageBase64, mimeType, prompt }: { imageBase64: string, mimeType: string, prompt: string }) => {
        const payload = {
            contents: [{
                parts: [
                    { text: prompt },
                    {
                        inline_data: {
                            mime_type: mimeType,
                            data: imageBase64
                        }
                    }
                ]
            }]
        };
        return callGeminiWithRetry(payload);
    },

    generateMarketingContent: async ({ topic, persona, goal, context }: { topic: string, persona: string, goal: string, context?: string }) => {
        const prompt = `
        You are a marketing expert.
        Persona: ${persona}
        Topic: ${topic}
        Goal: ${goal}
        Context: ${context || ''}
        
        Generate engaging marketing content.
        `;
        return GeminiService.generateText(prompt);
    }
};

// Robust retry implementation (Fix #5)
async function callGeminiWithRetry(
    requestBody: any,
    maxRetries = 3
): Promise<string> {
    let lastError: Error | null = null;
    const apiKey = process.env.GEMINI_API_KEY; // Use server-side key by default

    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is missing");
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

            const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`Gemini API returned ${response.status}`);
            }

            const data = await response.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        } catch (error: any) {
            lastError = error;

            // Check if timeout
            if (error.name === 'AbortError') {
                console.warn(`[Gemini] Timeout on attempt ${attempt}/${maxRetries}`);
                if (attempt < maxRetries) {
                    // Exponential backoff
                    await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
                    continue;
                }
                throw new Error('Gemini API timeout (30s)');
            }

            // Check if retryable error
            if (error.message?.includes('ECONNRESET') || error.message?.includes('ETIMEDOUT')) {
                console.warn(`[Gemini] Retryable error on attempt ${attempt}/${maxRetries}:`, error.message);
                if (attempt < maxRetries) {
                    await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
                    continue;
                }
            }

            // Non-retryable error
            throw error;
        }
    }

    throw lastError || new Error('Gemini API failed after retries');
}
