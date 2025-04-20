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
  setCustomer: (customer: Customer | null) => void
  setSubscription: (subscription: Subscription | null) => void
  reset: () => void
}

const initialState = {
  customer: null,
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