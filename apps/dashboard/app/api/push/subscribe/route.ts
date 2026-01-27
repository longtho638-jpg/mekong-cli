import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const subscription = await request.json();

    // In a real application, you would save this subscription to your database
    // associated with the current user.
    // Example: await db.subscriptions.create({ data: subscription, userId: currentUser.id })

    console.log('Received push subscription:', subscription);

    return NextResponse.json({ success: true, message: 'Subscription saved' });
  } catch (error) {
    console.error('Error saving subscription:', error);
    return NextResponse.json({ success: false, error: 'Failed to save subscription' }, { status: 500 });
  }
}
