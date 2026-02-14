import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export async function POST(request: NextRequest) {
    try {
        const { phone, flowerId, flowerName } = await request.json();

        // Validate phone
        if (!phone || !/^0[0-9]{9}$/.test(phone)) {
            return NextResponse.json(
                { error: "Invalid phone number" },
                { status: 400 }
            );
        }

        // If Supabase is not configured, return success (demo mode)
        if (!isSupabaseConfigured) {
            console.log("[DEMO MODE] Lead captured:", { phone, flowerId, flowerName });
            return NextResponse.json({
                success: true,
                message: "Lead captured (demo mode)",
                demo: true
            });
        }

        // Real Supabase flow
        const client = supabase as any; // Type assertion for flexibility

        // Check if user exists, or create new one
        const { data: existingUser } = await client
            .from("users")
            .select("id")
            .eq("phone", phone)
            .single();

        let userId: string;

        if (!existingUser) {
            const { data: newUser, error: createError } = await client
                .from("users")
                .insert({ phone })
                .select("id")
                .single();

            if (createError) {
                console.error("Error creating user:", createError);
                return NextResponse.json(
                    { error: "Failed to create user" },
                    { status: 500 }
                );
            }
            userId = newUser.id;
        } else {
            userId = existingUser.id;
        }

        // Add to wishlist
        await client
            .from("wishlist")
            .insert({
                user_id: userId,
                flower_id: flowerId,
                flower_name: flowerName,
            });

        return NextResponse.json({
            success: true,
            message: "Lead captured successfully"
        });

    } catch (error) {
        console.error("Lead capture error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
