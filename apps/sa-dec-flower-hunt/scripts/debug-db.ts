
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('--- DEBUG INFO ---');
console.log('URL:', supabaseUrl ? 'Set' : 'Missing');
console.log('Key:', supabaseKey ? 'Set' : 'Missing');
console.log('------------------');

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables!');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    try {
        console.log('Testing connection to profiles table...');
        const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });

        if (error) {
            console.error('❌ Connection Failed:', error.message);
            console.error('Full Error:', JSON.stringify(error, null, 2));
        } else {
            console.log('✅ Connection Successful!');
            console.log('Profiles Table Exists. Count:', data);
        }
    } catch (err) {
        console.error('❌ Unexpected Error:', err);
    }
}

testConnection();
