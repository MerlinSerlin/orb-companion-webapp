'use server'

import Stripe from 'stripe';

// Initialize Stripe with your secret key
// Ensure this is configured with process.env.STRIPE_SECRET_KEY
const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // apiVersion: '2024-06-20', // Temporarily remove to resolve type issue
  typescript: true, // Enables better type checking with the Stripe SDK
});

interface CreateStripeCustomerResult {
  success: boolean;
  stripeCustomerId?: string;
  error?: string;
}

/**
 * Creates a customer in Stripe only.
 * @param email The customer's email.
 * @param name The customer's name.
 * @param metadata Optional metadata to store with the Stripe customer.
 * @returns An object indicating success or failure, and the Stripe Customer ID if successful.
 */
export async function createStripeCustomerOnly(
  email: string,
  name: string,
  metadata?: Stripe.MetadataParam
): Promise<CreateStripeCustomerResult> {
  console.log(`[Stripe Action] Creating customer in Stripe with email: ${email}, name: ${name}`);
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('[Stripe Action] STRIPE_SECRET_KEY is not set.');
    return { success: false, error: 'Stripe API key not configured on server.' };
  }

  try {
    const stripeCustomer = await stripeClient.customers.create({
      email: email,
      name: name,
      metadata: metadata, // Pass along any metadata provided
    });
    console.log(`[Stripe Action] Stripe customer created successfully with ID: ${stripeCustomer.id}`);
    return {
      success: true,
      stripeCustomerId: stripeCustomer.id,
    };
  } catch (error) {
    console.error("[Stripe Action] Error creating Stripe customer:", error);
    let errorMessage = 'Failed to create Stripe customer'; // Default message
    
    // Check if the error object looks like an error and has a message property
    if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
        errorMessage = error.message;
    } else if (typeof error === 'string') {
        // Sometimes errors might be thrown as strings
        errorMessage = error;
    } else {
        // Fallback for other types or unknown structures
        errorMessage = 'An unknown error occurred during Stripe customer creation.';
    }
    
    return {
      success: false,
      error: errorMessage,
    };
  }
} 