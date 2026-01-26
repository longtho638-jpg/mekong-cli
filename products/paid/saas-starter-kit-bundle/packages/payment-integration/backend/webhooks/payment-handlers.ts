import Stripe from 'stripe';

export async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  // Logic to handle successful payment
  console.log(`💰 Payment succeeded: ${paymentIntent.id} for amount ${paymentIntent.amount}`);

  // TODO: Update your database status to 'paid'
  // e.g., await db.orders.update({ where: { paymentIntentId: paymentIntent.id }, data: { status: 'paid' } });
}

export async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  // Logic to handle failed payment
  console.log(`❌ Payment failed: ${paymentIntent.id}`);

  // TODO: Notify user or update database status
}
