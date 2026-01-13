import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();

    // Get user from token
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
        return res.status(401).json({ error: 'Invalid token' });
    }

    // GET: Get balance and history
    if (req.method === 'GET') {
        const { type } = req.query;

        if (type === 'history') {
            const { data: transactions } = await supabase
                .from('ag_transactions')
                .select('*')
                .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
                .order('created_at', { ascending: false })
                .limit(50);

            return res.json({ transactions: transactions || [] });
        }

        // Default: Get balance
        const { data: credits } = await supabase
            .from('ag_credits')
            .select('*, ag_ranks!inner(*)')
            .eq('user_id', user.id)
            .single();

        // Get rank info
        const { data: rankInfo } = await supabase
            .from('ag_ranks')
            .select('*')
            .eq('rank', credits?.rank || 'chien_binh')
            .single();

        return res.json({
            balance: credits?.balance || 0,
            lifetime_earned: credits?.lifetime_earned || 0,
            lifetime_spent: credits?.lifetime_spent || 0,
            rank: credits?.rank || 'chien_binh',
            rank_info: rankInfo || null,
        });
    }

    // POST: Transfer credits
    if (req.method === 'POST') {
        const { to_email, amount, description } = req.body;

        if (!to_email || !amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid transfer request' });
        }

        // Find recipient by email
        const { data: recipient } = await supabase
            .from('users')
            .select('id')
            .eq('email', to_email)
            .single();

        if (!recipient) {
            return res.status(404).json({ error: 'Recipient not found' });
        }

        if (recipient.id === user.id) {
            return res.status(400).json({ error: 'Cannot transfer to yourself' });
        }

        // Execute transfer
        const { data, error } = await supabase.rpc('transfer_ag_credits', {
            p_from_user: user.id,
            p_to_user: recipient.id,
            p_amount: amount,
            p_description: description || 'P2P Transfer',
        });

        if (error) {
            console.error('Transfer error:', error);
            return res.status(400).json({ error: error.message || 'Transfer failed' });
        }

        return res.json({ success: true, message: `Transferred ${amount} AGC to ${to_email}` });
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
