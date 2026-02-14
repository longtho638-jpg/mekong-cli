/**
 * ============================================================================
 * GEMINI AI TEST ENDPOINT
 * ============================================================================
 * Direct test of GeminiService Core IP
 * 
 * @author Minh Long
 * @copyright 2024 AGRIOS Tech
 * ============================================================================
 */

import { NextResponse } from 'next/server';
import { GeminiService } from '@/lib/gemini-service';

/**
 * GET /api/admin/gemini-test
 * 
 * Quick health check for Gemini AI integration
 */
export async function GET() {
    const hasApiKey = !!process.env.GEMINI_API_KEY;

    return NextResponse.json({
        success: true,
        coreIpName: 'GeminiService',
        version: '1.0.0',
        author: 'Minh Long',
        hasApiKey,
        features: [
            'generateText() - Text generation',
            'generateFromImage() - Image analysis',
            'generateMarketingContent() - Marketing content',
            'callGeminiWithRetry() - Robust retry logic'
        ],
        endpoint: 'POST /api/admin/gemini-test',
        samplePayload: {
            action: 'generateText',
            prompt: 'Hello, Gemini!'
        },
        timestamp: new Date().toISOString()
    });
}

/**
 * POST /api/admin/gemini-test
 * 
 * Test Gemini AI generation
 * 
 * @param {string} action - 'generateText' | 'generateMarketingContent'
 * @param {string} prompt - Text prompt
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action, prompt, topic, persona, goal } = body;

        console.log(`🤖 [Gemini Test API] Testing ${action}...`);

        const startTime = Date.now();
        let result;

        switch (action) {
            case 'generateText':
                result = await GeminiService.generateText(prompt || 'Say hello in Vietnamese');
                break;
            case 'generateMarketingContent':
                result = await GeminiService.generateMarketingContent({
                    topic: topic || 'Sa Dec Flower Festival',
                    persona: persona || 'Young Vietnamese tourists',
                    goal: goal || 'Increase ticket sales'
                });
                break;
            default:
                return NextResponse.json({
                    success: false,
                    error: `Unknown action: ${action}. Use: generateText, generateMarketingContent`
                }, { status: 400 });
        }

        const executionTime = Date.now() - startTime;

        console.log(`✅ [Gemini Test API] Completed in ${executionTime}ms`);

        return NextResponse.json({
            success: true,
            coreIpVersion: '1.0.0',
            action,
            executionTimeMs: executionTime,
            timestamp: new Date().toISOString(),
            result
        });

    } catch (error) {
        console.error('❌ [Gemini Test API] Error:', error);

        return NextResponse.json({
            success: false,
            error: (error as Error).message,
            hasApiKey: !!process.env.GEMINI_API_KEY,
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}
