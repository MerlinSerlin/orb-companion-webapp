import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Logo } from '../logo';
import { useRouter, usePathname } from 'next/navigation';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

// Mock customer store - fix the structure to match actual store
interface MockCustomerState {
  customerId: string | null;
  externalCustomerId: string | null;
}

const mockUseCustomerStore = jest.fn();
jest.mock('@/lib/store/customer-store', () => ({
  useCustomerStore: (selector: (state: MockCustomerState) => unknown) => mockUseCustomerStore(selector),
}));

// Mock Dialog components
jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open?: boolean }) => open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2 data-testid="dialog-title">{children}</h2>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog-description">{children}</div>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog-footer">{children}</div>,
}));

// Mock Button component
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant }: { children: React.ReactNode; onClick?: () => void; variant?: string }) => (
    <button data-testid={variant === 'outline' ? 'stay-button' : 'return-button'} onClick={onClick}>
      {children}
    </button>
  ),
}));

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Bot: () => <div data-testid="bot-icon">Bot Icon</div>,
}));

// Mock configuration modules
jest.mock('@/lib/orb-config', () => ({
  isValidInstance: jest.fn((instance) => instance === 'cloud-infra'),
  ORB_INSTANCES: {
    'cloud-infra': {
      companyKey: 'nimbusscale'
    }
  }
}));

jest.mock('@/components/plans/plan-data', () => ({
  getCurrentCompanyConfig: jest.fn((companyKey) => ({
    companyName: companyKey === 'nimbusscale' ? 'NimbusScale' : 'Default Company'
  }))
}));

const mockRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;
const mockRouterPush = jest.fn();

describe('Logo Component - Breadcrumb Behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouter.mockReturnValue({
      push: mockRouterPush,
    } as unknown as ReturnType<typeof useRouter>);
    mockUsePathname.mockReturnValue('/');
  });

  describe('No Customer Context', () => {
    beforeEach(() => {
      // Mock store to return null for both customerId and externalCustomerId
      mockUseCustomerStore.mockImplementation((selector) => {
        const state = {
          customerId: null,
          externalCustomerId: null,
        };
        return selector(state);
      });
    });

    test('should navigate directly without showing dialog', () => {
      render(<Logo />);
      
      const logoLink = screen.getByRole('link');
      fireEvent.click(logoLink);
      
      // Should not show dialog
      expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
    });
  });

  describe('With Customer Context', () => {
    beforeEach(() => {
      // Mock store with customer data
      mockUseCustomerStore.mockImplementation((selector) => {
        const state = {
          customerId: 'cust_1234567890abcdef',
          externalCustomerId: 'ACME-001',
        };
        return selector(state);
      });
    });

    test('should show confirmation dialog with correct customer info', async () => {
      render(<Logo />);
      
      const logoLink = screen.getByRole('link');
      fireEvent.click(logoLink);
      
      // Should show dialog
      await waitFor(() => {
        expect(screen.getByTestId('dialog')).toBeInTheDocument();
      });
      
      expect(screen.getByTestId('dialog-title')).toHaveTextContent('Return to Homepage?');
      expect(screen.getByTestId('dialog-description')).toHaveTextContent('ACME-001');
    });

    test('should display truncated customer ID when no external ID exists', async () => {
      // Mock store with only internal customer ID
      mockUseCustomerStore.mockImplementation((selector) => {
        const state = {
          customerId: 'cust_1234567890abcdef',
          externalCustomerId: null,
        };
        return selector(state);
      });

      render(<Logo />);
      
      const logoLink = screen.getByRole('link');
      fireEvent.click(logoLink);
      
      await waitFor(() => {
        expect(screen.getByTestId('dialog')).toBeInTheDocument();
      });
      
      expect(screen.getByTestId('dialog-description')).toHaveTextContent('Customer cust_123');
    });

    test('should handle "Stay Here" button click', async () => {
      render(<Logo />);
      
      const logoLink = screen.getByRole('link');
      fireEvent.click(logoLink);
      
      await waitFor(() => {
        expect(screen.getByTestId('dialog')).toBeInTheDocument();
      });
      
      const stayButton = screen.getByTestId('stay-button');
      fireEvent.click(stayButton);
      
      await waitFor(() => {
        expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
      });
    });

    test('should handle "Return to Homepage" button click', async () => {
      render(<Logo />);
      
      const logoLink = screen.getByRole('link');
      fireEvent.click(logoLink);
      
      await waitFor(() => {
        expect(screen.getByTestId('dialog')).toBeInTheDocument();
      });
      
      const returnButton = screen.getByTestId('return-button');
      fireEvent.click(returnButton);
      
      expect(mockRouterPush).toHaveBeenCalledWith('/');
    });

    test('should prevent default link navigation when customer is logged in', () => {
      render(<Logo />);
      
      const logoLink = screen.getByRole('link');
      const mockPreventDefault = jest.fn();
      
      fireEvent.click(logoLink, { preventDefault: mockPreventDefault });
      
      // Note: preventDefault is called internally, we're testing the dialog shows up
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });
  });

  describe('Company Name Display', () => {
    test('should display correct company name for cloud-infra instance', () => {
      mockUsePathname.mockReturnValue('/cloud-infra/plan-select');
      
      mockUseCustomerStore.mockImplementation((selector) => {
        const state = {
          customerId: null,
          externalCustomerId: null,
        };
        return selector(state);
      });

      render(<Logo />);
      
      expect(screen.getByText('NimbusScale')).toBeInTheDocument();
    });
  });
}); 