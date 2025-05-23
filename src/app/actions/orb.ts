'use server'

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

/**
 * Creates a new subscription for a customer with an optional start date.
 * 
 * @param {string} customerId - The Orb ID of the customer.
 * @param {string} planId - The ID of the plan to subscribe to.
 * @param {string} [startDate] - Optional start date for the subscription in YYYY-MM-DD format.
 * @returns {Promise<object>} - An object indicating success or failure, including the subscription details or an error message.
 */
export async function createSubscription(customerId: string, planId: string, startDate?: string) {
  try {
    console.log(`Subscribing customer ${customerId} to plan ${planId}` + (startDate ? ` starting on ${startDate}` : ''));

    const subscription = await orbClient.subscriptions.create({
      customer_id: customerId,
      plan_id: planId,
      ...(startDate && { start_date: startDate }), // Conditionally add start_date if provided
    })
    
    console.log(`Subscription created successfully with ID: ${subscription.id}`)

    return {
      success: true,
      subscription: {
        id: subscription.id,
        plan_id: planId,
        status: subscription.status,
        start_date: subscription.start_date // Include start_date in the response
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
    const isNotFoundError = errorMessage.toLowerCase().includes('not found');
    
    return {
      success: false,
      customer: null, 
      error: isNotFoundError ? 'Customer not found' : errorMessage, 
    };
  }
}

export async function editPriceIntervalQuantity(
  subscriptionId: string,
  priceIntervalId: string,
  transitions: FixedFeeQuantityTransition[] 
): Promise<{ success: boolean; error?: string }> {
  console.log(`[Action] Editing price interval quantity for sub: ${subscriptionId}, interval: ${priceIntervalId}`);
  console.log("[Action] Received Transitions:", transitions);
  
  const apiKey = process.env.ORB_API_KEY;
  if (!apiKey) {
    console.error('[Action] Orb API key is not configured.');
    return { success: false, error: 'Server configuration error.' };
  }
  if (!subscriptionId || !priceIntervalId || !transitions || transitions.length === 0) {
     return { success: false, error: 'Missing required parameters for editing price interval quantity.' };
  }

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
      
      console.error('[Action] Failed to edit Orb price interval:', JSON.stringify(errorBody, null, 2));
      
      const errorMessage = errorBody?.validation_errors?.join('; ') 
                         || errorBody?.title 
                         || `API Error: ${response.status} ${response.statusText}`;
      throw new Error(errorMessage);
    }

    console.log(`[Action] Successfully edited price interval quantity for interval: ${priceIntervalId}`);
    
    return { success: true };

  } catch (error) {
    console.error("[Action] Error during price interval edit process:", error);
    
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";

    return { 
      success: false, 
      error: errorMessage
    };
  }
}

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
    
    return { success: true };

  } catch (error) {
    console.error("[Action] Error during price interval add process:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return { success: false, error: errorMessage };
  }
}

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
    const fetchedPrice = await orbClient.prices.fetch(priceId);

    if (!fetchedPrice) {
      throw new Error('Price not found');
    }

    console.log(`[Action] Successfully fetched price details for ${priceId}`);
    
    // Map base fields first
    const mappedPrice: Partial<Price> = {
      id: fetchedPrice.id,
      name: fetchedPrice.name,
      price_type: fetchedPrice.price_type,
      model_type: fetchedPrice.model_type,
      currency: fetchedPrice.currency,
      item: fetchedPrice.item, 
      fixed_price_quantity: fetchedPrice.fixed_price_quantity, // May be null/undefined if not applicable
    };

    // Conditionally add model-specific configs based on model_type
    if ('package_config' in fetchedPrice) {
        mappedPrice.package_config = fetchedPrice.package_config as PackageConfig | null | undefined;
    }
    if ('tiered_config' in fetchedPrice) {
        mappedPrice.tiered_config = fetchedPrice.tiered_config as TieredConfig | null | undefined;
    }
    if ('unit_config' in fetchedPrice) {
        mappedPrice.unit_config = fetchedPrice.unit_config as UnitConfig | null | undefined;
    }
    // Add checks for other potential model_type specific configs if needed

    // Return the mapped price, asserting it matches the full Price type 
    // (assuming base fields + potential configs cover the Price type definition)
    return { success: true, price: mappedPrice as Price };

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

export async function removeFixedFeeTransition(
  subscriptionId: string,
  priceIntervalId: string,
  effectiveDateToRemove: string 
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

  const currentSubscription = await getOrbSubscription(subscriptionId, apiKey);
  if (!currentSubscription) {
    return { success: false, error: 'Failed to fetch current subscription details from Orb.' };
  }

  const targetInterval = currentSubscription.price_intervals?.find(pi => pi.id === priceIntervalId);
  if (!targetInterval) {
    return { success: false, error: `Price interval ${priceIntervalId} not found on subscription.` };
  }

  const existingTransitions = targetInterval.fixed_fee_quantity_transitions || [];
  
  const updatedTransitions = existingTransitions.filter(
    t => !t.effective_date.startsWith(effectiveDateToRemove) 
  );

  if (updatedTransitions.length === existingTransitions.length && existingTransitions.length > 0) {
    console.warn(`[Action] Transition with effective date starting with ${effectiveDateToRemove} not found for removal.`);
  }

  const orbApiUrl = `https://api.withorb.com/v1/subscriptions/${subscriptionId}/price_intervals`;
  const payload = {
    edit: [
      {
        price_interval_id: priceIntervalId,
        fixed_fee_quantity_transitions: updatedTransitions.length > 0 ? updatedTransitions : [], 
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