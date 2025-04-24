import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PlanSelectionDialog } from '../plan-selection-dialog';
import { useCustomerStore } from '@/lib/store/customer-store';
import { createSubscription } from '@/app/actions';

// Mock the store
jest.mock('@/lib/store/customer-store', () => ({
  useCustomerStore: jest.fn()
}));

// Mock the Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn()
  })
}));

// Mock the server action
jest.mock('@/app/actions', () => ({
  createSubscription: jest.fn()
}));

// Mock the plan data
jest.mock('../../plans/plan-data', () => ({
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
    }
  ]
}));

// Mock the UI components
jest.mock('../../ui/dialog', () => ({
  Dialog: ({ children, open }: { children: React.ReactNode, open: boolean }) => (
    open ? <div data-testid="mock-dialog">{children}</div> : null
  ),
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock the Lucide icon
jest.mock('lucide-react', () => ({
  Loader2: () => <div>Loading...</div>
}));

// Mock the API preview dialog
jest.mock('../api-preview-dialog', () => ({
  ApiPreviewDialog: jest.fn(() => <button>Preview API Call</button>)
}));

// Mock the toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

describe('PlanSelectionDialog', () => {
  // Mock functions and props
  const mockOnClose = jest.fn();
  const mockOnPlanSelected = jest.fn();
  const mockOnSubscriptionSuccess = jest.fn();
  const mockAddSubscription = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default store setup with a logged-in user and pending plan
    (useCustomerStore as unknown as jest.Mock).mockReturnValue({
      customer: { id: 'cust_123', subscriptions: [] },
      pendingPlanId: 'nimbus_scale_basic',
      addSubscription: mockAddSubscription
    });
    
    // Mock successful subscription creation
    (createSubscription as jest.Mock).mockResolvedValue({
      success: true,
      subscription: {
        id: 'sub_123',
        plan_id: 'nimbus_scale_basic',
        status: 'active'
      }
    });
  });

  it('should display plan details when dialog is open with a pending plan', () => {
    render(
      <PlanSelectionDialog
        isOpen={true}
        onClose={mockOnClose}
        onPlanSelected={mockOnPlanSelected}
        onSubscriptionSuccess={mockOnSubscriptionSuccess}
      />
    );
    
    // Check that dialog is displayed with plan details
    expect(screen.getByText(/Basic Plan/i)).toBeInTheDocument();
  });

  it('should call proper callbacks on successful subscription', async () => {
    render(
      <PlanSelectionDialog
        isOpen={true}
        onClose={mockOnClose}
        onPlanSelected={mockOnPlanSelected}
        onSubscriptionSuccess={mockOnSubscriptionSuccess}
      />
    );
    
    // Find and click the subscribe button
    const subscribeButton = screen.getByRole('button', { name: /subscribe now/i });
    fireEvent.click(subscribeButton);
    
    // Wait for the async operations to complete
    await waitFor(() => {
      // Verify that server action was called
      expect(createSubscription).toHaveBeenCalledWith('cust_123', 'nimbus_scale_basic');
      
      // Verify subscription was added to store
      expect(mockAddSubscription).toHaveBeenCalled();
      
      // Verify callbacks were called
      expect(mockOnPlanSelected).toHaveBeenCalled();
      expect(mockOnSubscriptionSuccess).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
}); 