
import dotenv from 'dotenv';
import PayOS from '@payos/node';

// Load env from anima119
dotenv.config({ path: 'apps/anima119/.env.local' });

async function verifyPayOS() {
  console.log('--- Verifying PayOS Configuration ---');
  const clientId = process.env.PAYOS_CLIENT_ID;
  const apiKey = process.env.PAYOS_API_KEY;
  const checksumKey = process.env.PAYOS_CHECKSUM_KEY;

  if (!clientId || !apiKey || !checksumKey) {
    console.error('❌ Missing PayOS Keys in .env.local');
    process.exit(1);
  }

  console.log(`Client ID: ${clientId.substring(0, 8)}...`);
  
  try {
    const payOS = new PayOS(clientId, apiKey, checksumKey);
    
    const orderCode = Number(String(Date.now()).slice(-6));
    const body = {
      orderCode,
      amount: 10000,
      description: 'Test Payment',
      cancelUrl: 'http://localhost:3000/cancel',
      returnUrl: 'http://localhost:3000/success',
    };

    console.log('Attempting to create payment link...');
    const paymentLink = await payOS.createPaymentLink(body);
    
    console.log('✅ Payment Link Created Successfully!');
    console.log('Checkout URL:', paymentLink.checkoutUrl);
  } catch (error: any) {
    console.error('❌ PayOS Verify Failed:', error.message || error);
    process.exit(1);
  }
}

verifyPayOS();
