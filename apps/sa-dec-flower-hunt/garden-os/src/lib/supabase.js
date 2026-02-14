// ============================================================================
// GARDEN OS - SHARED SUPABASE CLIENT
// ============================================================================
// Connects to same brain as Hunter Guide (Next.js web app)
// ============================================================================

import { createClient } from '@supabase/supabase-js';

// Use environment variables (set in Zalo Mini App dashboard)
const SUPABASE_URL = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================================
// GARDEN FUNCTIONS
// ============================================================================

/**
 * Get or create garden for Zalo user
 */
export async function getOrCreateGarden(zaloId, userInfo) {
    // Try to find existing garden
    const { data: existing } = await supabase
        .from('gardens')
        .select('*')
        .eq('zalo_id', zaloId)
        .single();

    if (existing) {
        return existing;
    }

    // Create new garden
    const { data: newGarden, error } = await supabase
        .from('gardens')
        .insert({
            zalo_id: zaloId,
            name: `Vườn của ${userInfo?.name || 'Nông Dân'}`,
            owner_name: userInfo?.name,
            owner_phone: userInfo?.phone,
            status: 'OPEN'
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating garden:', error);
        throw error;
    }

    return newGarden;
}

/**
 * Get inventory for a garden
 */
export async function getInventory(gardenId) {
    const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('garden_id', gardenId)
        .order('flower_type');

    if (error) throw error;
    return data || [];
}

/**
 * Update inventory (from AI scan or manual)
 */
export async function updateInventory(gardenId, flowerType, quantity, options = {}) {
    const { data, error } = await supabase
        .from('inventory')
        .upsert({
            garden_id: gardenId,
            flower_type: flowerType,
            flower_name: options.flowerName || flowerType,
            quantity: quantity,
            unit_price: options.unitPrice,
            ai_confidence: options.aiConfidence || 1.0,
            ai_scan_image: options.scanImage,
            last_ai_scan: options.scanImage ? new Date().toISOString() : undefined,
            is_available: quantity > 0,
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'garden_id,flower_type'
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Get orders for a garden
 */
export async function getGardenOrders(gardenId) {
    const { data, error } = await supabase
        .from('orders')
        .select(`
      *,
      order_items(*),
      profiles:customer_id(full_name, phone)
    `)
        .eq('farmer_id', gardenId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

/**
 * Get garden stats
 */
export async function getGardenStats(gardenId) {
    const [inventoryRes, ordersRes] = await Promise.all([
        supabase
            .from('inventory')
            .select('quantity, unit_price')
            .eq('garden_id', gardenId),
        supabase
            .from('orders')
            .select('total_amount, status')
            .eq('farmer_id', gardenId)
    ]);

    const inventory = inventoryRes.data || [];
    const orders = ordersRes.data || [];

    return {
        totalFlowers: inventory.reduce((sum, i) => sum + (i.quantity || 0), 0),
        totalValue: inventory.reduce((sum, i) => sum + ((i.quantity || 0) * (i.unit_price || 0)), 0),
        totalOrders: orders.length,
        pendingOrders: orders.filter(o => o.status === 'pending').length,
        completedOrders: orders.filter(o => o.status === 'completed').length,
        totalRevenue: orders.reduce((sum, o) => sum + (o.total_amount || 0), 0)
    };
}

// ============================================================================
// REALTIME SUBSCRIPTIONS
// ============================================================================

/**
 * Subscribe to inventory changes
 */
export function subscribeToInventory(gardenId, callback) {
    return supabase
        .channel(`inventory:${gardenId}`)
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'inventory',
            filter: `garden_id=eq.${gardenId}`
        }, callback)
        .subscribe();
}

/**
 * Subscribe to new orders
 */
export function subscribeToOrders(gardenId, callback) {
    return supabase
        .channel(`orders:${gardenId}`)
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'orders',
            filter: `farmer_id=eq.${gardenId}`
        }, callback)
        .subscribe();
}
