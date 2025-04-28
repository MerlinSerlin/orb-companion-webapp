/**
 * Represents the structure of a subscription object
 * based on the expected response from the Orb API.
 */
export interface Subscription {
  id: string;
  name?: string | null;
  plan_id: string;
  planName?: string | null;
  currency?: string | null;
  status: 'active' | 'canceled' | 'ended' | 'pending' | 'upcoming';
  start_date?: string | null;
  end_date?: string | null;
  current_period_start?: string | null;
  current_period_end?: string | null;
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