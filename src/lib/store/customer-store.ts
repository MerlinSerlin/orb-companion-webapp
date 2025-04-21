import { create } from 'zustand'
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware'

interface Subscription {
  id: string
  plan_id: string
  status: 'active' | 'canceled' | 'ended' | 'pending'
}

interface Customer {
  id: string
  name: string
  email: string
  subscription: Subscription | null
}

type PersistedState = {
  customer: Customer | null
}

interface CustomerState extends PersistedState {
  pendingPlanId: string | null
  setCustomer: (customer: Customer | null) => void
  setSubscription: (subscription: Subscription | null) => void
  setPendingPlanId: (planId: string | null) => void
  reset: () => void
}

const initialState = {
  customer: null,
  pendingPlanId: null,
}

// Mock storage for SSR
const mockStorage: StateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
}

export const useCustomerStore = create<CustomerState>()(
  persist(
    (set, get) => ({
      ...initialState,
      setCustomer: (customer) => set({ customer }),
      setSubscription: (subscription) => {
        const { customer } = get();
        if (customer) {
          set({ 
            customer: { 
              ...customer, 
              subscription 
            } 
          });
        }
      },
      setPendingPlanId: (planId) => set({ pendingPlanId: planId }),
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