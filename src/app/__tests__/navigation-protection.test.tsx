import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useCustomerStore } from '@/lib/store/customer-store';
import { CustomerState } from '@/lib/store/customer-store';

// Mock React.use for handling async params in Next.js 15
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  use: jest.fn(),
}));

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

// Mock the new PricingPlans component path and props
jest.mock('@/components/plan-select/pricing-plans', () => ({
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
  const mockParams = Promise.resolve({ id: 'test_customer_123' });

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

    // Mock React.use to return resolved params
    const mockReact = jest.mocked(React);
    if (mockReact.use) {
      mockReact.use.mockImplementation((promise: any) => {
        if (promise === mockParams) {
          return { id: 'test_customer_123' };
        }
        return promise;
      });
    }
  });

  describe('/plan-select page', () => {
    // Import the page component inside tests to ensure mocks are set up
    let PlanSelectPage: React.ComponentType;
    
    beforeAll(async () => {
      // Dynamic import to ensure mocks are applied
      const pageModule = await import('../plan-select/page');
      PlanSelectPage = pageModule.default;
    });

    describe('when no instance is available', () => {
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

        // Wait for the redirect to happen (end result)
        await waitFor(() => {
          expect(mockPush).toHaveBeenCalledWith('/');
        }, { timeout: 1000 });

        // Should not render the main content
        expect(screen.queryByTestId('pricing-plans')).not.toBeInTheDocument();
      });
    });

    describe('when instance exists in localStorage but not in store', () => {
      const mockSetSelectedInstance = jest.fn();

      beforeEach(() => {
        // Mock store with no selected instance initially, but with setSelectedInstance
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

      test('restores instance from localStorage', async () => {
        render(<PlanSelectPage />);

        // Wait for the instance to be restored from localStorage (end result)
        await waitFor(() => {
          expect(mockSetSelectedInstance).toHaveBeenCalledWith('cloud-infra');
        }, { timeout: 1000 });

        // Should not redirect since instance was found
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

      test('renders pricing plans immediately', async () => {
        render(<PlanSelectPage />);

        // Should render the main content (end result)
        await waitFor(() => {
          expect(screen.getByTestId('pricing-plans')).toBeInTheDocument();
        }, { timeout: 1000 });

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

    describe('when no instance is available', () => {
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

        // Mock localStorage to return no data
        mockLocalStorage.getItem.mockReturnValue(null);
      });

      test('redirects to homepage', async () => {
        render(<CustomerDashboardPage params={mockParams} />);

        // Wait for the redirect to happen (end result)
        await waitFor(() => {
          expect(mockPush).toHaveBeenCalledWith('/');
        }, { timeout: 1000 });

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

      test('restores instance from localStorage', async () => {
        render(<CustomerDashboardPage params={mockParams} />);

        // Wait for the instance to be restored from localStorage (end result)
        await waitFor(() => {
          expect(mockSetSelectedInstance).toHaveBeenCalledWith('cloud-infra');
        }, { timeout: 1000 });

        expect(mockPush).not.toHaveBeenCalled();
      });
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

      test('renders customer dashboard immediately', async () => {
        render(<CustomerDashboardPage params={mockParams} />);

        // Should render the dashboard content (end result)
        await waitFor(() => {
          expect(screen.getByTestId('customer-dashboard')).toBeInTheDocument();
        }, { timeout: 1000 });

        expect(screen.getByText('Customer: test_customer_123, Instance: cloud-infra')).toBeInTheDocument();
        expect(mockPush).not.toHaveBeenCalled();
      });
    });
  });

  describe('localStorage error handling', () => {
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

      // Should handle error gracefully and redirect (end result)
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/');
      }, { timeout: 1000 });
    });
  });
}); 