// Remove unused Zustand imports
// import { create } from 'zustand'
// import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware'

/**
 * Represents the structure of a subscription object
 * based on the expected response from the Orb API.
 */
export interface Subscription {
  id: string;
  name?: string | null;
  currency?: string | null;
  status: 'active' | 'canceled' | 'ended' | 'pending' | 'upcoming';
  start_date?: string | null;
  end_date?: string | null;
  current_period_start?: string | null;
  current_period_end?: string | null;
  plan?: Plan | null;
  price_intervals?: PriceInterval[] | null;
}

/**
 * Represents the structure of the customer object stored in Zustand.
 */
export interface Customer {
  id: string;
  external_customer_id?: string | null;
  name: string;
  email: string;
  subscriptions: Subscription[]; // Use renamed Subscription
}

/**
 * Defines the shape of the state persisted in localStorage.
 */
export type PersistedState = {
  customer: Customer | null;
}

/**
 * Defines the complete state structure for the customer Zustand store,
 * including both state and actions.
 */
export interface CustomerState extends PersistedState {
  pendingPlanId: string | null;
  setCustomer: (customer: Customer | null) => void;
  addSubscription: (subscription: Subscription) => void; // Use renamed Subscription
  updateSubscription: (subscriptionId: string, subscription: Partial<Subscription>) => void; // Use renamed Subscription
  removeSubscription: (subscriptionId: string) => void;
  setPendingPlanId: (planId: string | null) => void;
  reset: () => void;
}

/**
 * Represents the structure of the response from our
 * `getCustomerSubscriptions` server action.
 */
export interface GetSubscriptionsResult {
  success: boolean;
  externalCustomerId?: string | null;
  subscriptions?: Subscription[] | null; // Use renamed Subscription
  error?: string | null;
}

/**
 * Represents the core customer details fetched from the backend.
 */
export interface CustomerDetails {
  id: string;
  external_customer_id: string | null;
  name: string;
  email: string;
  portal_url?: string | null;
  // Add other fields if needed later, e.g., currency, timezone
}

/**
 * Represents the structure of the response from our
 * `getCustomerDetails` server action.
 */
export interface GetCustomerDetailsResult {
  success: boolean;
  customer?: CustomerDetails | null; 
  error?: string | null;
}

// --- API Response Details ---
// Based on Orb API examples for nested structures within Subscription fetch

export interface Item {
  id: string;
  name: string;
}

export interface PriceTier {
  first_unit?: number | null;
  last_unit?: number | null;
  unit_amount?: string | null;
}

export interface Price {
  id: string;
  name: string;
  price_type: 'fixed_price' | 'usage_price' | string; // Allow other strings
  model_type: 'unit' | 'tiered' | string; // Allow other strings
  currency: string;
  item?: Item | null;
  fixed_price_quantity?: number | null;
  tiered_config?: { tiers: PriceTier[] } | null;
  unit_config?: { unit_amount?: string | null } | null;
  // Add other price fields if needed
}

// Add type for the quantity transition object
export interface FixedFeeQuantityTransition {
  effective_date: string; 
  quantity: number;
  price_id?: string; // Optional price_id as seen in logs
}

export interface PriceInterval {
  id: string;
  start_date?: string | null;
  end_date?: string | null;
  price?: Price | null;
  // Add the new field, allowing null or array
  fixed_fee_quantity_transitions?: FixedFeeQuantityTransition[] | null; 
  // Add other interval fields if needed
}

export interface Plan {
  id: string;
  name: string;
  description?: string | null;
  // Add other plan fields if needed
}

// ... PersistedCustomerState, CustomerState definitions ...
// export type PersistedCustomerState = { ... }; // Keep commented or remove fully if not defined
// export interface CustomerState extends PersistedCustomerState { ... }; // Keep commented or remove fully if not defined

// ... Store implementation (useCustomerStore) ...
// export const useCustomerStore = create<CustomerState>()( ... ); // Keep commented or remove fully if not defined 