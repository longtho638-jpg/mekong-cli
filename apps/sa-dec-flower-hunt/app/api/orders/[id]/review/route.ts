import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize inside handler
// const supabase = createClient(...)

/**
 * Submit a review for an order
 * POST /api/orders/[id]/review
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { rating, comment, photos, buyerId } = await request.json();
        const { id: orderId } = await params;

        // Validate rating
        if (!rating || rating < 1 || rating > 5) {
            return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
        }

        // Get order details
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*, order_items(farmer_id)')
            .eq('id', orderId)
            .single();

        if (orderError || !order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Check if order is delivered/completed
        if (!['delivered', 'completed'].includes(order.status)) {
            return NextResponse.json({ error: 'Can only review completed orders' }, { status: 400 });
        }

        // Check if review already exists
        const { data: existingReview } = await supabase
            .from('reviews')
            .select('id')
            .eq('order_id', orderId)
            .single();

        if (existingReview) {
            return NextResponse.json({ error: 'Review already submitted' }, { status: 400 });
        }

        const farmerId = order.order_items?.[0]?.farmer_id;
        if (!farmerId) {
            return NextResponse.json({ error: 'No farmer found for this order' }, { status: 400 });
        }

        // Create review
        const { data: review, error: reviewError } = await supabase
            .from('reviews')
            .insert({
                order_id: orderId,
                buyer_id: buyerId,
                farmer_id: farmerId,
                rating,
                comment,
                photos: photos || [],
            })
            .select()
            .single();

        if (reviewError) {
            console.error('Failed to create review:', reviewError);
            return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
        }

        // Update order status to completed (if not already)
        if (order.status === 'delivered') {
            await supabase
                .from('orders')
                .update({ status: 'completed' })
                .eq('id', orderId);
        }

        return NextResponse.json({
            success: true,
            review,
        });

    } catch (error: any) {
        console.error('Review submission error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * Get review for an order
 * GET /api/orders/[id]/review
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { id: orderId } = await params;

        const { data: review, error } = await supabase
            .from('reviews')
            .select('*, profiles!reviews_buyer_id_fkey(name, email)')
            .eq('order_id', orderId)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
            console.error('Failed to fetch review:', error);
            return NextResponse.json({ error: 'Failed to fetch review' }, { status: 500 });
        }

        return NextResponse.json({ review: review || null });

    } catch (error: any) {
        console.error('Review fetch error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
