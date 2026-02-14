import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

const CONFIG_PATH = path.join(process.cwd(), 'marketing_config.json');

export async function GET(request: Request) {
    // Security Check: Verify Auth Token
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!supabase) {
        return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        if (!fs.existsSync(CONFIG_PATH)) {
            // Default Config
            const defaultConfig = {
                landing_headline: "HYPERNATURE",
                banner_text: "Săn hoa ảo, nhận quà thật Tết 2026!",
                is_campaign_active: true
            };
            fs.writeFileSync(CONFIG_PATH, JSON.stringify(defaultConfig, null, 2));
            return NextResponse.json(defaultConfig);
        }
        const configData = fs.readFileSync(CONFIG_PATH, 'utf-8');
        return NextResponse.json(JSON.parse(configData));
    } catch (error) {
        return NextResponse.json({ error: "Failed to read config" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    // Security Check
    const authHeader = req.headers.get("authorization");
    if (!supabase) {
        return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
    }
    if (!authHeader) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader?.split(' ')[1];

    if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        let currentConfig = {};

        if (fs.existsSync(CONFIG_PATH)) {
            currentConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
        }

        const newConfig = { ...currentConfig, ...body };
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(newConfig, null, 2));

        return NextResponse.json({ success: true, config: newConfig });
    } catch (error) {
        return NextResponse.json({ error: "Failed to save config" }, { status: 500 });
    }
}
