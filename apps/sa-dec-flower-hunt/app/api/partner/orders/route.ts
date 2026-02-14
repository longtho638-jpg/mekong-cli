import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

// GET: Fetch orders for a partner (by phone)
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);

    // Security Check: Verify Auth Token
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];

    if (!token && isSupabaseConfigured) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (token) {
        if (!supabase) {
            return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
        }

        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    }

    const phone = searchParams.get("phone");

    if (!phone) {
        return NextResponse.json({ error: "Phone required" }, { status: 400 });
    }

    if (!isSupabaseConfigured) {
        // Demo mode: return mock orders
        return NextResponse.json({
            orders: [
                {
                    id: "demo-1",
                    flower_name: "Cúc Mâm Xôi",
                    size: "M",
                    quantity: 2,
                    price: 450000,
                    status: "pending",
                    customer_name: "Nguyễn Văn A",
                    customer_phone: "0901234567",
                    address: "123 Nguyễn Huệ, Q1, TP.HCM",
                    notes: "Giao trước 5h chiều",
                    created_at: new Date().toISOString()
                },
                {
                    id: "demo-2",
                    flower_name: "Hoa Hồng Sa Đéc",
                    size: "L",
                    quantity: 1,
                    price: 240000,
                    status: "confirmed",
                    customer_name: "Trần Thị B",
                    customer_phone: "0909876543",
                    address: "456 Lê Lợi, Q3, TP.HCM",
                    notes: "",
                    created_at: new Date(Date.now() - 3600000).toISOString()
                }
            ],
            demo: true
        });
    }

    const client = supabase as any;

    // For now, fetch all orders (in production, filter by garden_id)
    const { data: orders, error } = await client
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Fetch orders error:", error);
        return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
    }

    return NextResponse.json({ orders });
}

// PATCH: Update order status
export async function PATCH(request: NextRequest) {
    try {
        const { orderId, status } = await request.json();

        if (!orderId || !status) {
            return NextResponse.json({ error: "Missing orderId or status" }, { status: 400 });
        }

        const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        if (!isSupabaseConfigured) {
            console.log("[DEMO] Order status updated:", { orderId, status });
            return NextResponse.json({ success: true, demo: true });
        }

        const client = supabase as any;

        const { error } = await client
            .from("orders")
            .update({ status, updated_at: new Date().toISOString() })
            .eq("id", orderId);

        if (error) {
            console.error("Update order error:", error);
            return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("PATCH error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
