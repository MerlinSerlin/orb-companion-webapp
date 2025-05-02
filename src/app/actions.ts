"use server"

import { orbClient } from "@/lib/orb"
import type { 
  GetSubscriptionsResult, 
  Subscription, 
  GetCustomerDetailsResult, 
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
  newQuantity: number,
  effectiveDate: string // Expecting YYYY-MM-DD format
): Promise<{ success: boolean; error?: string }> {
  if (!process.env.ORB_API_KEY) {
    console.error('Orb API key is not configured.');
    return { success: false, error: 'Server configuration error.' };
  }
  if (!subscriptionId || !priceIntervalId) {
     return { success: false, error: 'Missing subscription or price interval ID.' };
  }

  const orbApiUrl = `https://api.withorb.com/v1/subscriptions/${subscriptionId}/price_intervals`;

  const requestBody = {
    edit: [
      {
        price_interval_id: priceIntervalId,
        fixed_fee_quantity_transitions: [
          {
            quantity: newQuantity,
            effective_date: effectiveDate,
          },
        ],
      },
    ],
  };

  try {
    const response = await fetch(orbApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.ORB_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorBody = await response.json();
      console.error('Failed to edit Orb price interval:', errorBody);
      const errorMessage = errorBody?.title || `API Error: ${response.status} ${response.statusText}`;
      return { success: false, error: errorMessage };
    }

    return { success: true };
  } catch (error) {
    console.error('Error calling Orb API:', error);
    return { success: false, error: 'An unexpected error occurred.' };
  }
}



