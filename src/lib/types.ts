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
  current_billing_period_start_date?: string | null;
  current_billing_period_end_date?: string | null;
  plan?: Plan | null;
  price_intervals?: PriceInterval[] | null;
  // Fields for tracking scheduled plan changes
  scheduled_plan_change?: {
    target_plan_id: string;
    target_plan_name?: string;
    change_date?: string | null;
    change_option: 'immediate' | 'end_of_subscription_term' | 'requested_date';
  } | null;
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

// Define config types (if not already present or need refinement)
export interface PackageConfig {
  package_amount: string;
  package_size: number;
}

export interface TieredConfig {
  tiers: PriceTier[];
}

export interface UnitConfig {
  unit_amount?: string | null;
}

// Define TieredPackageTier specifically for tiered_package_config
export interface TieredPackageTier {
  first_unit?: number | null; // Or tier_lower_bound if API requires that
  last_unit?: number | null;  // Or tier_upper_bound
  package_amount: string;    // Cost for packages in this tier
  package_size: number;      // Size of packages in this tier
}

export interface TieredPackageConfig extends Record<string, unknown> {
  tiers?: TieredPackageTier[];
}

export interface Price {
  id: string;
  name: string;
  price_type: 'fixed_price' | 'usage_price' | string; 
  model_type: 'unit' | 'tiered' | 'package' | 'matrix' | 'tiered_package' | 'grouped_tiered' | string; 
  currency: string;
  item?: Item | null;
  fixed_price_quantity?: number | null;
  package_config?: PackageConfig | null; 
  tiered_config?: TieredConfig | null; 
  unit_config?: UnitConfig | null; 
  // Add tiered_package_config
  tiered_package_config?: TieredPackageConfig | null;
}

export interface FixedFeeQuantityTransition { 
  effective_date: string;
  quantity: number;
}

export interface PriceInterval {
  id: string;
  start_date?: string | null;
  end_date?: string | null;
  price?: Price | null;
  fixed_fee_quantity_transitions?: FixedFeeQuantityTransition[] | null; 
}

export interface Plan {
  id: string;
  name: string;
  description?: string | null;
  prices?: Price[] | null; // Add prices array
  // Add other plan fields if needed
}

// ... PersistedCustomerState, CustomerState definitions ...
// export type PersistedCustomerState = { ... }; // Keep commented or remove fully if not defined
// export interface CustomerState extends PersistedCustomerState { ... }; // Keep commented or remove fully if not defined

// ... Store implementation (useCustomerStore) ...
// export const useCustomerStore = create<CustomerState>()( ... ); // Keep commented or remove fully if not defined 