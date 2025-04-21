import { create } from 'zustand'
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware'
import type { 
  CustomerState, 
  Subscription,
  PersistedState 
} from "@/lib/types"; // Import all needed types

const initialState: Omit<CustomerState, 'setCustomer' | 'addSubscription' | 'updateSubscription' | 'removeSubscription' | 'setPendingPlanId' | 'reset'> = {
  customer: null,
  pendingPlanId: null,
};

// Mock storage for SSR
const mockStorage: StateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export const useCustomerStore = create<CustomerState>()(
  persist(
    (set, get) => ({
      ...initialState,
      setCustomer: (customer) => set({
        customer: customer ? {
          ...customer,
          // Ensure subscriptions is always an array
          subscriptions: customer.subscriptions || []
        } : null
      }),
      // Ensure method signatures use Subscription
      addSubscription: (subscription: Subscription) => {
        const { customer } = get();
        if (customer) {
          set({
            customer: {
              ...customer,
              subscriptions: [...customer.subscriptions, subscription]
            },
            pendingPlanId: null // Reset pendingPlanId after successful subscription
          });
        }
      },
      updateSubscription: (subscriptionId: string, updatedFields: Partial<Subscription>) => {
        const { customer } = get();
        if (customer) {
          const updatedSubscriptions = customer.subscriptions.map(sub =>
            sub.id === subscriptionId ? { ...sub, ...updatedFields } : sub
          );
          set({
            customer: {
              ...customer,
              subscriptions: updatedSubscriptions
            }
          });
        }
      },
      removeSubscription: (subscriptionId: string) => {
        const { customer } = get();
        if (customer) {
          set({
            customer: {
              ...customer,
              subscriptions: customer.subscriptions.filter(sub => sub.id !== subscriptionId)
            }
          });
        }
      },
      setPendingPlanId: (planId: string | null) => set({ pendingPlanId: planId }),
      reset: () => set(initialState),
    }),
    {
      name: 'customer-storage',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? localStorage : mockStorage
      ),
      partialize: (state): PersistedState => ({
        customer: state.customer
      }),
    }
  )
) 