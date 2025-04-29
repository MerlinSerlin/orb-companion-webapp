import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PricingPlans } from '../pricing-plans';
import { PLAN_DETAILS } from '../plan-data';

// Mock the UI store
const mockSetPendingPlanId = jest.fn();
jest.mock('@/lib/store/customer-store', () => ({
  useCustomerStore: jest.fn((selector) => {
    // Simulate the selector logic for setPendingPlanId
    if (selector.toString().includes('state.setPendingPlanId')) {
      return mockSetPendingPlanId;
    }
    // Add default returns for other potential selectors if needed
    return jest.fn(); 
  }),
}));

describe('PricingPlans Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockSetPendingPlanId.mockClear();
    // Clear the mock implementation of the hook itself
    jest.clearAllMocks(); // This clears all mocks, including useUiStore
    // (useUiStore as jest.Mock).mockClear(); // <-- Incorrect type casting
  });

  test('calls setPendingPlanId with the correct plan ID when a standard plan card is selected', () => {
    render(<PricingPlans />);

    // Find the button for the first plan (e.g., Starter)
    const starterPlan = PLAN_DETAILS[0];
    // Assuming the CTA text is unique enough or we target based on structure/test-id
    // Let's find the button within the card that has the starter plan name
    const starterCard = screen.getByText(starterPlan.name).closest('div.relative > div > *'); // Adjust selector based on actual DOM
    if (!starterCard) throw new Error(`Could not find card for plan: ${starterPlan.name}`);

    const selectButton = screen.getByRole('button', { name: starterPlan.cta as string }); // Find button by CTA text
    
    fireEvent.click(selectButton);

    // Assert that the store action was called correctly
    expect(mockSetPendingPlanId).toHaveBeenCalledTimes(1);
    expect(mockSetPendingPlanId).toHaveBeenCalledWith(starterPlan.plan_id);
  });

  test('calls setPendingPlanId with the enterprise plan ID when the contact sales button is clicked', () => {
    render(<PricingPlans />);

    // Find the "Contact our sales team" button
    const contactButton = screen.getByRole('button', { name: /Contact our sales team/i });

    fireEvent.click(contactButton);

    // Assert that the store action was called correctly
    expect(mockSetPendingPlanId).toHaveBeenCalledTimes(1);
    expect(mockSetPendingPlanId).toHaveBeenCalledWith('nimbus_scale_enterprise');
  });
});
