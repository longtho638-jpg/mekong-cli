import { NextRequest, NextResponse } from 'next/server';
import { GeminiService } from '@/lib/gemini-service';

export const maxDuration = 30; // 30 seconds max for AI generation

export async function POST(req: NextRequest) {
    try {
        const { image, mimeType } = await req.json();

        if (!image) {
            return NextResponse.json({ error: 'Image is required' }, { status: 400 });
        }

        const prompt = `
    You are an expert copywriter for Sa Dec flowers. Analyze this flower image and generate a sales listing.
    
    Output JSON format:
    {
      "name": "Suggest a catchy name (e.g., Cúc Mâm Xôi Vàng Hè)",
      "price_suggestion": 150000, 
      "description": "A 2-sentence emotional description for customers. Focus on beauty, luck, and freshness.",
      "care_tips": "One key tip to keep it fresh longer.",
      "tags": ["Tag1", "Tag2"]
    }
    
    Be authentic, Vietnamese language, friendly tone.
    `;

        const result = await GeminiService.generateFromImage({
            imageBase64: image,
            mimeType: mimeType || 'image/jpeg',
            prompt: prompt
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error('AI Listing Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
