import { create } from 'zustand'
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware'

export type PersistedUiState = {
  pendingPlanId: string | null;
}

export interface UiState extends PersistedUiState {
  setPendingPlanId: (planId: string | null) => void;
  reset: () => void;
}

// Define the initial state for UI concerns only
const initialState: PersistedUiState = {
  pendingPlanId: null,
};

// Mock storage for SSR
const mockStorage: StateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      ...initialState,
      setPendingPlanId: (planId: string | null) => set({ pendingPlanId: planId }),
      reset: () => set(initialState), // Resets only pendingPlanId
    }),
    {
      name: 'ui-storage', // Changed storage name
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? localStorage : mockStorage
      ),
      // Update partialize to only include UI state
      partialize: (state): PersistedUiState => ({ 
        pendingPlanId: state.pendingPlanId
      }),
    }
  )
) 