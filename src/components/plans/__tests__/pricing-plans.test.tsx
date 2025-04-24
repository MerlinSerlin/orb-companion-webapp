import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PricingPlans } from '../pricing-plans';
import { useCustomerStore } from '@/lib/store/customer-store';

// Mock the store
jest.mock('@/lib/store/customer-store', () => ({
  useCustomerStore: jest.fn()
}));

// Mock the enterprise contact dialog
jest.mock('../../dialogs/enterprise-contact-dialog', () => ({
  EnterpriseContactDialog: jest.fn(({ open, onOpenChange }) => (
    <div data-testid="mock-enterprise-dialog">
      {open ? 'Dialog Open' : 'Dialog Closed'}
      <button onClick={() => onOpenChange(false)}>Close</button>
    </div>
  ))
}));

// Mock plan data
jest.mock('../plan-data', () => ({
  PLAN_DETAILS: [
    {
      name: 'Basic Plan',
      plan_id: 'nimbus_scale_basic',
      price: '$10',
      description: 'Perfect for getting started',
      features: [
        { name: 'API Calls', value: '1,000/month' },
        { name: 'Storage', value: '5GB' }
      ],
      cta: 'Select Plan'
    },
    {
      name: 'Enterprise Plan',
      plan_id: 'nimbus_scale_enterprise',
      price: 'Custom',
      description: 'For large organizations',
      features: [
        { name: 'API Calls', value: 'Unlimited' },
        { name: 'Storage', value: 'Unlimited' }
      ],
      cta: 'Contact Sales'
    }
  ]
}));

describe('PricingPlans', () => {
  // Mock functions and store setup
  const mockSetPendingPlanId = jest.fn();
  const mockOpenRegistration = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default store state (user not logged in)
    (useCustomerStore as unknown as jest.Mock).mockReturnValue({
      customer: null,
      pendingPlanId: null,
      setPendingPlanId: mockSetPendingPlanId
    });
  });

  it('should call openRegistration when a plan is selected and user is not logged in', () => {
    // Render the component
    render(<PricingPlans openRegistration={mockOpenRegistration} />);
    
    // Find and click the Basic plan button (using the first CTA button we find)
    const selectPlanButton = screen.getAllByRole('button', { name: /select plan/i })[0];
    fireEvent.click(selectPlanButton);
    
    // Check that setPendingPlanId was called
    expect(mockSetPendingPlanId).toHaveBeenCalled();
    
    // Check that openRegistration was called
    expect(mockOpenRegistration).toHaveBeenCalled();
  });

  it('should not call openRegistration when user is already logged in', () => {
    // Mock logged-in user
    (useCustomerStore as unknown as jest.Mock).mockReturnValue({
      customer: { id: 'cust_123', subscriptions: [] },
      pendingPlanId: null,
      setPendingPlanId: mockSetPendingPlanId
    });
    
    // Render the component
    render(<PricingPlans openRegistration={mockOpenRegistration} />);
    
    // Find and click the Basic plan button
    const selectPlanButton = screen.getAllByRole('button', { name: /select plan/i })[0];
    fireEvent.click(selectPlanButton);
    
    // Check that setPendingPlanId was called
    expect(mockSetPendingPlanId).toHaveBeenCalled();
    
    // Check that openRegistration was NOT called
    expect(mockOpenRegistration).not.toHaveBeenCalled();
  });
}); 