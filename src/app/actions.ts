"use server"

import { orbClient } from "@/lib/orb"
import type { 
  GetSubscriptionsResult, 
  Subscription, 
  GetCustomerDetailsResult, 
  FixedFeeQuantityTransition, 
  Price,
  PackageConfig,
  TieredConfig,
  UnitConfig 
} from "@/lib/types";

export async function createCustomer(name: string, email: string) {
  try {
    console.log(`Creating customer with name: ${name}, email: ${email}`)

    const formattedExternalId = name.trim().replace(/\s+/g, '_')

    const customer = await orbClient.customers.create({
      email,
      name,
      external_customer_id: formattedExternalId,
    })

    console.log(`Customer created successfully with ID: ${customer.id}`)

    return {
      success: true,
      customerId: customer.id,
      externalCustomerId: customer.external_customer_id,
    }
  } catch (error) {
    console.error("Error creating customer:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to create customer`,
    }
  }
}

export async function createSubscription(customerId: string, planId: string) {
  try {
    console.log(`Subscribing customer ${customerId} to plan ${planId}`)

    const subscription = await orbClient.subscriptions.create({
      customer_id: customerId,
      plan_id: planId,
    })
    
    console.log(`Subscription created successfully with ID: ${subscription.id}`)

    return {
      success: true,
      subscription: {
        id: subscription.id,
        plan_id: planId,
        status: subscription.status,
      },
    }
  } catch (error) {
    console.error("Error subscribing customer to plan:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create subscription",
    }
  }
}

export async function getCustomerSubscriptions(customerId: string): Promise<GetSubscriptionsResult> {
  try {
    const orbResponse = await orbClient.subscriptions.list({
      customer_id: [customerId],
    });

    const externalCustomerId = orbResponse.data?.[0]?.customer?.external_customer_id;

    if (!orbResponse.data || orbResponse.data.length === 0) {
      return {
        success: true,
        externalCustomerId: externalCustomerId, 
        subscriptions: [], 
      };
    }

    // Re-adding any type temporarily as SDK type is unknown
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subscriptionsData: Subscription[] = orbResponse.data.map((sdkSub: any) => { 
      const mappedSub = {
        id: sdkSub.id,
        name: sdkSub.name,
        currency: sdkSub.currency,
        status: sdkSub.status,
        start_date: sdkSub.start_date,
        end_date: sdkSub.end_date,
        current_period_start: sdkSub.current_billing_period_start_date, 
        current_period_end: sdkSub.current_billing_period_end_date, 
        plan: sdkSub.plan, 
        price_intervals: sdkSub.price_intervals, 
      };
      return mappedSub;
    });

    return {
      success: true,
      externalCustomerId: externalCustomerId,
      subscriptions: subscriptionsData,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch subscriptions';
    return {
      success: false,
      error: errorMessage,
      subscriptions: null
    }
  }
}

// export async function getSubscriptionUsage(subscriptionId: string) {
//   try {
//     const usage = await orbClient.subscriptions.fetchUsage(subscriptionId)

//     return {
//       success: true,
//       usage: usage.data,
//     }
//   } catch (error) {
//     console.error('Error fetching usage:', error)
//     return {
//       success: false,
//       error: error instanceof Error ? error.message : 'Failed to fetch usage',
//     }
//   }
// }

// export async function getAvailablePlans() {
//   try {
//     const plans = await orbClient.plans.list()
    
//     return {
//       success: true,
//       plans: plans.data.map(plan => ({
//         id: plan.id,
//         name: plan.name,
//         description: plan.description || '',
//         prices: plan.prices,
//         minimum_amount: plan.minimum_amount,
//         currency: plan.currency,
//       })),
//     }
//   } catch (error) {
//     console.error('Error fetching plans:', error)
//     return {
//       success: false,
//       error: error instanceof Error ? error.message : 'Failed to fetch plans',
//     }
//   }
// }

// export async function getPlanDetails(planId: string) {
//   try {
//     const plan = await orbClient.plans.fetch(planId)
    
//     return {
//       success: true,
//       plan: {
//         id: plan.id,
//         name: plan.name,
//         description: plan.description || '',
//         prices: plan.prices,
//         minimum_amount: plan.minimum_amount,
//         currency: plan.currency,
//       },
//     }
//   } catch (error) {
//     console.error('Error fetching plan details:', error)
//     return {
//       success: false,
//       error: error instanceof Error ? error.message : 'Failed to fetch plan details',
//     }
//   }
// }

// export async function cancelSubscription(subscriptionId: string) {
//   try {
//     const subscription = await orbClient.subscriptions.cancel(subscriptionId, {
//       cancel_option: 'end_of_subscription_term'
//     })
    
//     revalidatePath('/')

//     return {
//       success: true,
//       subscription: {
//         id: subscription.id,
//         status: subscription.status,
//       },
//     }
//   } catch (error) {
//     console.error('Error canceling subscription:', error)
//     return {
//       success: false,
//       error: error instanceof Error ? error.message : 'Failed to cancel subscription',
//     }
//   }
// }

// export async function getSubscriptionCosts(subscriptionId: string) {
//   try {
//     const costs = await orbClient.subscriptions.fetchCosts(subscriptionId)
//     return {
//       success: true,
//       costs: costs.data,
//     }
//   } catch (error) {
//     console.error('Error fetching subscription costs:', error)
//     return {
//       success: false,
//       error: error instanceof Error ? error.message : 'Failed to fetch subscription costs',
//     }
//   }
// }

// export async function createPriceSimulation(customerId: string, planId: string) {
//   try {
//     const simulation = await orbClient.prices.evaluate(
//       planId,
//       {
//         customer_id: customerId,
//         timeframe_end: new Date().toISOString(),
//         timeframe_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Last 30 days
//       }
//     )
//     return {
//       success: true,
//       simulation,
//     }
//   } catch (error) {
//     console.error('Error creating price simulation:', error)
//     return {
//       success: false,
//       error: error instanceof Error ? error.message : 'Failed to create price simulation',
//     }
//   }
// }

// --- NEW SERVER ACTION --- 
export async function getCustomerDetails(customerId: string): Promise<GetCustomerDetailsResult> {
  try {
    console.log(`Fetching details for customer ${customerId}`);
    
    const customer = await orbClient.customers.fetch(customerId);

    if (!customer) {
      throw new Error('Customer not found');
    }
    
    return {
      success: true,
      customer: {
        id: customer.id,
        external_customer_id: customer.external_customer_id,
        name: customer.name,
        email: customer.email,
        portal_url: customer.portal_url,
      },
    };
  } catch (error) {
    console.error('Error fetching customer details:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch customer details';
    // Distinguish between not found and other errors if possible
    const isNotFoundError = errorMessage.toLowerCase().includes('not found'); // Basic check
    
    return {
      success: false,
      // Return null for customer on error
      customer: null, 
      // Optionally provide more specific error, or just the message
      error: isNotFoundError ? 'Customer not found' : errorMessage, 
    };
  }
}

/**
 * Updates the quantity of a fixed-fee add-on (price interval) for a subscription.
 * Uses Orb's Add/Edit Price Intervals endpoint.
 */
export async function editPriceIntervalQuantity(
  subscriptionId: string,
  priceIntervalId: string,
  transitions: FixedFeeQuantityTransition[] 
): Promise<{ success: boolean; error?: string }> {
  console.log(`[Action] Editing price interval quantity for sub: ${subscriptionId}, interval: ${priceIntervalId}`);
  console.log("[Action] Received Transitions:", transitions);
  
  // Retrieve API Key from environment variables
  const apiKey = process.env.ORB_API_KEY;
  if (!apiKey) {
    console.error('[Action] Orb API key is not configured.');
    return { success: false, error: 'Server configuration error.' };
  }
  if (!subscriptionId || !priceIntervalId || !transitions || transitions.length === 0) {
     return { success: false, error: 'Missing required parameters for editing price interval quantity.' };
  }

  // Construct the API endpoint URL
  const orbApiUrl = `https://api.withorb.com/v1/subscriptions/${subscriptionId}/price_intervals`;

  const payload = {
    edit: [
      {
        price_interval_id: priceIntervalId,
        fixed_fee_quantity_transitions: transitions, 
      },
    ],
  };
  
  console.log("[Action] Sending Payload:", JSON.stringify(payload, null, 2));
  console.log("[Action] Target URL:", orbApiUrl);

  try {
    // Use fetch to call the Orb API endpoint directly
    const response = await fetch(orbApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      // Attempt to parse the error body for more details
      let errorBody;
      try {
        errorBody = await response.json();
      } catch (parseError) {
        // If parsing fails, use the status text
        console.error('[Action] Failed to parse error response body:', parseError);
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      
      console.error('[Action] Failed to edit Orb price interval:', JSON.stringify(errorBody, null, 2));
      
      // Extract a meaningful error message
      const errorMessage = errorBody?.validation_errors?.join('; ') 
                         || errorBody?.title 
                         || `API Error: ${response.status} ${response.statusText}`;
      throw new Error(errorMessage); // Throw the error to be caught below
    }

    // If response is OK
    console.log(`[Action] Successfully edited price interval quantity for interval: ${priceIntervalId}`);
    
    // Consider revalidation here if needed
    // revalidatePath(`/customer/${customerId}`); 

    return { success: true };

  } catch (error) {
    // Catch errors from fetch itself or errors thrown from !response.ok block
    console.error("[Action] Error during price interval edit process:", error);
    
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";

    return { 
      success: false, 
      error: errorMessage
    };
  }
}

// Action to add a new price interval (e.g., an add-on) to a subscription
export async function addPriceInterval(
  subscriptionId: string,
  priceId: string,
  startDate?: string | null 
): Promise<{ success: boolean; error?: string }> {
  console.log(`[Action] Adding price ${priceId} to subscription ${subscriptionId}`);

  const apiKey = process.env.ORB_API_KEY;
  if (!apiKey) {
    console.error('[Action] Orb API key is not configured.');
    return { success: false, error: 'Server configuration error.' };
  }
  if (!subscriptionId || !priceId) {
    return { success: false, error: 'Missing required parameters for adding price interval.' };
  }

  const orbApiUrl = `https://api.withorb.com/v1/subscriptions/${subscriptionId}/price_intervals`;

  let effectiveStartDate: string;
  if (startDate) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
          console.error(`[Action] Invalid startDate format received: ${startDate}`);
          return { success: false, error: 'Invalid start date format. Use YYYY-MM-DD.' };
      }
      effectiveStartDate = startDate;
      console.log(`[Action] Using provided start date: ${effectiveStartDate}`);
  } else {
      const today = new Date();
      const year = today.getUTCFullYear();
      const month = (today.getUTCMonth() + 1).toString().padStart(2, '0');
      const day = today.getUTCDate().toString().padStart(2, '0');
      effectiveStartDate = `${year}-${month}-${day}`;
      console.log(`[Action] Defaulting to today's date: ${effectiveStartDate}`);
  }

  const payload = {
    add: [
      {
        price_id: priceId,
        start_date: effectiveStartDate,
      },
    ],
  };

  console.log("[Action] Sending Payload for ADD:", JSON.stringify(payload, null, 2));
  console.log("[Action] Target URL:", orbApiUrl);

  try {
    const response = await fetch(orbApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let errorBody;
      try {
        errorBody = await response.json();
      } catch (parseError) {
        console.error('[Action] Failed to parse error response body:', parseError);
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      console.error('[Action] Failed to add Orb price interval:', JSON.stringify(errorBody, null, 2));
      const errorMessage = errorBody?.validation_errors?.join('; ') 
                         || errorBody?.title 
                         || `API Error: ${response.status} ${response.statusText}`;
      throw new Error(errorMessage);
    }

    console.log(`[Action] Successfully added price ${priceId} to subscription ${subscriptionId} starting ${effectiveStartDate}`);
    // Consider revalidation here
    // revalidatePath(`/customer/${customerId}`); 

    return { success: true };

  } catch (error) {
    console.error("[Action] Error during price interval add process:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return { success: false, error: errorMessage };
  }
}

// Fetches details for a specific Price object from Orb
export async function getPriceDetails(
  priceId: string
): Promise<{ success: boolean; price?: Price | null; error?: string }> {
  console.log(`[Action] Fetching details for price ${priceId}`);

  const apiKey = process.env.ORB_API_KEY;
  if (!apiKey) {
    console.error('[Action] Orb API key is not configured.');
    return { success: false, error: 'Server configuration error.' };
  }
  if (!priceId) {
    return { success: false, error: 'Missing price ID.' };
  }

  try {
    // Fetch the price - the SDK might return a specific type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fetchedPrice: any = await orbClient.prices.fetch(priceId);

    if (!fetchedPrice) {
      throw new Error('Price not found');
    }

    console.log(`[Action] Successfully fetched price details for ${priceId}`);
    
    // Explicitly map the fetched fields to our comprehensive Price type
    const mappedPrice: Price = {
      id: fetchedPrice.id,
      name: fetchedPrice.name,
      price_type: fetchedPrice.price_type,
      model_type: fetchedPrice.model_type,
      currency: fetchedPrice.currency,
      item: fetchedPrice.item, // Assuming item structure is compatible
      fixed_price_quantity: fetchedPrice.fixed_price_quantity,
      // Include optional config fields, relying on optional chaining or checks
      package_config: fetchedPrice.package_config as PackageConfig | null | undefined,
      tiered_config: fetchedPrice.tiered_config as TieredConfig | null | undefined,
      unit_config: fetchedPrice.unit_config as UnitConfig | null | undefined,
      // Add other fields from fetchedPrice if they exist in our Price type
    };

    return { success: true, price: mappedPrice };

  } catch (error) {
    console.error("[Action] Error fetching price details:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch price details";
    const isNotFoundError = errorMessage.toLowerCase().includes('not found');
    
    return { 
      success: false, 
      price: null,
      error: isNotFoundError ? 'Price not found' : errorMessage 
    };
  }
}

// Helper function to fetch subscription details from Orb
// This is a simplified version; you might have a more robust Orb client or service
async function getOrbSubscription(subscriptionId: string, apiKey: string): Promise<Subscription | null> {
  const orbApiUrl = `https://api.withorb.com/v1/subscriptions/${subscriptionId}`;
  try {
    const response = await fetch(orbApiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      console.error(`[Action] Failed to fetch Orb subscription ${subscriptionId}: ${response.status} ${response.statusText}`);
      // Attempt to parse error for more detail
      try {
        const errorBody = await response.json();
        console.error("[Action] Orb fetch error body:", errorBody);
      } catch { /* ignore parse error if errorBody isn't valid JSON */ }
      return null;
    }
    return await response.json() as Subscription;
  } catch (error) {
    console.error(`[Action] Error fetching Orb subscription ${subscriptionId}:`, error);
    return null;
  }
}

/**
 * Removes a specific fixed-fee quantity transition from a subscription's price interval.
 */
export async function removeFixedFeeTransition(
  subscriptionId: string,
  priceIntervalId: string,
  effectiveDateToRemove: string // Expected in YYYY-MM-DD format, or full ISO if Orb stores it that way consistently
): Promise<{ success: boolean; error?: string }> {
  console.log(`[Action] Removing fixed-fee transition for sub: ${subscriptionId}, interval: ${priceIntervalId}, date: ${effectiveDateToRemove}`);

  const apiKey = process.env.ORB_API_KEY;
  if (!apiKey) {
    console.error('[Action] Orb API key is not configured.');
    return { success: false, error: 'Server configuration error.' };
  }
  if (!subscriptionId || !priceIntervalId || !effectiveDateToRemove) {
    return { success: false, error: 'Missing required parameters for removing transition.' };
  }

  // 1. Fetch current subscription details from Orb
  const currentSubscription = await getOrbSubscription(subscriptionId, apiKey);
  if (!currentSubscription) {
    return { success: false, error: 'Failed to fetch current subscription details from Orb.' };
  }

  // 2. Find the relevant price interval and its transitions
  const targetInterval = currentSubscription.price_intervals?.find(pi => pi.id === priceIntervalId);
  if (!targetInterval) {
    return { success: false, error: `Price interval ${priceIntervalId} not found on subscription.` };
  }

  const existingTransitions = targetInterval.fixed_fee_quantity_transitions || [];
  
  // 3. Filter out the transition to be removed
  // Orb stores dates as YYYY-MM-DDTHH:mm:ss+00:00. 
  // The effectiveDateToRemove from the client might be YYYY-MM-DD.
  // We should compare only the date part for robustness or ensure client sends full ISO string.
  // Using startsWith is a pragmatic approach if effectiveDateToRemove is YYYY-MM-DD.
  const updatedTransitions = existingTransitions.filter(
    t => !t.effective_date.startsWith(effectiveDateToRemove) 
  );

  if (updatedTransitions.length === existingTransitions.length && existingTransitions.length > 0) {
    // Only warn if there were transitions to begin with and none were removed.
    console.warn(`[Action] Transition with effective date starting with ${effectiveDateToRemove} not found for removal.`);
    // Depending on desired behavior, you might return an error or success.
    // For now, if not found, we proceed to send the (potentially unchanged) list to Orb.
    // If the intent is that it *must* be found, return { success: false, error: 'Transition not found.' };
  }

  // 4. Construct the payload for Orb
  const orbApiUrl = `https://api.withorb.com/v1/subscriptions/${subscriptionId}/price_intervals`;
  const payload = {
    edit: [
      {
        price_interval_id: priceIntervalId,
        fixed_fee_quantity_transitions: updatedTransitions.length > 0 ? updatedTransitions : null, 
      },
    ],
  };

  console.log("[Action] Sending Payload to remove transition:", JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(orbApiUrl, {
      method: 'POST', 
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let errorBody;
      try {
        errorBody = await response.json();
      } catch {
        console.error('[Action] Failed to parse error response body for removal, using status text.');
        throw new Error(`API Error during removal: ${response.status} ${response.statusText}`);
      }
      console.error('[Action] Failed to update Orb price interval for removal:', JSON.stringify(errorBody, null, 2));
      const errorMessage = errorBody?.validation_errors?.join('; ') 
                         || errorBody?.title 
                         || `API Error: ${response.status} ${response.statusText}`;
      throw new Error(errorMessage);
    }

    console.log(`[Action] Successfully updated transitions for interval: ${priceIntervalId} after removal attempt.`);
    return { success: true };

  } catch (error) {
    console.error("[Action] Error during transition removal process:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return { success: false, error: errorMessage };
  }
}

// Make sure to export FixedFeeQuantityTransition if it's used here and defined in types.ts
// For this example, it's assumed to be available via an import from types.ts if not defined locally.
// Ensure Subscription and PriceInterval types are correctly imported and cover fixed_fee_quantity_transitions.