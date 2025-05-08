import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// This should be securely stored in your environment variables
const ORB_WEBHOOK_SECRET = process.env.ORB_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  if (!ORB_WEBHOOK_SECRET) {
    console.error('Orb webhook secret is not configured.');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  // Log all headers for debugging
  console.log('Orb Webhook Handler at /api/webhooks/orb - Received headers:');
  req.headers.forEach((value, key) => {
    console.log(`${key}: ${value}`);
  });

  const rawBody = await req.text();
  const signature = req.headers.get('X-Orb-Signature-V1');
  const timestamp = req.headers.get('X-Orb-Timestamp');

  if (!signature || !timestamp) {
    console.log('Signature or timestamp missing. Signature:', signature, 'Timestamp:', timestamp);
    return NextResponse.json({ error: 'Missing Orb signature or timestamp' }, { status: 400 });
  }

  // Verify the signature
  const signedPayload = `${timestamp}.${rawBody}`;
  const expectedSignature = crypto
    .createHmac('sha256', ORB_WEBHOOK_SECRET)
    .update(signedPayload)
    .digest('hex');

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    console.warn('Invalid Orb webhook signature.');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
  }

  // Signature is valid, parse the JSON body
  let event;
  try {
    event = JSON.parse(rawBody);
  } catch (err) {
    console.error('Error parsing webhook payload:', err);
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  // Process the event
  // For now, we'll just log it. In a real application, you'd handle different event types.
  console.log('Received Orb Webhook Event:', JSON.stringify(event, null, 2));
  
  // Example: Switch based on event type
  // switch (event.event_type) {
  //   case 'customer.created':
  //     // Handle customer created event
  //     break;
  //   case 'subscription.created':
  //     // Handle subscription created event
  //     break;
  //   // Add more cases for other event types you want to handle
  //   default:
  //     console.log(`Unhandled event type: ${event.event_type}`);
  // }

  // Acknowledge receipt of the event
  return NextResponse.json({ received: true });
} 