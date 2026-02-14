import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create client safely to prevent build-time errors
const createSafeClient = () => {
    if (!supabaseUrl || !supabaseKey) {
        return {
            from: () => ({
                select: () => ({
                    eq: () => ({
                        eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }),
                        single: () => Promise.resolve({ data: null, error: null })
                    }),
                    order: () => ({ limit: () => Promise.resolve({ data: [], error: null }) }),
                }),
                insert: () => Promise.resolve({ error: null }),
                update: () => ({ eq: () => Promise.resolve({ error: null }) }),
            }),
            rpc: () => Promise.resolve({ error: null }),
        } as any;
    }
    return createClient(supabaseUrl, supabaseKey);
};

// Use getter to ensure runtime-only access
const getSupabase = () => createSafeClient();

/**
 * Gamification Service - "Flower Hunt" Logic
 * Handles points, QR scanning, and achievements
 */
export class GamificationService {

    /**
     * Scan QR Code (Flower Hunt)
     */
    static async scanFlowerQR(userId: string, flowerId: string) {
        // 1. Check if already scanned
        const { data: existing } = await getSupabase()
            .from('flower_hunts')
            .select('*')
            .eq('user_id', userId)
            .eq('flower_id', flowerId)
            .single();

        if (existing) {
            return { status: 'already_scanned', message: 'Bạn đã săn hoa này rồi!' };
        }

        // 2. Add scan record
        const { error: scanError } = await getSupabase()
            .from('flower_hunts')
            .insert({
                user_id: userId,
                flower_id: flowerId,
                scanned_at: new Date().toISOString(),
                points_earned: 100 // Default points per flower
            });

        if (scanError) throw scanError;

        // 3. Update User Points
        await this.addPoints(userId, 100, 'flower_hunt_scan');

        return { status: 'success', points: 100, message: 'Săn thành công! +100 điểm' };
    }

    /**
     * Add Points
     */
    static async addPoints(userId: string, amount: number, source: string) {
        // Implement point tracking logic (e.g., updating a profiles table)
        // For MVP, we'll assume a 'profiles' table with a 'points' column
        const { error } = await getSupabase().rpc('add_user_points', {
            user_id_param: userId,
            points_param: amount
        });

        if (error) {
            // Fallback: manual update if RPC doesn't exist
            const { data: profile } = await getSupabase()
                .from('profiles')
                .select('points')
                .eq('id', userId)
                .single();

            const newPoints = (profile?.points || 0) + amount;

            await getSupabase()
                .from('profiles')
                .update({ points: newPoints })
                .eq('id', userId);
        }
    }

    /**
     * Get Leaderboard
     */
    static async getLeaderboard() {
        const { data, error } = await getSupabase()
            .from('profiles')
            .select('username, points, avatar_url')
            .order('points', { ascending: false })
            .limit(10);

        if (error) throw error;
        return data;
    }
}
