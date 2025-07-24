import { create } from 'zustand'
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware'
import type { OrbInstance } from '../orb-config'

export type ScheduledPlanChange = {
  subscriptionId: string;
  targetPlanId: string;
  targetPlanName: string;
  changeDate?: string | null;
  changeOption: 'immediate' | 'end_of_subscription_term' | 'requested_date';
  scheduledAt: string; // ISO timestamp when the change was scheduled
}

export type PersistedCustomerState = {
  pendingPlanId: string | null;
  customerId: string | null; // Internal Orb ID (cus_...)
  externalCustomerId: string | null; // User-friendly ID (e.g., john_doe)
  selectedInstance: OrbInstance | null; // The instance the user has selected to work with
  scheduledPlanChanges: Record<string, ScheduledPlanChange>; // subscriptionId -> ScheduledPlanChange
}

export interface CustomerState extends PersistedCustomerState {
  setPendingPlanId: (planId: string | null) => void;
  setCustomerId: (id: string | null) => void;
  setExternalCustomerId: (id: string | null) => void;
  setSelectedInstance: (instance: OrbInstance | null) => void;
  setScheduledPlanChange: (subscriptionId: string, change: ScheduledPlanChange) => void;
  removeScheduledPlanChange: (subscriptionId: string) => void;
  getScheduledPlanChange: (subscriptionId: string) => ScheduledPlanChange | null;
  logout: () => void; // Clear all data
  reset: () => void; // Alias for logout
}

const initialState: PersistedCustomerState = {
  pendingPlanId: null,
  customerId: null,
  externalCustomerId: null,
  selectedInstance: null,
  scheduledPlanChanges: {},
}

// Mock storage for environments without localStorage
const mockStorage: StateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
}

export const useCustomerStore = create<CustomerState>()(
  persist(
    (set, get) => ({
      ...initialState,
      setPendingPlanId: (planId: string | null) => set({ pendingPlanId: planId }),
      setCustomerId: (id: string | null) => set({ customerId: id }),
      setExternalCustomerId: (id: string | null) => set({ externalCustomerId: id }),
      setSelectedInstance: (instance: OrbInstance | null) => set({ selectedInstance: instance }),
      setScheduledPlanChange: (subscriptionId: string, change: ScheduledPlanChange) => 
        set((state) => ({
          scheduledPlanChanges: {
            ...state.scheduledPlanChanges,
            [subscriptionId]: change
          }
        })),
      removeScheduledPlanChange: (subscriptionId: string) =>
        set((state) => {
          const newScheduledPlanChanges = { ...state.scheduledPlanChanges };
          delete newScheduledPlanChanges[subscriptionId];
          return { scheduledPlanChanges: newScheduledPlanChanges };
        }),
      getScheduledPlanChange: (subscriptionId: string) => {
        const state = get();
        return state.scheduledPlanChanges[subscriptionId] || null;
      },
      logout: () => {
        console.log('[Store Reset] Clearing customer session and instance selection...');
        set(initialState);
        
        // Clear localStorage
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.removeItem('customer-storage');
        }
      },
      reset: () => {
        const store = get();
        store.logout();
      }
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
        scheduledPlanChanges: state.scheduledPlanChanges,
      }),
    }
  )
) 