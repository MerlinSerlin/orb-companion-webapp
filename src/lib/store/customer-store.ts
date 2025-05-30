import { create } from 'zustand'
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware'
import type { OrbInstance } from '../orb-config'

export type PersistedCustomerState = {
  pendingPlanId: string | null;
  customerId: string | null; // Internal Orb ID (cus_...)
  externalCustomerId: string | null; // User-friendly ID (e.g., john_doe)
  selectedInstance: OrbInstance | null; // The instance the user has selected to work with
}

export interface CustomerState extends PersistedCustomerState {
  setPendingPlanId: (planId: string | null) => void;
  setCustomerId: (id: string | null) => void;
  setExternalCustomerId: (id: string | null) => void;
  setSelectedInstance: (instance: OrbInstance | null) => void;
  logout: () => void; // Clear all data
  reset: () => void; // Alias for logout
}

const initialState: PersistedCustomerState = {
  pendingPlanId: null,
  customerId: null,
  externalCustomerId: null,
  selectedInstance: null,
};

const mockStorage: StateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export const useCustomerStore = create<CustomerState>()(
  persist(
    (set) => ({
      ...initialState,
      setPendingPlanId: (planId: string | null) => set({ pendingPlanId: planId }),
      setCustomerId: (id: string | null) => set({ customerId: id }),
      setExternalCustomerId: (id: string | null) => set({ externalCustomerId: id }),
      setSelectedInstance: (instance: OrbInstance | null) => set({ selectedInstance: instance }),
      logout: () => {
        console.log('[Store Reset] Setting state to initial and clearing storage...');
        set(initialState);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('customer-storage');
        }
      },
      reset: () => {
        console.log('[Store Reset] Setting state to initial and clearing storage...');
        set(initialState);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('customer-storage');
        }
      },
    }),
    {
      name: 'customer-storage',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? localStorage : mockStorage
      ),
      partialize: (state): PersistedCustomerState => ({ 
        pendingPlanId: state.pendingPlanId,
        customerId: state.customerId,
        externalCustomerId: state.externalCustomerId,
        selectedInstance: state.selectedInstance,
      }),
    }
  )
) 