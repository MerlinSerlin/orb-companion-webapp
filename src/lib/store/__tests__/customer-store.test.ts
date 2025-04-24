import { useCustomerStore } from '../customer-store';

// Get the initial state from the store definition to reset between tests
const initialState = useCustomerStore.getState();

describe('useCustomerStore', () => {
  // Reset store state before each test
  beforeEach(() => {
    useCustomerStore.setState(initialState);
  });

  it('should have null as the initial pendingPlanId', () => {
    // Assert initial state directly after reset
    expect(useCustomerStore.getState().pendingPlanId).toBeNull();
  });

  it('should update pendingPlanId when setPendingPlanId is called with a valid plan ID', () => {
    const testPlanId = 'plan_12345';

    // Check initial state (optional, but good practice)
    expect(useCustomerStore.getState().pendingPlanId).toBeNull();

    // Call the action
    useCustomerStore.getState().setPendingPlanId(testPlanId);

    // Assert that the state was updated correctly
    expect(useCustomerStore.getState().pendingPlanId).toBe(testPlanId);
  });

  it('should set pendingPlanId to null when setPendingPlanId is called with null', () => {
    // Set it to something first to ensure the change happens
    useCustomerStore.getState().setPendingPlanId('some_plan');
    expect(useCustomerStore.getState().pendingPlanId).toBe('some_plan');

    // Call the action with null
    useCustomerStore.getState().setPendingPlanId(null);

    // Assert that the state was updated correctly
    expect(useCustomerStore.getState().pendingPlanId).toBeNull();
  });

  // Add more tests here later if needed
}); 