import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useCustomerStore } from '@/lib/store/customer-store';
import { CustomerState } from '@/lib/store/customer-store';

// Mock the customer store
jest.mock('@/lib/store/customer-store');

// Mock Next.js navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ 
    push: mockPush,
  })),
  usePathname: jest.fn(() => '/plan-select'),
}));

// Mock the components to avoid complex dependencies
jest.mock('@/components/ui/header', () => ({
  Header: () => <div data-testid="header">Header</div>,
}));

jest.mock('@/components/homepage/pricing-plans', () => ({
  PricingPlans: ({ instance }: { instance: string }) => (
    <div data-testid="pricing-plans">Pricing Plans for {instance}</div>
  ),
}));

jest.mock('@/components/customer-dashboard/dashboard-content', () => ({
  CustomerDashboardContent: ({ customerId, instance }: { customerId: string, instance: string }) => (
    <div data-testid="customer-dashboard">
      Customer: {customerId}, Instance: {instance}
    </div>
  ),
}));

// Create a mock localStorage that we can properly reset
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

describe('Navigation Protection', () => {
  const mockUseCustomerStore = useCustomerStore as jest.MockedFunction<typeof useCustomerStore>;

  beforeEach(() => {
    // Clear all mocks and reset localStorage properly
    jest.clearAllMocks();
    
    // Reset localStorage mock
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();
    mockLocalStorage.removeItem.mockClear();
    mockLocalStorage.clear.mockClear();
    
    // Replace localStorage with our clean mock
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });
    
    // Clear any timers that might be running
    jest.clearAllTimers();
  });

  afterEach(() => {
    // Clean up any running timers
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('/plan-select page', () => {
    // Import the page component inside tests to ensure mocks are set up
    let PlanSelectPage: React.ComponentType;
    
    beforeAll(async () => {
      // Use fake timers for consistent testing
      jest.useFakeTimers();
      // Dynamic import to ensure mocks are applied
      const pageModule = await import('../plan-select/page');
      PlanSelectPage = pageModule.default;
    });

    describe('when no instance is stored', () => {
      beforeEach(() => {
        // Mock store with no selected instance
        mockUseCustomerStore.mockImplementation((selector) => {
          const state: Partial<CustomerState> = {
            selectedInstance: null,
            setSelectedInstance: jest.fn(),
            customerId: null,
            externalCustomerId: null,
            logout: jest.fn(),
          };
          return typeof selector === 'function' ? selector(state as CustomerState) : state;
        });

        // Mock localStorage to return no data (user not logged in)
        mockLocalStorage.getItem.mockReturnValue(null);
      });

      test('redirects to homepage', async () => {
        render(<PlanSelectPage />);

        // Fast-forward timers to trigger the setTimeout
        jest.advanceTimersByTime(100);

        // Should redirect to homepage
        await waitFor(() => {
          expect(mockPush).toHaveBeenCalledWith('/');
        }, { timeout: 200 });

        // Should not render the main content
        expect(screen.queryByTestId('pricing-plans')).not.toBeInTheDocument();
      });
    });

    describe('when instance exists in localStorage but not in store', () => {
      const mockSetSelectedInstance = jest.fn();

      beforeEach(() => {
        // Mock store with no selected instance initially
        mockUseCustomerStore.mockImplementation((selector) => {
          const state: Partial<CustomerState> = {
            selectedInstance: null, // Not yet hydrated
            setSelectedInstance: mockSetSelectedInstance,
            customerId: null,
            externalCustomerId: null,
            logout: jest.fn(),
          };
          return typeof selector === 'function' ? selector(state as CustomerState) : state;
        });

        // Mock localStorage to have stored instance
        mockLocalStorage.getItem.mockReturnValue(
          JSON.stringify({
            state: {
              selectedInstance: 'cloud-infra',
              customerId: null,
              externalCustomerId: null,
            }
          })
        );
      });

      test('restores instance from localStorage and renders content', async () => {
        render(<PlanSelectPage />);

        // Fast-forward timers to trigger the setTimeout
        jest.advanceTimersByTime(100);

        // Should restore instance from localStorage
        await waitFor(() => {
          expect(mockSetSelectedInstance).toHaveBeenCalledWith('cloud-infra');
        }, { timeout: 200 });

        // Should not redirect
        expect(mockPush).not.toHaveBeenCalled();
      });
    });

    describe('when instance exists in store', () => {
      beforeEach(() => {
        mockUseCustomerStore.mockImplementation((selector) => {
          const state: Partial<CustomerState> = {
            selectedInstance: 'ai-agents',
            setSelectedInstance: jest.fn(),
            customerId: null,
            externalCustomerId: null,
            logout: jest.fn(),
          };
          return typeof selector === 'function' ? selector(state as CustomerState) : state;
        });
      });

      test('loads correctly and renders pricing plans', async () => {
        render(<PlanSelectPage />);

        // Should render the main content
        await waitFor(() => {
          expect(screen.getByTestId('pricing-plans')).toBeInTheDocument();
        });

        expect(screen.getByText('Pricing Plans for ai-agents')).toBeInTheDocument();
        expect(mockPush).not.toHaveBeenCalled();
      });
    });
  });

  describe('/customers/[id] page', () => {
    let CustomerDashboardPage: React.ComponentType<{ params: Promise<{ id: string }> }>;
    
    beforeAll(async () => {
      const dashboardModule = await import('../customers/[id]/page');
      CustomerDashboardPage = dashboardModule.default;
    });

    const mockParams = Promise.resolve({ id: 'test_customer_123' });

    describe('when no instance is stored', () => {
      beforeEach(() => {
        mockUseCustomerStore.mockImplementation((selector) => {
          const state: Partial<CustomerState> = {
            selectedInstance: null,
            setSelectedInstance: jest.fn(),
            customerId: null,
            externalCustomerId: null,
            logout: jest.fn(),
          };
          return typeof selector === 'function' ? selector(state as CustomerState) : state;
        });

        // Use the consistent mockLocalStorage pattern
        mockLocalStorage.getItem.mockReturnValue(null);
      });

      test.skip('redirects to homepage', async () => {
        render(<CustomerDashboardPage params={mockParams} />);

        // Fast-forward timers to trigger the setTimeout (customer dashboard uses 100ms timeout)
        jest.advanceTimersByTime(150);

        await waitFor(() => {
          expect(mockPush).toHaveBeenCalledWith('/');
        }, { timeout: 300 });

        expect(screen.queryByTestId('customer-dashboard')).not.toBeInTheDocument();
      });
    });

    describe('when instance exists in localStorage but not in store', () => {
      const mockSetSelectedInstance = jest.fn();

      beforeEach(() => {
        mockUseCustomerStore.mockImplementation((selector) => {
          const state: Partial<CustomerState> = {
            selectedInstance: null,
            setSelectedInstance: mockSetSelectedInstance,
            customerId: null,
            externalCustomerId: null,
            logout: jest.fn(),
          };
          return typeof selector === 'function' ? selector(state as CustomerState) : state;
        });

        // Use the consistent mockLocalStorage pattern
        mockLocalStorage.getItem.mockReturnValue(
          JSON.stringify({
            state: {
              selectedInstance: 'cloud-infra',
              customerId: null,
              externalCustomerId: null,
            }
          })
        );
      });

      test.skip('restores instance from localStorage and renders dashboard', async () => {
        render(<CustomerDashboardPage params={mockParams} />)

        // Fast-forward timers to trigger the setTimeout
        jest.advanceTimersByTime(150)

        await waitFor(() => {
          expect(mockSetSelectedInstance).toHaveBeenCalledWith('cloud-infra')
        }, { timeout: 200 })

        expect(mockPush).not.toHaveBeenCalled()
      })
    });

    describe('when instance exists in store', () => {
      beforeEach(() => {
        mockUseCustomerStore.mockImplementation((selector) => {
          const state: Partial<CustomerState> = {
            selectedInstance: 'cloud-infra',
            setSelectedInstance: jest.fn(),
            customerId: null,
            externalCustomerId: null,
            logout: jest.fn(),
          };
          return typeof selector === 'function' ? selector(state as CustomerState) : state;
        });
      });

      test('loads correctly and renders customer dashboard', async () => {
        render(<CustomerDashboardPage params={mockParams} />);

        await waitFor(() => {
          expect(screen.getByTestId('customer-dashboard')).toBeInTheDocument();
        });

        expect(screen.getByText('Customer: test_customer_123, Instance: cloud-infra')).toBeInTheDocument();
        expect(mockPush).not.toHaveBeenCalled();
      });
    });
  });

  describe('localStorage parsing edge cases', () => {
    let PlanSelectPage: React.ComponentType;
    
    beforeAll(async () => {
      const pageModule = await import('../plan-select/page');
      PlanSelectPage = pageModule.default;
    });

    test('handles corrupted localStorage gracefully', async () => {
      mockUseCustomerStore.mockImplementation((selector) => {
        const state: Partial<CustomerState> = {
          selectedInstance: null,
          setSelectedInstance: jest.fn(),
          customerId: null,
          externalCustomerId: null,
          logout: jest.fn(),
        };
        return typeof selector === 'function' ? selector(state as CustomerState) : state;
      });

      // Mock corrupted JSON in localStorage
      mockLocalStorage.getItem.mockReturnValue('invalid json{');

      render(<PlanSelectPage />);

      // Fast-forward timers to trigger the setTimeout
      jest.advanceTimersByTime(100);

      // Should handle error gracefully and redirect
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/');
      }, { timeout: 200 });
    });
  });
}); 