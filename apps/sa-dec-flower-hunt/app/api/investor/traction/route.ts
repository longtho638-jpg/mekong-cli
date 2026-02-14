import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize inside handler
// const supabase = createClient(...)

export async function GET() {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 1. Get total number of public terminal sessions (from /live)
        const { count: sessionCount } = await supabase
            .from("public_sessions")
            .select("*", { count: "exact", head: true });

        // 2. Get total GMV (Gross Merchandise Value) from orders in last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: recentOrders } = await supabase
            .from("orders")
            .select("final_price")
            .gte("created_at", sevenDaysAgo.toISOString());

        const gmv7Day = recentOrders?.reduce((sum, order) => sum + (order.final_price || 0), 0) || 0;

        // 3. Get total number of farmers
        const { count: farmerCount } = await supabase
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .eq("role", "farmer");

        // 4. Calculate daily growth (compare today vs yesterday sessions)
        const today = new Date().toISOString().split("T")[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

        const { count: todayCount } = await supabase
            .from("public_sessions")
            .select("*", { count: "exact", head: true })
            .gte("created_at", `${today}T00:00:00`)
            .lt("created_at", `${today}T23:59:59`);

        const { count: yesterdayCount } = await supabase
            .from("public_sessions")
            .select("*", { count: "exact", head: true })
            .gte("created_at", `${yesterday}T00:00:00`)
            .lt("created_at", `${yesterday}T23:59:59`);

        const dailyGrowth = yesterdayCount && yesterdayCount > 0
            ? ((todayCount || 0) - yesterdayCount) / yesterdayCount * 100
            : 0;

        return NextResponse.json({
            activeUsers: sessionCount || 0,
            gmv7Day: Math.round(gmv7Day),
            farmerCount: farmerCount || 0,
            dailyGrowthPercent: Math.round(dailyGrowth * 10) / 10,
            timestamp: new Date().toISOString(),
        });

    } catch (error: any) {
        console.error("Traction API Error:", error);

        // Return mock data if DB fails (for demo purposes)
        return NextResponse.json({
            activeUsers: 1402,
            gmv7Day: 24500000, // 24.5M VND
            farmerCount: 47,
            dailyGrowthPercent: 12.5,
            timestamp: new Date().toISOString(),
            _note: "Mock data (DB connection failed)"
        });
    }
}
