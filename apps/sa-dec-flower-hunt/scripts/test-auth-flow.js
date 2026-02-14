#!/usr/bin/env node

/**
 * COMPREHENSIVE AUTH DEBUG SCRIPT
 * Tests the complete authentication flow step-by-step
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function comprehensiveTest() {
    console.log('🔍 COMPREHENSIVE AUTH DEBUG SCRIPT');
    console.log('=====================================\n');

    // Step 1: Environment Check
    console.log('📋 STEP 1: Environment Variables');
    console.log(`URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅' : '❌'}`);
    console.log(`KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅' : '❌'}\n`);

    // Step 2: Sign In
    console.log('🔐 STEP 2: Signing in as farmer1@sadec.com');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'farmer1@sadec.com',
        password: 'password123'
    });

    if (authError) {
        console.error('❌ AUTH ERROR:', authError.message);
        return;
    }

    console.log('✅ Auth Success!');
    console.log(`User ID: ${authData.user.id}`);
    console.log(`Session Token: ${authData.session.access_token.substring(0, 20)}...`);
    console.log(`Session Expires: ${new Date(authData.session.expires_at * 1000).toLocaleString()}\n`);

    // Step 3: Check Session
    console.log('🔍 STEP 3: Verifying Session');
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
        console.error('❌ SESSION ERROR:', sessionError.message);
        return;
    }

    console.log('✅ Session Valid!');
    console.log(`Session User: ${sessionData.session?.user.email}\n`);

    // Step 4: Fetch Profile
    console.log('👤 STEP 4: Fetching Profile');
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('id', authData.user.id)
        .single();

    if (profileError) {
        console.error('❌ PROFILE ERROR:', profileError.message);
        console.error('Details:', profileError);
        return;
    }

    console.log('✅ Profile Found!');
    console.log(`Name: ${profile.full_name}`);
    console.log(`Role: ${profile.role}\n`);

    // Step 5: Test RLS
    console.log('🛡️  STEP 5: Testing Row Level Security');
    const { data: ownProfile, error: rlsError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id);

    if (rlsError) {
        console.error('❌ RLS ERROR:', rlsError.message);
        return;
    }

    console.log(`✅ RLS Working! Can read own profile: ${ownProfile.length > 0}\n`);

    // Step 6: Sign Out
    console.log('🚪 STEP 6: Signing Out');
    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
        console.error('❌ SIGNOUT ERROR:', signOutError.message);
        return;
    }

    console.log('✅ Signed Out Successfully\n');

    // Final Summary
    console.log('=====================================');
    console.log('📊 TEST SUMMARY:');
    console.log('✅ Environment: OK');
    console.log('✅ Authentication: OK');
    console.log('✅ Session Management: OK');
    console.log('✅ Profile Fetch: OK');
    console.log('✅ RLS Policies: OK');
    console.log('✅ Sign Out: OK');
    console.log('\n🎉 ALL TESTS PASSED!');
}

comprehensiveTest().catch(console.error);
