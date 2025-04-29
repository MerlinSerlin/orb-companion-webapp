import { create } from 'zustand'
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware'

export type PersistedCustomerState = {
  pendingPlanId: string | null;
  customerId: string | null; // Internal Orb ID (cus_...)
  externalCustomerId: string | null; // User-friendly ID (e.g., john_doe)
}

export interface CustomerState extends PersistedCustomerState {
  setPendingPlanId: (planId: string | null) => void;
  setCustomerId: (id: string | null) => void;
  setExternalCustomerId: (id: string | null) => void;
  reset: () => void;
}

const initialState: PersistedCustomerState = {
  pendingPlanId: null,
  customerId: null,
  externalCustomerId: null,
};

const mockStorage: StateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export const useCustomerStore = create<CustomerState>()(
  persist(
    (set, _get) => ({
      ...initialState,
      setPendingPlanId: (planId: string | null) => set({ pendingPlanId: planId }),
      setCustomerId: (id: string | null) => set({ customerId: id }),
      setExternalCustomerId: (id: string | null) => set({ externalCustomerId: id }),
      reset: () => set(initialState),
    }),
    {
      name: 'customer-storage',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? localStorage : mockStorage
      ),
      partialize: (state): PersistedCustomerState => ({ 
        pendingPlanId: state.pendingPlanId,
        customerId: state.customerId,
        externalCustomerId: state.externalCustomerId
      }),
    }
  )
) 