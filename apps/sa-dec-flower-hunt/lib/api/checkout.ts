import { supabase } from "@/lib/supabase";
import { CartItem } from "@/lib/cartStore";

export async function processCheckout(items: CartItem[], total: number) {
    if (!supabase) throw new Error("Supabase not configured");
    // 1. Get current user (or guest)
    const { data: { user } } = await supabase.auth.getUser();

    // 2. Prepare items for RPC
    // RPC expects JSONB array: [{ product_id, quantity, price }]
    const orderItems = items.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        price: item.price
    }));

    // 3. Call RPC
    const { data, error } = await supabase.rpc('create_order', {
        p_user_id: user?.id || null, // Allow guest checkout (id will be null)
        p_total_amount: total,
        p_items: orderItems,
        p_shipping_address: {
            // Mock address for 1-click buy. In real app, pass from form.
            full_name: user?.user_metadata?.full_name || 'Khách lẻ',
            phone: '0909xxxxxx',
            address: 'Sa Đéc, Đồng Tháp'
        }
    });

    if (error) {
        console.error("Checkout Error:", error);
        throw new Error(error.message);
    }

    return data; // Returns order_uuid
}
