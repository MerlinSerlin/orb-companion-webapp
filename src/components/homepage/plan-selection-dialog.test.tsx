import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlanSelectionDialog } from './plan-selection-dialog';
import { createSubscription } from '@/app/actions/orb';
import { PLAN_DETAILS } from '@/components/plans/plan-data';
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

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the implementation to default (logged-in) before each test
    mockUseCustomerStore.mockImplementation((selector) => {
        const state: Partial<CustomerState> = {
            pendingPlanId: PLAN_DETAILS[0].plan_id, 
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
          pendingPlanId: PLAN_DETAILS[0].plan_id, // Plan selected
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
        // customerId prop is removed - component reads from store
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

  // Add more tests later for the logged-in case
}); 