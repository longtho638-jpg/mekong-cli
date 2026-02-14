
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // Use ANON key to simulate client

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRLS() {
    console.log('Testing RLS policies...');
    const email = 'customer1@example.com';
    const password = 'password123';

    // 1. Login
    const { data: { user }, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (loginError || !user) {
        console.error('Login failed:', loginError?.message);
        return;
    }
    console.log(`✅ Logged in as ${user.email} (${user.id})`);

    // 2. Try to read own profile
    const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (error) {
        console.error(`❌ RLS Check Failed:`, error.message);
        console.error(`   (This explains why redirection fails!)`);
    } else {
        console.log(`✅ RLS Check Passed. Role: ${data?.role}`);
    }
}

testRLS();
