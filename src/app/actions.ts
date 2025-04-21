"use server"

import { orbClient } from "@/lib/orb"
import type { GetSubscriptionsResult, Subscription } from "@/lib/types";

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
    console.log(`Fetching subscriptions for customer ${customerId}`)
    
    // Assume Orb SDK type (adjust if needed)
    type OrbSDKSubscription = {
      id: string;
      status: 'active' | 'canceled' | 'ended' | 'pending' | 'upcoming';
      start_date?: string | null;
      end_date?: string | null;
      current_period_start?: string | null;
      current_period_end?: string | null;
      plan?: { id: string; name?: string } | null; 
    };

    const orbResponse = await orbClient.subscriptions.list({
      customer_id: [customerId],
    })

    // Map the SDK response to our Subscription structure
    const subscriptionsData: Subscription[] = orbResponse.data.map((sdkSub: OrbSDKSubscription) => ({
      id: sdkSub.id,
      plan_id: sdkSub.plan?.id || 'unknown_plan_id', 
      status: sdkSub.status,
      start_date: sdkSub.start_date,
      end_date: sdkSub.end_date,
      current_period_start: sdkSub.current_period_start,
      current_period_end: sdkSub.current_period_end,
    }));

    return {
      success: true,
      subscriptions: subscriptionsData,
    }
  } catch (error) {
    console.error('Error fetching subscriptions:', error)
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



