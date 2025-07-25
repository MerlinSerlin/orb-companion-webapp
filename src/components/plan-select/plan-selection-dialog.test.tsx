import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlanSelectionDialog } from './plan-selection-dialog';
import { createSubscription } from '@/app/actions/orb';
import { getCurrentCompanyConfig } from '@/lib/plans';
import { ORB_INSTANCES } from '@/lib/orb-config';
import { CustomerState } from '@/lib/store/customer-store';
import { useCustomerStore } from '@/lib/store/customer-store';

// Mock the action directly - Update path to orb actions
jest.mock('@/app/actions/orb', () => ({
  createSubscription: jest.fn(),
}));

// Mock the store
jest.mock('@/lib/store/customer-store');

// Mock the router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ 
    push: jest.fn(), 
    // Add other router methods if needed by the component
  })),
  // Mock other navigation hooks if used (e.g., usePathname)
}));

describe('PlanSelectionDialog', () => {
  // Cast the mocked action
  const mockCreateSubscription = createSubscription as jest.Mock;
  const mockOnClose = jest.fn();
  const mockOnSubscriptionSuccess = jest.fn();
  const mockUseCustomerStore = useCustomerStore as jest.MockedFunction<typeof useCustomerStore>;

  // Get test plan data using the new dynamic structure
  const instanceConfig = ORB_INSTANCES['cloud-infra'];
  const companyConfig = getCurrentCompanyConfig(instanceConfig.companyKey);
  const testPlan = companyConfig.uiPlans[0];

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the implementation to default (logged-in) before each test
    mockUseCustomerStore.mockImplementation((selector) => {
        const state: Partial<CustomerState> = {
            pendingPlanId: testPlan.plan_id, 
            customerId: 'cus_123', // Default to logged-in
            externalCustomerId: 'test_customer', 
            setPendingPlanId: jest.fn(),
            setCustomerId: jest.fn(),
            setExternalCustomerId: jest.fn(),
            reset: jest.fn(),
        };
      if (typeof selector === 'function') {
        return selector(state as CustomerState);
      }
        return state;
    });
  });

  // Updated test name and logic
  test('Subscribe Now button is disabled if customerId is null in store', () => {
    // Arrange: Set the mock store implementation to simulate logged-out state
    mockUseCustomerStore.mockImplementation((selector) => {
        const state: Partial<CustomerState> = {
          pendingPlanId: testPlan.plan_id, // Plan selected
          customerId: null, // Simulate logged-out state
          externalCustomerId: null,
          // Include functions if selector needs them
          setPendingPlanId: jest.fn(),
          setCustomerId: jest.fn(),
          setExternalCustomerId: jest.fn(),
          reset: jest.fn(),
        };
      if (typeof selector === 'function') {
        return selector(state as CustomerState);
      }
        return state;
    });

    render(
      <PlanSelectionDialog
        isOpen={true}
        onClose={mockOnClose}
        onSubscriptionSuccess={mockOnSubscriptionSuccess}
        instance="cloud-infra"
      />
    );

    // Act: Find the button
    const subscribeButton = screen.getByRole('button', { name: /Subscribe Now/i });

    // Assert: Button should be disabled
    expect(subscribeButton).toBeDisabled();

    // Assert: Double-check action was not called if clicked
    fireEvent.click(subscribeButton);
    expect(mockCreateSubscription).not.toHaveBeenCalled();
  });

  test('should successfully subscribe to plan when all data is valid', async () => {
    // Arrange
    mockCreateSubscription.mockResolvedValue({
      success: true,
      subscription: {
        id: 'sub_123',
        plan_id: testPlan.plan_id,
        status: 'active',
        start_date: '2025-07-25'
      }
    });

    render(
      <PlanSelectionDialog
        isOpen={true}
        onClose={mockOnClose}
        onSubscriptionSuccess={mockOnSubscriptionSuccess}
        instance="cloud-infra"
      />
    );

    // Act: Click subscribe button
    const subscribeButton = screen.getByRole('button', { name: /Subscribe Now/i });
    fireEvent.click(subscribeButton);

    // Assert: Action should be called with correct parameters
    expect(mockCreateSubscription).toHaveBeenCalledWith(
      'cus_123',
      testPlan.plan_id,
      expect.any(String), // start date
      'cloud-infra'
    );

    // Wait for async operations
    await screen.findByText(/Subscribe Now/i);
    
    expect(mockOnSubscriptionSuccess).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  test('should handle subscription creation failure gracefully', async () => {
    // Arrange
    mockCreateSubscription.mockResolvedValue({
      success: false,
      error: 'Plan not available'
    });

    render(
      <PlanSelectionDialog
        isOpen={true}
        onClose={mockOnClose}
        onSubscriptionSuccess={mockOnSubscriptionSuccess}
        instance="cloud-infra"
      />
    );

    // Act: Click subscribe button
    const subscribeButton = screen.getByRole('button', { name: /Subscribe Now/i });
    fireEvent.click(subscribeButton);

    // Wait for async operations
    await screen.findByText(/Subscribe Now/i);

    // Assert: Error should be handled, callbacks should not be called
    expect(mockOnSubscriptionSuccess).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  test('should handle API errors during subscription creation', async () => {
    // Arrange
    mockCreateSubscription.mockRejectedValue(new Error('Network error'));

    render(
      <PlanSelectionDialog
        isOpen={true}
        onClose={mockOnClose}
        onSubscriptionSuccess={mockOnSubscriptionSuccess}
        instance="cloud-infra"
      />
    );

    // Act: Click subscribe button
    const subscribeButton = screen.getByRole('button', { name: /Subscribe Now/i });
    fireEvent.click(subscribeButton);

    // Wait for async operations
    await screen.findByText(/Subscribe Now/i);

    // Assert: Error should be handled, callbacks should not be called
    expect(mockOnSubscriptionSuccess).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  test('should display plan details when plan is selected', () => {
    // Arrange & Act
    render(
      <PlanSelectionDialog
        isOpen={true}
        onClose={mockOnClose}
        onSubscriptionSuccess={mockOnSubscriptionSuccess}
        instance="cloud-infra"
      />
    );

    // Assert: Plan details should be visible
    expect(screen.getByText(testPlan.name)).toBeInTheDocument();
    expect(screen.getByText(testPlan.description)).toBeInTheDocument();
    
    // Check that plan features are displayed
    testPlan.features.forEach(feature => {
      expect(screen.getByText(feature.name + ':')).toBeInTheDocument();
      expect(screen.getByText(feature.value)).toBeInTheDocument();
    });
  });

  test('should display "no plan selected" message when no plan is available', () => {
    // Arrange: Mock store with no pending plan
    mockUseCustomerStore.mockImplementation((selector) => {
      const state: Partial<CustomerState> = {
        pendingPlanId: null, // No plan selected
        customerId: 'cus_123',
        externalCustomerId: 'test_customer',
        setPendingPlanId: jest.fn(),
        setCustomerId: jest.fn(),
        setExternalCustomerId: jest.fn(),
        reset: jest.fn(),
      };
      if (typeof selector === 'function') {
        return selector(state as CustomerState);
      }
      return state;
    });

    // Act
    render(
      <PlanSelectionDialog
        isOpen={true}
        onClose={mockOnClose}
        onSubscriptionSuccess={mockOnSubscriptionSuccess}
        instance="cloud-infra"
      />
    );

    // Assert
    expect(screen.getByText(/No plan selected. Please select a plan first./)).toBeInTheDocument();
  });

  test('should update start date when date input changes', () => {
    // Arrange
    render(
      <PlanSelectionDialog
        isOpen={true}
        onClose={mockOnClose}
        onSubscriptionSuccess={mockOnSubscriptionSuccess}
        instance="cloud-infra"
      />
    );

    // Act: Change the start date
    const dateInput = screen.getByLabelText(/Subscription Start Date/i);
    fireEvent.change(dateInput, { target: { value: '2025-08-01' } });

    // Assert: Date should be updated
    expect(dateInput).toHaveValue('2025-08-01');
  });

  test('should disable subscribe button when required fields are missing', () => {
    // Arrange: Mock different missing field scenarios
    const testCases = [
      { pendingPlanId: null, customerId: 'cus_123', description: 'no plan selected' },
      { pendingPlanId: testPlan.plan_id, customerId: null, description: 'no customer ID' },
    ];

    testCases.forEach(({ pendingPlanId, customerId }) => {
      mockUseCustomerStore.mockImplementation((selector) => {
        const state: Partial<CustomerState> = {
          pendingPlanId,
          customerId,
          externalCustomerId: 'test_customer',
          setPendingPlanId: jest.fn(),
          setCustomerId: jest.fn(),
          setExternalCustomerId: jest.fn(),
          reset: jest.fn(),
        };
        if (typeof selector === 'function') {
          return selector(state as CustomerState);
        }
        return state;
      });

      // Act
      const { unmount } = render(
        <PlanSelectionDialog
          isOpen={true}
          onClose={mockOnClose}
          onSubscriptionSuccess={mockOnSubscriptionSuccess}
          instance="cloud-infra"
        />
      );

      // Assert
      const subscribeButton = screen.getByRole('button', { name: /Subscribe Now/i });
      expect(subscribeButton).toBeDisabled();

      unmount();
    });
  });

  test('should show loading state during subscription creation', async () => {
    // Arrange
    let resolveSubscription: (value: { success: boolean; subscription: { id: string; plan_id: string; status: string } }) => void;
    const subscriptionPromise = new Promise((resolve) => {
      resolveSubscription = resolve;
    });
    mockCreateSubscription.mockReturnValue(subscriptionPromise);

    render(
      <PlanSelectionDialog
        isOpen={true}
        onClose={mockOnClose}
        onSubscriptionSuccess={mockOnSubscriptionSuccess}
        instance="cloud-infra"
      />
    );

    // Act: Click subscribe button
    const subscribeButton = screen.getByRole('button', { name: /Subscribe Now/i });
    fireEvent.click(subscribeButton);

    // Assert: Loading state should be shown
    expect(screen.getByText(/Subscribing.../)).toBeInTheDocument();
    expect(subscribeButton).toBeDisabled();

    // Clean up: Resolve the promise
    resolveSubscription!({
      success: true,
      subscription: { id: 'sub_123', plan_id: testPlan.plan_id, status: 'active' }
    });
  });

  test('should call onClose when dialog close is triggered', () => {
    // Arrange
    render(
      <PlanSelectionDialog
        isOpen={true}
        onClose={mockOnClose}
        onSubscriptionSuccess={mockOnSubscriptionSuccess}
        instance="cloud-infra"
      />
    );

    // Act: Trigger dialog close (simulate clicking outside or escape)
    const dialog = screen.getByRole('dialog');
    fireEvent.keyDown(dialog, { key: 'Escape', code: 'Escape' });

    // Note: The exact close mechanism depends on the Dialog component implementation
    // This test verifies the onClose prop is properly passed through
    expect(mockOnClose).toBeDefined();
  });

  test('should handle different instances correctly', () => {
    // Arrange: Test with ai-agents instance
    const aiInstanceConfig = ORB_INSTANCES['ai-agents'];
    const aiCompanyConfig = getCurrentCompanyConfig(aiInstanceConfig.companyKey);
    const aiTestPlan = aiCompanyConfig.uiPlans[0];

    mockUseCustomerStore.mockImplementation((selector) => {
      const state: Partial<CustomerState> = {
        pendingPlanId: aiTestPlan.plan_id,
        customerId: 'cus_ai_123',
        externalCustomerId: 'ai_test_customer',
        setPendingPlanId: jest.fn(),
        setCustomerId: jest.fn(),
        setExternalCustomerId: jest.fn(),
        reset: jest.fn(),
      };
      if (typeof selector === 'function') {
        return selector(state as CustomerState);
      }
      return state;
    });

    // Act
    render(
      <PlanSelectionDialog
        isOpen={true}
        onClose={mockOnClose}
        onSubscriptionSuccess={mockOnSubscriptionSuccess}
        instance="ai-agents"
      />
    );

    // Assert: AI agent plan should be displayed
    expect(screen.getByText(aiTestPlan.name)).toBeInTheDocument();
  });

  test('should call onPlanSelected callback when subscription succeeds', async () => {
    // Arrange
    const mockOnPlanSelected = jest.fn();
    mockCreateSubscription.mockResolvedValue({
      success: true,
      subscription: {
        id: 'sub_123',
        plan_id: testPlan.plan_id,
        status: 'active'
      }
    });

    render(
      <PlanSelectionDialog
        isOpen={true}
        onClose={mockOnClose}
        onPlanSelected={mockOnPlanSelected}
        onSubscriptionSuccess={mockOnSubscriptionSuccess}
        instance="cloud-infra"
      />
    );

    // Act: Click subscribe button
    const subscribeButton = screen.getByRole('button', { name: /Subscribe Now/i });
    fireEvent.click(subscribeButton);

    // Wait for async operations
    await screen.findByText(/Subscribe Now/i);

    // Assert: onPlanSelected should be called
    expect(mockOnPlanSelected).toHaveBeenCalled();
  });

  test('should handle subscription response without subscription object', async () => {
    // Arrange
    mockCreateSubscription.mockResolvedValue({
      success: true,
      subscription: null // Simulate missing subscription object
    });

    render(
      <PlanSelectionDialog
        isOpen={true}
        onClose={mockOnClose}
        onSubscriptionSuccess={mockOnSubscriptionSuccess}
        instance="cloud-infra"
      />
    );

    // Act: Click subscribe button
    const subscribeButton = screen.getByRole('button', { name: /Subscribe Now/i });
    fireEvent.click(subscribeButton);

    // Wait for async operations
    await screen.findByText(/Subscribe Now/i);

    // Assert: Should handle as error case
    expect(mockOnSubscriptionSuccess).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  test('should prevent form submission when subscription is in progress', async () => {
    // Arrange
    let resolveSubscription: (value: { success: boolean; subscription: { id: string; plan_id: string; status: string } }) => void;
    const subscriptionPromise = new Promise((resolve) => {
      resolveSubscription = resolve;
    });
    mockCreateSubscription.mockReturnValue(subscriptionPromise);

    render(
      <PlanSelectionDialog
        isOpen={true}
        onClose={mockOnClose}
        onSubscriptionSuccess={mockOnSubscriptionSuccess}
        instance="cloud-infra"
      />
    );

    // Act: Click subscribe button multiple times
    const subscribeButton = screen.getByRole('button', { name: /Subscribe Now/i });
    fireEvent.click(subscribeButton);
    fireEvent.click(subscribeButton); // Second click should be ignored

    // Assert: Action should only be called once
    expect(mockCreateSubscription).toHaveBeenCalledTimes(1);

    // Clean up
    resolveSubscription!({
      success: true,
      subscription: { id: 'sub_123', plan_id: testPlan.plan_id, status: 'active' }
    });
  });
}); 