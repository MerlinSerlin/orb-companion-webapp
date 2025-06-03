'use server'

import { createOrbClient } from "@/lib/orb"
import type { OrbInstance } from "@/lib/orb-config"
import { ORB_INSTANCES } from "@/lib/orb-config"
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

export async function createCustomer(name: string, email: string, instance: OrbInstance = 'cloud-infra') {
  try {
    console.log(`Creating customer with name: ${name}, email: ${email} for instance: ${instance}`)

    const instanceOrbClient = createOrbClient(instance);
    const formattedExternalId = name.trim().replace(/\s+/g, '_')

    const customer = await instanceOrbClient.customers.create({
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
 * @param {OrbInstance} [instance] - The Orb instance to use for the subscription.
 * @returns {Promise<object>} - An object indicating success or failure, including the subscription details or an error message.
 */
export async function createSubscription(customerId: string, planId: string, startDate?: string, instance: OrbInstance = 'cloud-infra') {
  try {
    console.log(`Subscribing customer ${customerId} to plan ${planId}` + (startDate ? ` starting on ${startDate}` : '') + ` for instance: ${instance}`)

    const instanceOrbClient = createOrbClient(instance);

    const subscriptionPayload = {
      customer_id: customerId,
      plan_id: planId,
      ...(startDate && { start_date: startDate }), // Conditionally add start_date if provided
    };
    
    console.log('Subscription payload:', JSON.stringify(subscriptionPayload, null, 2));
    console.log('Making API call to Orb...');
    
    const subscription = await instanceOrbClient.subscriptions.create(subscriptionPayload)
    
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
    console.error("Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      // @ts-expect-error - accessing error properties for debugging
      status: error?.status,
      // @ts-expect-error - accessing error detail property for debugging
      detail: error?.detail,
      // @ts-expect-error - accessing error type property for debugging
      type: error?.type
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create subscription",
    }
  }
}

export async function getCustomerSubscriptions(customerId: string, instance: OrbInstance = 'cloud-infra'): Promise<GetSubscriptionsResult> {
  try {
    const client = createOrbClient(instance);
    const orbResponse = await client.subscriptions.list({
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


export async function getCustomerDetails(customerId: string, instance: OrbInstance = 'cloud-infra'): Promise<GetCustomerDetailsResult> {
  try {
    const client = createOrbClient(instance);
    const customer = await client.customers.fetch(customerId);

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
  transitions: FixedFeeQuantityTransition[],
  instance: OrbInstance = 'cloud-infra'
): Promise<{ success: boolean; error?: string }> {
  console.log(`[Action] Editing price interval quantity for sub: ${subscriptionId}, interval: ${priceIntervalId}, instance: ${instance}`);
  console.log("[Action] Received Transitions:", transitions);
  
  const instanceConfig = ORB_INSTANCES[instance];
  const apiKey = instanceConfig.apiKey;
  if (!apiKey) {
    console.error(`[Action] Orb API key is not configured for instance: ${instance}.`);
    return { success: false, error: 'Server configuration error.' };
  }
  if (!subscriptionId || !priceIntervalId || !transitions || transitions.length === 0) {
     return { success: false, error: 'Missing required parameters for editing price interval quantity.' };
  }

  const payload = {
    edit: [
      {
        price_interval_id: priceIntervalId,
        fixed_fee_quantity_transitions: transitions, 
      },
    ],
  };
  
  console.log("[Action] Sending Payload:", JSON.stringify(payload, null, 2));

  try {
    const instanceOrbClient = createOrbClient(instance);
    await instanceOrbClient.subscriptions.priceIntervals(subscriptionId, payload);

    console.log(`[Action] Successfully edited price interval quantity for interval: ${priceIntervalId}`);
    
    return { success: true };

  } catch (error) {
    console.error("[Action] Error during price interval edit process:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return { success: false, error: errorMessage };
  }
}

export async function addPriceInterval(
  subscriptionId: string,
  priceId: string,
  startDate?: string | null,
  instance: OrbInstance = 'cloud-infra'
): Promise<{ success: boolean; error?: string }> {
  console.log(`[Action] Adding price ${priceId} to subscription ${subscriptionId} for instance: ${instance}`);

  const instanceConfig = ORB_INSTANCES[instance];
  const apiKey = instanceConfig.apiKey;
  if (!apiKey) {
    console.error(`[Action] Orb API key is not configured for instance: ${instance}.`);
    return { success: false, error: 'Server configuration error.' };
  }
  if (!subscriptionId || !priceId) {
    return { success: false, error: 'Missing required parameters for adding price interval.' };
  }

  const instanceOrbClient = createOrbClient(instance);

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

  try {
    await instanceOrbClient.subscriptions.priceIntervals(subscriptionId, {
      add: [
        {
          price_id: priceId,
          start_date: effectiveStartDate,
        },
      ],
    });

    console.log(`[Action] Successfully added price ${priceId} to subscription ${subscriptionId} starting ${effectiveStartDate}`);
    return { success: true };
  } catch (error) {
    console.error("[Action] Error during add price interval process:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return { success: false, error: errorMessage };
  }
}

export interface PriceIntervalScheduleEdit {
  price_interval_id: string;
  start_date?: string | null; 
  end_date?: string | null;   
}

export async function editPriceIntervalSchedule(
  subscriptionId: string,
  edits: PriceIntervalScheduleEdit[],
  instance: OrbInstance = 'cloud-infra'
): Promise<{ success: boolean; error?: string }> {
  console.log(`[Action] Editing price interval schedule for subscription ${subscriptionId} in instance: ${instance}`);
  console.log("[Action] Received Schedule Edits:", JSON.stringify(edits, null, 2));

  const instanceConfig = ORB_INSTANCES[instance];
  const apiKey = instanceConfig.apiKey;
  if (!apiKey) {
    console.error(`[Action] Orb API key is not configured for instance: ${instance}.`);
    return { success: false, error: 'Server configuration error.' };
  }

  if (!subscriptionId) {
    return { success: false, error: 'Subscription ID is required.' };
  }
  if (!edits || edits.length === 0) {
    return { success: false, error: 'No schedule edits provided.' };
  }

  for (const edit of edits) {
    if (!edit.price_interval_id) {
      return { success: false, error: 'Each schedule edit must include a price_interval_id.' };
    }
    if (typeof edit.start_date === 'string' && !/^\d{4}-\d{2}-\d{2}$/.test(edit.start_date)) {
      return { success: false, error: `Invalid start_date format: ${edit.start_date}. Use YYYY-MM-DD.` };
    }
    if (typeof edit.end_date === 'string' && !/^\d{4}-\d{2}-\d{2}$/.test(edit.end_date)) {
      return { success: false, error: `Invalid end_date format: ${edit.end_date}. Use YYYY-MM-DD.` };
    }
  }

  const payload = {
    edit: edits.map(edit => {
      const orbEditPayload: {
        price_interval_id: string;
        start_date?: string;
        end_date?: string;
      } = { price_interval_id: edit.price_interval_id };

      // Only include dates if they are strings (not null or undefined)
      // Orb API interprets missing fields as "no change"
      if (typeof edit.start_date === 'string') {
        orbEditPayload.start_date = edit.start_date;
      }
      if (typeof edit.end_date === 'string') {
        orbEditPayload.end_date = edit.end_date;
      }
      return orbEditPayload;
    }),
  };

  console.log("[Action] Sending Schedule Payload to Orb:", JSON.stringify(payload, null, 2));

  try {
    const instanceOrbClient = createOrbClient(instance);
    await instanceOrbClient.subscriptions.priceIntervals(subscriptionId, payload);

    console.log(`[Action] Successfully edited price interval schedules for subscription ${subscriptionId}.`);
    return { success: true };
  } catch (error) {
    console.error("[Action] Error editing price interval schedules:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    // @ts-expect-error - error response type is unknown but may contain response.data from Orb API
    if (error && error.response && error.response.data) {
        // @ts-expect-error - accessing response.data which exists on axios errors but not typed
        console.error("[Action] Orb Error Details:", JSON.stringify(error.response.data, null, 2));
    }
    return { success: false, error: errorMessage };
  }
}

export async function getPriceDetails(
  priceId: string,
  instance: OrbInstance = 'cloud-infra'
): Promise<{ success: boolean; price?: Price | null; error?: string }> {
  console.log(`[Action] Fetching details for price ${priceId} in instance: ${instance}`);

  const instanceConfig = ORB_INSTANCES[instance];
  const apiKey = instanceConfig.apiKey;
  if (!apiKey) {
    console.error(`[Action] Orb API key is not configured for instance: ${instance}.`);
    return { success: false, error: 'Server configuration error.' };
  }
  if (!priceId) {
    return { success: false, error: 'Missing price ID.' };
  }

  try {
    const instanceOrbClient = createOrbClient(instance);
    const fetchedPrice = await instanceOrbClient.prices.fetch(priceId);

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

async function getOrbSubscription(subscriptionId: string, instance: OrbInstance = 'cloud-infra'): Promise<Subscription | null> {
  try {
    const instanceOrbClient = createOrbClient(instance);
    const subscription = await instanceOrbClient.subscriptions.fetch(subscriptionId);
    return subscription as Subscription;
  } catch (error) {
    console.error(`[Action] Error fetching Orb subscription ${subscriptionId}:`, error);
    return null;
  }
}

export async function removeFixedFeeTransition(
  subscriptionId: string,
  priceIntervalId: string,
  effectiveDateToRemove: string,
  instance: OrbInstance = 'cloud-infra'
): Promise<{ success: boolean; error?: string }> {
  console.log(`[Action] Removing fixed-fee transition for sub: ${subscriptionId}, interval: ${priceIntervalId}, date: ${effectiveDateToRemove}, instance: ${instance}`);

  const instanceConfig = ORB_INSTANCES[instance];
  const apiKey = instanceConfig.apiKey;
  if (!apiKey) {
    console.error(`[Action] Orb API key is not configured for instance: ${instance}.`);
    return { success: false, error: 'Server configuration error.' };
  }
  if (!subscriptionId || !priceIntervalId || !effectiveDateToRemove) {
    return { success: false, error: 'Missing required parameters for removing transition.' };
  }

  const currentSubscription = await getOrbSubscription(subscriptionId, instance);
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
    const instanceOrbClient = createOrbClient(instance);
    await instanceOrbClient.subscriptions.priceIntervals(subscriptionId, payload);

    console.log(`[Action] Successfully updated transitions for interval: ${priceIntervalId} after removal attempt.`);
    return { success: true };

  } catch (error) {
    console.error("[Action] Error during transition removal process:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return { success: false, error: errorMessage };
  }
}

export async function listPlans(instance: OrbInstance = 'cloud-infra') {
  try {
    console.log(`Listing plans for instance: ${instance}`)
    
    const instanceOrbClient = createOrbClient(instance);
    const plans = await instanceOrbClient.plans.list();
    
    console.log(`Found ${plans.data.length} plans in ${instance} instance:`);
    plans.data.forEach((plan, index) => {
      console.log(`  ${index + 1}. ID: ${plan.id}, Name: ${plan.name}`);
    });
    
    return {
      success: true,
      plans: plans.data.map(plan => ({
        id: plan.id,
        name: plan.name,
        description: plan.description,
        status: plan.status
      }))
    };
  } catch (error) {
    console.error(`Error listing plans for ${instance}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to list plans"
    };
  }
} 