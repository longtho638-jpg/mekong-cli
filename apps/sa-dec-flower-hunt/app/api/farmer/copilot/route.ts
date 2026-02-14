import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '@/lib/supabase';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Helper function for authentication check
async function authenticateRequest(req: NextRequest) {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
        return { error: 'Unauthorized: Missing Token', status: 401 };
    }

    if (!supabase) {
        return { error: "Supabase not configured", status: 503 };
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
        return { error: 'Unauthorized: Invalid Token', status: 401 };
    }

    return { user };
}

export async function POST(req: NextRequest) {
    try {
        // Security Check: Verify Auth Token
        const authHeader = req.headers.get('Authorization');
        const token = authHeader?.split(' ')[1];

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized: Missing Token' }, { status: 401 });
        }

        if (!supabase) {
            return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
        }

        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized: Invalid Token' }, { status: 401 });
        }

        const { message, context } = await req.json();

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

        const prompt = `
    You are Agri - Copilot, a helpful and friendly AI assistant for farmers in Sa Dec, Vietnam.
    
    Context about User: ${context}
    
    User says: "${message}"

Respond in Vietnamese.Be concise, practical, and use a respectful but warm tone(like a junior talking to an elder "Bác/Chú").
    Focus on agricultural advice(pest control, weather, market prices, care tips).
    If the question is unrelated to farming, politely steer it back.
    `;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        return NextResponse.json({ text });
    } catch (error) {
        console.error('Agri-Copilot Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
