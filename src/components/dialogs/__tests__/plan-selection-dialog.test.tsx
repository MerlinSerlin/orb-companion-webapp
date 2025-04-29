import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlanSelectionDialog } from '../plan-selection-dialog';
import { createSubscription } from '@/app/actions';
import { PLAN_DETAILS } from '@/components/plans/plan-data';

// --- Mock Setup --- 
let mockUiStateImplementation = (selector: (state: any) => any) => {
  // Default state (logged in)
  const state = {
    pendingPlanId: PLAN_DETAILS[0].plan_id, 
    customerId: 'cus_123', 
    externalCustomerId: 'test_customer', 
    setPendingPlanId: jest.fn(),
    setCustomerId: jest.fn(),
    setExternalCustomerId: jest.fn(),
    reset: jest.fn(),
  };
  if (typeof selector === 'function') {
    return selector(state);
  }
  return state;
};

// Mock the UI store - use the implementation variable
jest.mock('@/lib/store/customer-store', () => ({
  useCustomerStore: jest.fn((selector) => mockUiStateImplementation(selector)), // Update hook name used inside mock
}));

// Mock the server action
jest.mock('@/app/actions', () => ({
  createSubscription: jest.fn(),
}));

// Mock the router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}));

// Mock child components if necessary (e.g., ApiPreviewDialog)
jest.mock('@/components/dialogs/api-preview-dialog', () => ({
  ApiPreviewDialog: () => <div data-testid="mock-api-preview">Mock API Preview</div>,
}));

describe('PlanSelectionDialog', () => {
  const mockCreateSubscription = createSubscription as jest.Mock;
  const mockOnClose = jest.fn();
  const mockOnSubscriptionSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the implementation to default before each test
    mockUiStateImplementation = (selector: (state: any) => any) => {
        const state = {
            pendingPlanId: PLAN_DETAILS[0].plan_id, 
            customerId: 'cus_123',
            externalCustomerId: 'test_customer', 
            setPendingPlanId: jest.fn(),
            setCustomerId: jest.fn(),
            setExternalCustomerId: jest.fn(),
            reset: jest.fn(),
        };
        if (typeof selector === 'function') { return selector(state); }
        return state;
    };
  });

  test('Subscribe Now button is disabled if customerId prop is missing/empty', () => {
    // Arrange: Set the mock implementation specifically for this test
    mockUiStateImplementation = (selector: (state: any) => any) => {
        const state = {
            pendingPlanId: PLAN_DETAILS[0].plan_id, // A plan must be selected
            customerId: null, // Simulate store state for logged out
            externalCustomerId: null,
            setPendingPlanId: jest.fn(),
            setCustomerId: jest.fn(),
            setExternalCustomerId: jest.fn(),
            reset: jest.fn(),
          };
          if (typeof selector === 'function') { return selector(state); }
          return state;
    };

    render(
      <PlanSelectionDialog
        isOpen={true}
        onClose={mockOnClose}
        onSubscriptionSuccess={mockOnSubscriptionSuccess}
        customerId="" // <-- Simulate logged-out state by passing empty string
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