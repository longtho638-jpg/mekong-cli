
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

async function createDemoUsers() {
    console.log('Creating demo users...');

    const users = [
        {
            email: 'farmer1@sadec.com',
            password: 'Sadec@2025_Secure!',
            full_name: 'Demo Farmer',
            role: 'farmer'
        },
        {
            email: 'customer1@example.com',
            password: 'Sadec@2025_Secure!',
            full_name: 'Demo Customer',
            role: 'customer'
        }
    ];

    // Strategy: Try Login -> Get ID -> Update Password -> Upsert Profile
    // If Login fail -> Create User -> Upsert Profile

    for (const u of users) {
        let userId: string | undefined;

        console.log(`Checking ${u.email}...`);

        // 1. Try Login OLD PASSWORD (to migrate)
        const { data: signInOld } = await supabase.auth.signInWithPassword({
            email: u.email,
            password: 'password123'
        });

        // 2. Try Login NEW PASSWORD
        const { data: signInNew } = await supabase.auth.signInWithPassword({
            email: u.email,
            password: u.password
        });

        if (signInNew.user) {
            userId = signInNew.user.id;
            console.log(`✅ Logged in (New Pwd): ${u.email}`);
        } else if (signInOld.user) {
            userId = signInOld.user.id;
            console.log(`⚠️  Migrating Password for ${u.email}...`);
            await supabase.auth.admin.updateUserById(userId, { password: u.password });
        } else {
            // 3. Create User
            console.log(`User not found, creating ${u.email}...`);
            const { data: createData, error: createError } = await supabase.auth.admin.createUser({
                email: u.email,
                password: u.password,
                email_confirm: true,
                user_metadata: { full_name: u.full_name, role: u.role }
            });

            if (createData.user) {
                userId = createData.user.id;
                console.log(`✅ Created User: ${u.email}`);
            } else {
                console.error(`❌ Failed to create ${u.email}:`, createError?.message);
            }
        }

        // 4. Upsert Profile
        if (userId) {
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: userId,
                    full_name: u.full_name,
                    role: u.role,
                    avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.role}`,
                });

            if (profileError) {
                console.error(`Error creating profile for ${u.email}:`, profileError.message);
            } else {
                console.log(`✅ Upserted Profile for ${u.email}`);
            }

            // 5. If Farmer, create Wallet
            if (u.role === 'farmer') {
                await supabase.from('farmer_wallets').upsert({
                    farmer_id: userId,
                    balance: 0,
                    total_earned: 0
                });
                console.log(`✅ Upserted Wallet for Farmer`);
            }
        }
    }
}

createDemoUsers();
