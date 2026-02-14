import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize inside handler
// const supabase = createClient(...)

/**
 * Get all gardens and landmarks for map
 * GET /api/map/locations
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Get all verified gardens with farmer info
        const { data: gardens, error: gardensError } = await supabase
            .from('farmer_gardens')
            .select(`
        *,
        profiles:farmer_id (name, email)
      `)
            .eq('verified', true)
            .order('name');

        // Get all landmarks
        const { data: landmarks, error: landmarksError } = await supabase
            .from('landmarks')
            .select('*')
            .order('name');

        if (gardensError) {
            console.error('Gardens error:', gardensError);
            // Return empty array if table doesn't exist yet
            return NextResponse.json({
                gardens: [],
                landmarks: landmarks || []
            });
        }

        if (landmarksError) {
            console.error('Landmarks error:', landmarksError);
            return NextResponse.json({
                gardens: gardens || [],
                landmarks: []
            });
        }

        // Transform gardens to include farmer name and Hunter Guide AI Logic (Crowd Balancing)
        const transformedGardens = gardens?.map(g => {
            // 🧠 HUNTER GUIDE AI LOGIC:
            // Simulate load balancing: 
            // - 20% of gardens are "HOT" (High Density, Low Loot)
            // - 80% are "COLD" (Low Density, High Loot to attract users)

            const isHotSpot = Math.random() > 0.8;
            const crowdDensity = isHotSpot
                ? 0.8 + (Math.random() * 0.2) // 0.8 - 1.0 (Crowded)
                : 0.1 + (Math.random() * 0.3); // 0.1 - 0.4 (Empty)

            const lootMultiplier = isHotSpot
                ? 1.0 // Normal loot
                : 2.0 + (Math.random() * 3.0); // 2x - 5x Loot (Incentive)

            return {
                ...g,
                farmer_name: g.profiles?.name,
                ai_metrics: {
                    crowd_density: Number(crowdDensity.toFixed(2)), // 0.0 - 1.0
                    loot_multiplier: Number(lootMultiplier.toFixed(1)), // 1.0x - 5.0x
                    status: isHotSpot ? 'overloaded' : 'optimized'
                }
            };
        }) || [];

        return NextResponse.json({
            gardens: transformedGardens,
            landmarks: landmarks || [],
            meta: {
                ai_agent: "Hunter Guide v2.0",
                strategy: "Crowd Load Balancing",
                timestamp: new Date().toISOString()
            }
        });

    } catch (error: any) {
        console.error('Map locations error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export const dynamic = 'force-dynamic';
