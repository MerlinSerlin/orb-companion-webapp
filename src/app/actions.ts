"use server"

import { orbClient } from "@/lib/orb"

export async function createCustomer(name: string, email: string) {
  try {
    const customer = await orbClient.customers.create({
      email,
      name,
    })

    return {
      success: true,
      customerId: customer.id,
    }
  } catch (error) {
    console.error("Error creating customer:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

export async function subscribeCustomerToPlan(customerId: string, planId: string) {
  try {
    const subscription = await orbClient.subscriptions.create({
      customer_id: customerId,
      plan_id: planId,
      auto_collection: true,
    })

    return {
      success: true,
      subscriptionId: subscription.id,
    }
  } catch (error) {
    console.error("Error subscribing customer to plan:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

