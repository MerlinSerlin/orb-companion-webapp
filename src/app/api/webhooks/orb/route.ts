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
  // Using X-Orb-Signature as per the Flask example
  const signatureFromHeader = req.headers.get('X-Orb-Signature'); 
  const timestamp = req.headers.get('X-Orb-Timestamp');

  if (!signatureFromHeader || !timestamp) {
    console.log('Signature or timestamp missing. Header Signature:', signatureFromHeader, 'Timestamp:', timestamp);
    return NextResponse.json({ error: 'Missing Orb signature or timestamp' }, { status: 400 });
  }

  // Construct the signed payload according to the Flask example
  const signedPayloadConstruction = `v1:${timestamp}:${rawBody}`;
  
  const hmac = crypto.createHmac('sha256', ORB_WEBHOOK_SECRET);
  hmac.update(signedPayloadConstruction, 'utf-8');
  const digest = hmac.digest('hex');
  // Add v1= prefix to our generated signature for comparison
  const expectedSignature = `v1=${digest}`;

  console.log(`Received Signature: ${signatureFromHeader}`);
  console.log(`Expected Signature: ${expectedSignature}`);
  console.log(`Timestamp: ${timestamp}`);
  console.log(`Signed Payload Construction: v1:${timestamp}:<BODY_CONTENT>`);

  // Note: crypto.timingSafeEqual requires buffers of the same length.
  // It's good practice, but ensure both strings are always similar in structure.
  try {
    if (!crypto.timingSafeEqual(Buffer.from(signatureFromHeader), Buffer.from(expectedSignature))) {
      console.warn('Invalid Orb webhook signature (timingSafeEqual failed).');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }
  } catch (e) {
      console.error('Error during timingSafeEqual comparison (likely buffer length mismatch):', e);
      // Fallback to direct comparison if timingSafeEqual throws (e.g. due to length mismatch before actual content check)
      if (signatureFromHeader !== expectedSignature) {
        console.warn('Invalid Orb webhook signature (direct comparison failed).');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
      }
  }
  
  console.log('Orb webhook signature verified successfully.');

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