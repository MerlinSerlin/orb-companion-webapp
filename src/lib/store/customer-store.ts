import { create } from 'zustand'
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware'

interface Customer {
  id: string
  name: string
  email: string
}

interface Subscription {
  id: string
  plan_id: string
  status: 'active' | 'canceled' | 'ended' | 'pending'
}

type PersistedState = {
  customer: Customer | null
  subscription: Subscription | null
  pendingPlanId: string | null
}

interface CustomerState extends PersistedState {
  isRegistrationOpen: boolean
  isPlanSelectionOpen: boolean
  registrationSuccessCallback: (() => void) | null
  setCustomer: (customer: Customer | null) => void
  setSubscription: (subscription: Subscription | null) => void
  openRegistration: (onSuccessCallback?: () => void) => void
  closeRegistration: () => void
  openPlanSelection: () => void
  closePlanSelection: () => void
  setPendingPlanId: (planId: string | null) => void
  reset: () => void
}

const initialState = {
  customer: null,
  subscription: null,
  isRegistrationOpen: false,
  isPlanSelectionOpen: false,
  pendingPlanId: null,
  registrationSuccessCallback: null,
}

// Mock storage for SSR
const mockStorage: StateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
}

export const useCustomerStore = create<CustomerState>()(
  persist(
    (set) => ({
      ...initialState,
      setCustomer: (customer) => set({ customer }),
      setSubscription: (subscription) => set({ subscription }),
      openRegistration: (onSuccessCallback) => 
        set({ 
          isRegistrationOpen: true, 
          registrationSuccessCallback: onSuccessCallback || null 
        }),
      closeRegistration: () => 
        set({ 
          isRegistrationOpen: false, 
          registrationSuccessCallback: null 
        }),
      openPlanSelection: () => set({ isPlanSelectionOpen: true }),
      closePlanSelection: () => set({ isPlanSelectionOpen: false }),
      setPendingPlanId: (planId) => set({ pendingPlanId: planId }),
      reset: () => set(initialState),
    }),
    {
      name: 'customer-storage',
      storage: createJSONStorage(() => 
        typeof window !== 'undefined' ? localStorage : mockStorage
      ),
      partialize: (state): PersistedState => ({ 
        customer: state.customer,
        subscription: state.subscription,
        pendingPlanId: state.pendingPlanId 
      }),
    }
  )
) 