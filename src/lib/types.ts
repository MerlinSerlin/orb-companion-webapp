/**
 * Represents the structure of a subscription object
 * based on the expected response from the Orb API.
 */
export interface Subscription {
  id: string;
  plan_id: string;
  status: 'active' | 'canceled' | 'ended' | 'pending' | 'upcoming';
  start_date?: string | null;
  end_date?: string | null;
  current_period_start?: string | null;
  current_period_end?: string | null;
  // Add other relevant fields from the Orb API subscriptions object as needed
  // e.g., customer?: { id: string; name?: string; email?: string };
  // e.g., plan?: { id: string; name?: string };
}

/**
 * Represents the structure of the customer object stored in Zustand.
 */
export interface Customer {
  id: string;
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
  subscriptions?: Subscription[] | null; // Use renamed Subscription
  error?: string | null;
} 