
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsers() {
    const emails = ['farmer1@sadec.local', 'customer1@example.com'];
    console.log(`Checking for demo users: ${emails.join(', ')}...`);

    for (const email of emails) {
        // Check Auth
        const { data, error } = await supabase.from('profiles').select('*').eq('email', email).single();

        if (data) {
            console.log(`✅ Found ${email} (Role: ${data.role})`);
        } else {
            console.log(`❌ NOT FOUND: ${email}`);
        }
    }
}

checkUsers();
