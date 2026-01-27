export async function getPaymentStatus(paymentId: string) {
  const response = await fetch(`/api/v1/payments/status?payment_id=${paymentId}`)
  return response.json()
}

export async function capturePayPalOrder(orderId: string) {
  const response = await fetch('/api/v1/payments/paypal/capture-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ order_id: orderId })
  })
  return response.json()
}
