// ============================================================================
// USE GARDEN REALTIME HOOK
// ============================================================================
// Subscribes to Garden OS updates and spawns loot boxes in Hunter Guide
// ============================================================================

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// Types
interface Garden {
    id: string;
    name: string;
    owner_name: string;
    coordinates: { type: string; coordinates: [number, number] } | null;
    status: 'OPEN' | 'FULL' | 'CLOSED' | 'VACATION';
    specialties: string[];
    rating: number;
}

interface InventoryItem {
    id: string;
    garden_id: string;
    flower_type: string;
    flower_name: string;
    quantity: number;
    unit_price: number;
    is_available: boolean;
    updated_at: string;
}

interface LootBox {
    id: string;
    garden_id: string;
    rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
    reward_type: 'VOUCHER' | 'MISSION' | 'BADGE' | 'POINTS' | 'FREE_FLOWER';
    reward_value: string;
    is_claimed: boolean;
    spawned_at: string;
    expires_at: string;
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useGardenRealtime() {
    const [gardens, setGardens] = useState<Garden[]>([]);
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [lootBoxes, setLootBoxes] = useState<LootBox[]>([]);
    const [loading, setLoading] = useState(true);
    const [connected, setConnected] = useState(false);

    // Fetch initial data
    const fetchData = useCallback(async () => {
        if (!supabase) return;

        try {
            const [gardensRes, inventoryRes, lootBoxesRes] = await Promise.all([
                supabase.from('gardens').select('*').eq('status', 'OPEN'),
                supabase.from('inventory').select('*').eq('is_available', true),
                supabase.from('loot_boxes').select('*').eq('is_active', true).eq('is_claimed', false)
            ]);

            if (gardensRes.data) setGardens(gardensRes.data);
            if (inventoryRes.data) setInventory(inventoryRes.data);
            if (lootBoxesRes.data) setLootBoxes(lootBoxesRes.data);
        } catch (error) {
            console.error('Error fetching garden data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Handle inventory update (from Garden OS)
    const handleInventoryChange = useCallback((payload: {
        eventType: string;
        new: InventoryItem;
        old: InventoryItem
    }) => {
        console.log('🌸 Inventory updated:', payload);

        if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const newItem = payload.new;

            // Update local state
            setInventory(prev => {
                const exists = prev.find(i => i.id === newItem.id);
                if (exists) {
                    return prev.map(i => i.id === newItem.id ? newItem : i);
                }
                return [...prev, newItem];
            });

            // Find garden name
            const garden = gardens.find(g => g.id === newItem.garden_id);
            const gardenName = garden?.name || 'Vườn gần bạn';

            // Show notification based on quantity
            if (newItem.quantity >= 100) {
                toast.success(`🌟 RARE LOOT! ${gardenName} vừa cập nhật ${newItem.quantity} chậu ${newItem.flower_name}!`, {
                    duration: 8000,
                    action: {
                        label: 'Xem ngay',
                        onClick: () => window.location.href = `/shop?garden=${newItem.garden_id}`
                    }
                });
            } else if (newItem.quantity >= 50) {
                toast(`🌸 ${gardenName} vừa cập nhật kho hoa mới!`, {
                    duration: 5000
                });
            }
        }
    }, [gardens]);

    // Handle loot box spawn
    const handleLootBoxChange = useCallback((payload: {
        eventType: string;
        new: LootBox;
    }) => {
        console.log('🎁 Loot box event:', payload);

        if (payload.eventType === 'INSERT') {
            const newLoot = payload.new;

            setLootBoxes(prev => [...prev, newLoot]);

            // Epic notification for rare+ loot
            if (newLoot.rarity === 'RARE' || newLoot.rarity === 'EPIC' || newLoot.rarity === 'LEGENDARY') {
                toast.success(
                    `🎁 ${newLoot.rarity === 'LEGENDARY' ? '💎 LEGENDARY' : '⭐ RARE'} LOOT BOX xuất hiện! ${newLoot.reward_value}`,
                    {
                        duration: 10000,
                        action: {
                            label: 'Săn ngay!',
                            onClick: () => window.location.href = `/hunt?loot=${newLoot.id}`
                        }
                    }
                );
            }
        }

        if (payload.eventType === 'UPDATE' && payload.new.is_claimed) {
            // Remove claimed loot box
            setLootBoxes(prev => prev.filter(l => l.id !== payload.new.id));
        }
    }, []);

    // Subscribe to realtime
    useEffect(() => {
        if (!supabase) {
            setLoading(false);
            return;
        }

        // Fetch initial data
        fetchData();

        // Subscribe to channels
        const inventoryChannel = supabase
            .channel('public:inventory')
            .on('postgres_changes' as any, {
                event: '*',
                schema: 'public',
                table: 'inventory'
            }, handleInventoryChange as any)
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    setConnected(true);
                    console.log('✅ Connected to inventory realtime');
                }
            });

        const lootBoxChannel = supabase
            .channel('public:loot_boxes')
            .on('postgres_changes' as any, {
                event: '*',
                schema: 'public',
                table: 'loot_boxes'
            }, handleLootBoxChange as any)
            .subscribe();

        const gardensChannel = supabase
            .channel('public:gardens')
            .on('postgres_changes' as any, {
                event: '*',
                schema: 'public',
                table: 'gardens'
            }, () => {
                // Refresh gardens on change
                fetchData();
            })
            .subscribe();

        // Cleanup
        return () => {
            supabase?.removeChannel(inventoryChannel);
            supabase?.removeChannel(lootBoxChannel);
            supabase?.removeChannel(gardensChannel);
            setConnected(false);
        };
    }, [fetchData, handleInventoryChange, handleLootBoxChange]);

    // Claim loot box
    const claimLootBox = useCallback(async (lootBoxId: string, userId: string) => {
        if (!supabase) return null;

        try {
            const { data, error } = await supabase
                .from('loot_boxes')
                .update({
                    is_claimed: true,
                    claimed_by: userId,
                    claimed_at: new Date().toISOString()
                })
                .eq('id', lootBoxId)
                .eq('is_claimed', false) // Prevent double claim
                .select()
                .single();

            if (error) throw error;

            if (data) {
                toast.success(`🎉 Bạn đã nhận được: ${(data as any).reward_value}!`);
                setLootBoxes(prev => prev.filter(l => l.id !== lootBoxId));
            }

            return data;
        } catch (error) {
            console.error('Error claiming loot box:', error);
            toast.error('Lỗi nhận quà, vui lòng thử lại');
            return null;
        }
    }, []);

    // Get gardens with high inventory (for map markers)
    const hotGardens = gardens.filter(garden => {
        const gardenInventory = inventory.filter(i => i.garden_id === garden.id);
        const totalFlowers = gardenInventory.reduce((sum, i) => sum + (i.quantity || 0), 0);
        return totalFlowers >= 50;
    });

    return {
        // Data
        gardens,
        inventory,
        lootBoxes,
        hotGardens,

        // State
        loading,
        connected,

        // Actions
        claimLootBox,
        refetch: fetchData
    };
}

// ============================================================================
// HELPER HOOKS
// ============================================================================

/**
 * Get inventory for a specific garden
 */
export function useGardenInventory(gardenId: string | null) {
    const { inventory, loading } = useGardenRealtime();

    const gardenInventory = gardenId
        ? inventory.filter(i => i.garden_id === gardenId)
        : [];

    const totalFlowers = gardenInventory.reduce((sum, i) => sum + (i.quantity || 0), 0);
    const totalValue = gardenInventory.reduce((sum, i) => sum + ((i.quantity || 0) * (i.unit_price || 0)), 0);

    return {
        items: gardenInventory,
        totalFlowers,
        totalValue,
        loading
    };
}

/**
 * Get nearby loot boxes (for AR/Map)
 */
export function useNearbyLootBoxes(userLat: number, userLng: number, radiusKm: number = 5) {
    const { lootBoxes, loading } = useGardenRealtime();

    // Filter by distance (simple haversine approximation)
    const nearby = lootBoxes.filter(loot => {
        // For now, return all since we don't have coordinates yet
        return true;
    });

    return {
        lootBoxes: nearby,
        loading
    };
}
