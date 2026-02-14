import { execSync } from 'child_process';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Whitelist allowed commands only
const ALLOWED_COMMANDS = {
    'seed-db': 'bash scripts/seed.sh',
    'migrate': 'bash scripts/migrate.sh',
    'reset': 'bash scripts/reset.sh',
} as const;

export async function POST(req: Request) {
    try {
        // 🔒 SECURITY: Require admin authentication
        const cookieStore = await cookies();
        const adminAuth = cookieStore.get('admin_auth');
        if (!adminAuth || adminAuth.value !== 'true') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { scriptCommand } = await req.json();

        // Validate command is whitelisted
        if (!Object.keys(ALLOWED_COMMANDS).includes(scriptCommand)) {
            return NextResponse.json(
                { error: `Invalid command. Allowed: ${Object.keys(ALLOWED_COMMANDS).join(', ')}` },
                { status: 400 }
            );
        }

        const fullCommand = ALLOWED_COMMANDS[scriptCommand as keyof typeof ALLOWED_COMMANDS];

        // Execute with timeout (30s max)
        const result = execSync(fullCommand, {
            cwd: process.cwd(),
            timeout: 30000,
            stdio: 'pipe',
        }).toString();

        return NextResponse.json({
            success: true,
            command: scriptCommand,
            output: result.substring(0, 1000), // Limit output
        });
    } catch (error: any) {
        console.error('Script execution failed:', error);
        return NextResponse.json(
            { error: error.message || 'Script execution failed' },
            { status: 500 }
        );
    }
}
