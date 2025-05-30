import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PricingPlans } from '../pricing-plans';
import { PLAN_DETAILS } from '../plan-data';

// Mock Next.js router
const mockPush = jest.fn();
const mockRouter = {
  push: mockPush,
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

// Mock the customer store
const mockSetPendingPlanId = jest.fn();
const mockCustomerId = null; // Simulate no customer initially

jest.mock('@/lib/store/customer-store', () => ({
  useCustomerStore: jest.fn((selector) => {
    const mockState = {
      setPendingPlanId: mockSetPendingPlanId,
      customerId: mockCustomerId,
      selectedInstance: 'cloud-infra',
    };
    return selector(mockState);
  }),
}));

describe('PricingPlans Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockSetPendingPlanId.mockClear();
    mockPush.mockClear();
    jest.clearAllMocks();
  });

  test('calls setPendingPlanId with the correct plan ID when a standard plan card is selected', () => {
    render(<PricingPlans instance="cloud-infra" />);

    // Find the button for the first plan (e.g., Starter)
    const starterPlan = PLAN_DETAILS[0];
    
    // Find the select button by its text content
    const selectButton = screen.getByRole('button', { name: starterPlan.cta as string });
    
    fireEvent.click(selectButton);

    // Assert that the store action was called correctly
    expect(mockSetPendingPlanId).toHaveBeenCalledTimes(1);
    expect(mockSetPendingPlanId).toHaveBeenCalledWith(starterPlan.plan_id);
  });

  test('calls setPendingPlanId with the enterprise plan ID when the contact sales button is clicked', () => {
    render(<PricingPlans instance="cloud-infra" />);

    // Find the "Contact our sales team" button
    const contactButton = screen.getByRole('button', { name: /Contact our sales team/i });

    fireEvent.click(contactButton);

    // Assert that the store action was called correctly
    expect(mockSetPendingPlanId).toHaveBeenCalledTimes(1);
    expect(mockSetPendingPlanId).toHaveBeenCalledWith('nimbus_scale_enterprise');
  });
});
