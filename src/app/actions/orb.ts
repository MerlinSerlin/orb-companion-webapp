'use server'

import { createOrbClient } from "@/lib/orb"
import type { OrbInstance } from "@/lib/orb-config"
import { ORB_INSTANCES } from "@/lib/orb-config"
import type Orb from 'orb-billing'
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
import { buildRandomizedEventPayload, buildManualEventPayload } from "@/lib/events/payload-builder";
import type { SendEventResult } from "@/lib/events/types";

// Error type definitions for proper error handling
type OrbApiError = {
  status?: number;
  detail?: string;
  type?: string;
  response?: {
    data?: unknown;
  };
};

type ExtendedError = Error & Partial<OrbApiError>;

// Type guard to check if error has Orb API properties
function isOrbApiError(error: unknown): error is ExtendedError {
  return error !== null && 
         typeof error === 'object' && 
         ('status' in error || 'detail' in error || 'type' in error || 'response' in error);
}

// Type guard to check if error has axios-like response
function hasAxiosResponse(error: unknown): error is { response: { data: unknown } } {
  return error !== null && 
         typeof error === 'object' && 
         'response' in error &&
         error.response !== null &&
         typeof error.response === 'object' &&
         'data' in error.response;
}

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
    
    const errorDetails = {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      ...(isOrbApiError(error) && {
        status: error.status,
        detail: error.detail,
        type: error.type
      })
    };
    
    console.error("Error details:", errorDetails);
    
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

    const subscriptionsData: Subscription[] = orbResponse.data.map((sdkSub: Orb.Subscription) => { 
      const mappedSub = {
        id: sdkSub.id,
        name: sdkSub.plan.name,
        currency: sdkSub.plan.currency,
        status: sdkSub.status,
        start_date: sdkSub.start_date,
        end_date: sdkSub.end_date,
        current_billing_period_start_date: sdkSub.current_billing_period_start_date, 
        current_billing_period_end_date: sdkSub.current_billing_period_end_date, 
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

export async function editFixedFeeQuantityTransitions(
  subscriptionId: string,
  priceIntervalId: string,
  transitions: FixedFeeQuantityTransition[],
  instance: OrbInstance = 'cloud-infra'
): Promise<{ success: boolean; error?: string }> {
  console.log(`[Action] Editing fixed fee quantity transitions for sub: ${subscriptionId}, interval: ${priceIntervalId}, instance: ${instance}`);
  console.log("[Action] Received Transitions:", transitions);
  
  const instanceConfig = ORB_INSTANCES[instance];
  const apiKey = instanceConfig.apiKey;
  if (!apiKey) {
    console.error(`[Action] Orb API key is not configured for instance: ${instance}.`);
    return { success: false, error: 'Server configuration error.' };
  }
  if (!subscriptionId || !priceIntervalId || !transitions || transitions.length === 0) {
     return { success: false, error: 'Missing required parameters for editing fixed fee quantity transitions.' };
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

    console.log(`[Action] Successfully edited fixed fee quantity transitions for interval: ${priceIntervalId}`);
    
    return { success: true };

  } catch (error) {
    console.error("[Action] Error during fixed fee quantity transitions edit process:", error);
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
    
    if (hasAxiosResponse(error)) {
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

export async function removeFixedFeeQuantityTransition(
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


export async function schedulePlanChange(
  subscriptionId: string,
  targetPlanId: string,
  changeOption: 'immediate' | 'end_of_subscription_term' | 'requested_date' = 'immediate',
  changeDate?: string,
  instance: OrbInstance = 'cloud-infra'
): Promise<{ success: boolean; error?: string }> {
  console.log(`[Action] Scheduling plan change for subscription ${subscriptionId} to plan ${targetPlanId} with option ${changeOption} in instance: ${instance}`);

  const instanceConfig = ORB_INSTANCES[instance];
  const apiKey = instanceConfig.apiKey;
  if (!apiKey) {
    console.error(`[Action] Orb API key is not configured for instance: ${instance}.`);
    return { success: false, error: 'Server configuration error.' };
  }
  
  if (!subscriptionId || !targetPlanId) {
    return { success: false, error: 'Missing required parameters for scheduling plan change.' };
  }

  // Validate changeDate if using requested_date option
  if (changeOption === 'requested_date') {
    if (!changeDate) {
      return { success: false, error: 'Change date is required when using requested_date option.' };
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(changeDate)) {
      return { success: false, error: 'Invalid change date format. Use YYYY-MM-DD.' };
    }
  }

  try {
    const instanceOrbClient = createOrbClient(instance);
    
    const payload: {
      plan_id: string;
      change_option: 'immediate' | 'end_of_subscription_term' | 'requested_date';
      change_date?: string;
    } = {
      plan_id: targetPlanId,
      change_option: changeOption,
    };

    // Only include change_date if using requested_date option
    if (changeOption === 'requested_date' && changeDate) {
      payload.change_date = changeDate;
    }

    console.log("[Action] Sending plan change payload:", JSON.stringify(payload, null, 2));

    // Use the SDK's schedulePlanChange method
    await instanceOrbClient.subscriptions.schedulePlanChange(subscriptionId, payload);

    console.log(`[Action] Successfully scheduled plan change for subscription ${subscriptionId} to plan ${targetPlanId}`);
    return { success: true };

  } catch (error) {
    console.error("[Action] Error scheduling plan change:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    
    if (hasAxiosResponse(error)) {
        console.error("[Action] Orb Error Details:", JSON.stringify(error.response.data, null, 2));
    }
    
    return { success: false, error: errorMessage };
  }
}

export async function unschedulePlanChange(
  subscriptionId: string,
  instance: OrbInstance = 'cloud-infra'
): Promise<{ success: boolean; error?: string }> {
  console.log(`[Action] Unscheduling pending plan changes for subscription ${subscriptionId} in instance: ${instance}`);

  const instanceConfig = ORB_INSTANCES[instance];
  const apiKey = instanceConfig.apiKey;
  if (!apiKey) {
    console.error(`[Action] Orb API key is not configured for instance: ${instance}.`);
    return { success: false, error: 'Server configuration error.' };
  }
  
  if (!subscriptionId) {
    return { success: false, error: 'Subscription ID is required for unscheduling plan change.' };
  }

  try {
    const instanceOrbClient = createOrbClient(instance);
    
    console.log(`[Action] Calling unschedule pending plan changes for subscription: ${subscriptionId}`);

    // Use the SDK's unschedulePendingPlanChanges method
    await instanceOrbClient.subscriptions.unschedulePendingPlanChanges(subscriptionId);

    console.log(`[Action] Successfully unscheduled pending plan changes for subscription ${subscriptionId}`);
    return { success: true };

  } catch (error) {
    console.error("[Action] Error unscheduling plan changes:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    
    if (hasAxiosResponse(error)) {
        console.error("[Action] Orb Error Details:", JSON.stringify(error.response.data, null, 2));
    }
    
    return { success: false, error: errorMessage };
  }
}

// Send a randomized event to Orb
export async function sendRandomizedEvent(
  customerId: string,
  instance: OrbInstance = 'ai-agents',
  externalCustomerId?: string,
  testMode: boolean = false
): Promise<SendEventResult> {
  try {
    console.log(`[Event Ingestion] Sending randomized event for customer ${customerId} in instance: ${instance}`);
    
    // Build the event payload
    const event = buildRandomizedEventPayload(instance, customerId, externalCustomerId);
    const payload = {
      events: [event]
    };

    console.log(`[Event Ingestion] Generated payload:`, JSON.stringify(payload, null, 2));

    // If test mode, just return the payload without sending
    if (testMode) {
      console.log(`[Event Ingestion] Test mode enabled - not sending to Orb`);
      return {
        success: true,
        event,
        debug: {
          payload
        }
      };
    }

    // Create Orb client and send the event
    const orbClient = createOrbClient(instance);
    const response = await orbClient.events.ingest(payload);

    console.log(`[Event Ingestion] Successfully sent event to Orb:`, response);

    return {
      success: true,
      event,
      debug: {
        payload,
        response
      }
    };

  } catch (error) {
    console.error(`[Event Ingestion] Error sending event:`, error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to send event';
    
    return {
      success: false,
      error: errorMessage
    };
  }
}

// Send a manual event to Orb with custom property values
export async function sendManualEvent(
  customerId: string,
  manualProperties: Record<string, string | number | boolean>,
  instance: OrbInstance = 'ai-agents',
  externalCustomerId?: string,
  testMode: boolean = false
): Promise<SendEventResult> {
  try {
    console.log(`[Event Ingestion] Sending manual event for customer ${customerId} in instance: ${instance}`);
    console.log(`[Event Ingestion] Manual properties:`, manualProperties);
    
    // Build the event payload
    const event = buildManualEventPayload(instance, customerId, manualProperties, externalCustomerId);
    const payload = {
      events: [event]
    };

    console.log(`[Event Ingestion] Generated payload:`, JSON.stringify(payload, null, 2));

    // If test mode, just return the payload without sending
    if (testMode) {
      console.log(`[Event Ingestion] Test mode enabled - not sending to Orb`);
      return {
        success: true,
        event,
        debug: {
          payload
        }
      };
    }

    // Create Orb client and send the event
    const orbClient = createOrbClient(instance);
    const response = await orbClient.events.ingest(payload);

    console.log(`[Event Ingestion] Successfully sent event to Orb:`, response);

    return {
      success: true,
      event,
      debug: {
        payload,
        response
      }
    };

  } catch (error) {
    console.error(`[Event Ingestion] Error sending event:`, error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to send event';
    
    return {
      success: false,
      error: errorMessage
    };
  }
}