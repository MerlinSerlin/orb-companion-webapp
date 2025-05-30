import { useQuery } from '@tanstack/react-query';
import { getCustomerSubscriptions, getCustomerDetails } from '@/app/actions/orb';
import type { Subscription, CustomerDetails } from '@/lib/types';
import type { OrbInstance } from '@/lib/orb-config';

/**
 * Custom hook to fetch customer subscriptions.
 * 
 * @param customerId The ID of the customer whose subscriptions to fetch.
 * @param instance The Orb instance to query (cloud-infra or ai-agents).
 * @returns The result object from React Query, containing subscription data, loading state, error state, etc.
 */
export function useCustomerSubscriptions(customerId: string | null | undefined, instance: OrbInstance = 'cloud-infra') {
  return useQuery<Subscription[], Error>({ 
    // Include instance in queryKey to ensure separate caches for different instances
    queryKey: ['subscriptions', customerId, instance], 
    queryFn: async () => { 
      if (!customerId) {
        // Should not happen if enabled is false, but return empty array as safeguard
        return []; 
      }
      const result = await getCustomerSubscriptions(customerId, instance);
      if (!result.success) {
        // Throw error to put query hook in error state
        throw new Error(result.error || 'Failed to fetch subscriptions');
      }
      // Ensure we return an empty array if subscriptions are null/undefined
      return result.subscriptions ?? []; 
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!customerId // Query is only enabled if customerId is truthy
  });
}

/**
 * Custom hook to fetch customer details.
 * 
 * @param customerId The ID of the customer whose details to fetch.
 * @param instance The Orb instance to query (cloud-infra or ai-agents).
 * @returns The result object from React Query, containing customer details data, loading state, error state, etc.
 */
export function useCustomerDetails(customerId: string | null | undefined, instance: OrbInstance = 'cloud-infra') {
  return useQuery<CustomerDetails | null, Error>({ // Return type can be CustomerDetails or null
    // Include instance in queryKey to ensure separate caches for different instances
    queryKey: ['customer', customerId, instance],
    queryFn: async () => {
      if (!customerId) {
        return null; // Return null if no customerId
      }
      const result = await getCustomerDetails(customerId, instance); 
      if (!result.success) { 
        // Throw error to put query hook in error state
        // Log the error for server visibility but throw for client state
        console.error('Failed to fetch customer details in queryFn:', result.error);
        throw new Error(result.error || 'Failed to fetch customer details');
      }
      // Return the customer data (which might be null if not found by the action)
      return result.customer ?? null; 
    },
    staleTime: Infinity, // Typically customer details don't change often
    enabled: !!customerId // Query is only enabled if customerId is truthy
  });
} 