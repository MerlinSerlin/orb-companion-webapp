import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCustomerStore } from '../store/customer-store'
import { 
  getCustomerSubscriptions, 
  getSubscriptionUsage, 
  createSubscription,
  getAvailablePlans,
  getPlanDetails,
  cancelSubscription,
} from '@/app/actions'

// Hook to fetch customer subscriptions
export function useCustomerSubscriptions() {
  const customer = useCustomerStore(state => state.customer)
  
  return useQuery({
    queryKey: ['subscriptions', customer?.id],
    queryFn: async () => {
      if (!customer) return null
      const result = await getCustomerSubscriptions(customer.id)
      if (!result.success) throw new Error(result.error)
      return result.subscriptions
    },
    enabled: !!customer,
  })
}

// Hook to fetch customer usage
export function useCustomerUsage(subscriptionId?: string) {
  const customer = useCustomerStore(state => state.customer)
  
  return useQuery({
    queryKey: ['usage', customer?.id, subscriptionId],
    queryFn: async () => {
      if (!customer || !subscriptionId) return null
      const result = await getSubscriptionUsage(subscriptionId)
      if (!result.success) throw new Error(result.error)
      return result.usage
    },
    enabled: !!customer && !!subscriptionId,
  })
}

// Hook to create a subscription
export function useCreateSubscription() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ customerId, planId }: { customerId: string; planId: string }) => {
      const result = await createSubscription(customerId, planId)
      if (!result.success) throw new Error(result.error)
      return result.subscription
    },
    onSuccess: (_, { customerId }) => {
      // Invalidate subscriptions query to refetch
      queryClient.invalidateQueries({ queryKey: ['subscriptions', customerId] })
    },
  })
}

// Hook to fetch available plans
export function useAvailablePlans() {
  return useQuery({
    queryKey: ['plans'],
    queryFn: async () => {
      const result = await getAvailablePlans()
      if (!result.success) throw new Error(result.error)
      return result.plans
    },
  })
}

// Hook to fetch plan details
export function usePlanDetails(planId: string | null) {
  return useQuery({
    queryKey: ['plan', planId],
    queryFn: async () => {
      if (!planId) return null
      const result = await getPlanDetails(planId)
      if (!result.success) throw new Error(result.error)
      return result.plan
    },
    enabled: !!planId,
  })
}

// Hook to cancel a subscription
export function useCancelSubscription() {
  const queryClient = useQueryClient()
  const customer = useCustomerStore(state => state.customer)
  
  return useMutation({
    mutationFn: async (subscriptionId: string) => {
      const result = await cancelSubscription(subscriptionId)
      if (!result.success) throw new Error(result.error)
      return result.subscription
    },
    onSuccess: () => {
      if (customer) {
        // Invalidate subscriptions query to refetch
        queryClient.invalidateQueries({ queryKey: ['subscriptions', customer.id] })
      }
    },
  })
}

// Hook to fetch customer's current usage costs
export function useSubscriptionCosts(subscriptionId?: string) {
  const customer = useCustomerStore(state => state.customer)

  return useQuery({
    queryKey: ['costs', customer?.id, subscriptionId],
    queryFn: async () => {
      if (!customer || !subscriptionId) return null
      const costs = await orbClient.subscriptions.fetchCosts(subscriptionId)
      return costs.data
    },
    enabled: !!customer && !!subscriptionId,
  })
}

// Hook to create price simulations
export function useCreatePriceSimulation() {
  return useMutation({
    mutationFn: async ({ customerId, planId }: { customerId: string; planId: string }) => {
      const simulation = await orbClient.prices.evaluate(
        planId,
        {
          customer_id: customerId,
          // Add any additional simulation parameters as needed
          timeframe_end: new Date().toISOString(),
          timeframe_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Last 30 days
        }
      )
      return simulation
    },
  })
} 