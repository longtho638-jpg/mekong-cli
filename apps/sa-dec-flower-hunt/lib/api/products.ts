import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';

export interface Product {
    id: string; // Changed from number to string (UUID)
    name: string;
    image: string; // derived from images[0]
    images: string[];
    description: string;
    price: number;
    basePrice: number; // alias for price for compatibility
    salesPitch: string;
    vibe: string;
    origin: string;
    sizesAvailable: string[];
    inStock: boolean;
    slug?: string;
}

// Mapper to convert DB row to Frontend Type
// This ensures we don't break the UI while migrating
const mapProduct = (row: any): Product => {
    const metadata = row.metadata || {};
    return {
        id: row.id,
        name: row.name,
        image: row.images?.[0] || '',
        images: row.images || [],
        description: row.description || '',
        salesPitch: row.description || '', // Mapping description to salesPitch
        price: Number(row.price),
        basePrice: Number(row.price),
        vibe: metadata.vibe || '',
        origin: metadata.origin || '',
        sizesAvailable: metadata.sizes || ['S', 'M', 'L'],
        inStock: row.stock_level > 0,
        slug: row.slug
    };
};

export async function getProducts() {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'active');

    if (error) {
        console.error('Error fetching products:', error);
        return [];
    }

    return data.map(mapProduct);
}

export async function getProductById(idOrName: string) {
    if (!supabase) return null;

    // Try UUID first
    let query = supabase.from('products').select('*');

    // Check if it looks like a number (legacy ID) or UUID
    // Since we seeded using name matching essentially, we might need a lookup map if we want to support legacy URLs /flower/1
    // But for the migration, we might just query by name if it's not a UUID, or fetch all and find. 
    // Wait, the seed script replaced IDs with UUIDs. The URL /flower/1 will break.
    // Mitigation: We will query by matching the 'name' or 'id' if possible, OR
    // we simply fetch all and find the one that matches the *legacy index* assumption if we can't change URLs yet.
    // ideally we move to /flower/[uuid].

    // For now, let's assume the ID passed might be a UUID.

    // If idOrName is a number-like string (e.g. "1"), we have a problem because DB uses UUIDs.
    // Solution: Fetch ALL products and find by matching name (mapped from the legacy ID list) OR
    // Just support the new UUIDs and let legacy links 404? 
    // BETTER: Use `metadata->>legacy_id`? I didn't add that column.
    // FALLBACK: Query by name for this strict migration if we can.

    // Let's try to find by ID if it's a UUID, otherwise return null.
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrName);

    if (isUuid) {
        query = query.eq('id', idOrName);
        const { data, error } = await query.single();
        if (error || !data) return null;
        return mapProduct(data);
    }

    // Legacy Support Hack: If ID is "1", "2", etc.
    // We map 1 -> "Cúc Mâm Xôi", etc. based on the known order/seed data.
    // This is temporary technical debt removal strategy.
    const legacyMap: Record<string, string> = {
        '1': 'Cúc Mâm Xôi',
        '2': 'Hoa Hồng Sa Đéc',
        '3': 'Vạn Thọ Pháp',
        '4': 'Hoa Giấy Đỏ',
        '5': 'Cát Tường',
        '6': 'Mai Vàng'
    };

    const name = legacyMap[idOrName];
    if (name) {
        const { data, error } = await supabase.from('products').select('*').eq('name', name).single();
        if (error || !data) return null;
        return mapProduct(data);
    }

    return null;
}

export async function getFeaturedProducts() {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'active')
        .limit(6);

    if (error) {
        console.error('Error fetching featured products:', error);
        return [];
    }

    return data.map(mapProduct);
}
