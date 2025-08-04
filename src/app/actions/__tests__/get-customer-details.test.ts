// Mock the orb client before importing the function
jest.mock('@/lib/orb', () => ({
  createOrbClient: jest.fn(),
}));

import { getCustomerDetails } from '../orb';
import { createOrbClient } from '@/lib/orb';

const mockCreateOrbClient = createOrbClient as jest.MockedFunction<typeof createOrbClient>;

describe('getCustomerDetails', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should retrieve customer details successfully', async () => {
    // Arrange
    const mockCustomer = {
      id: 'cus_detailed_123',
      external_customer_id: 'detailed_customer_external',
      name: 'John Detailed Customer',
      email: 'john.detailed@example.com',
      portal_url: 'https://billing.example.com/portal/cus_detailed_123'
    };

    const mockOrbClient = {
      customers: {
        fetch: jest.fn().mockResolvedValue(mockCustomer)
      }
    };

    mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

    // Act
    const result = await getCustomerDetails('cus_detailed_123');

    // Assert
    expect(result).toEqual({
      success: true,
      customer: {
        id: 'cus_detailed_123',
        external_customer_id: 'detailed_customer_external',
        name: 'John Detailed Customer',
        email: 'john.detailed@example.com',
        portal_url: 'https://billing.example.com/portal/cus_detailed_123'
      }
    });

    expect(mockCreateOrbClient).toHaveBeenCalledWith('cloud-infra');
    expect(mockOrbClient.customers.fetch).toHaveBeenCalledWith('cus_detailed_123');
  });

  it('should use ai-agents instance when specified', async () => {
    // Arrange
    const mockCustomer = {
      id: 'cus_ai_detailed_456',
      external_customer_id: 'ai_detailed_external',
      name: 'AI Detailed User',
      email: 'ai.detailed@example.com',
      portal_url: 'https://ai-billing.example.com/portal/cus_ai_detailed_456'
    };

    const mockOrbClient = {
      customers: {
        fetch: jest.fn().mockResolvedValue(mockCustomer)
      }
    };

    mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

    // Act
    const result = await getCustomerDetails('cus_ai_detailed_456', 'ai-agents');

    // Assert
    expect(mockCreateOrbClient).toHaveBeenCalledWith('ai-agents');
    expect(result.success).toBe(true);
    expect(result.customer?.id).toBe('cus_ai_detailed_456');
  });

  it('should handle customer not found error', async () => {
    // Arrange
    const notFoundError = new Error('Customer not found');
    const mockOrbClient = {
      customers: {
        fetch: jest.fn().mockRejectedValue(notFoundError)
      }
    };

    mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

    // Act
    const result = await getCustomerDetails('cus_nonexistent');

    // Assert
    expect(result).toEqual({
      success: false,
      customer: null,
      error: 'Customer not found'
    });
  });

  it('should handle case when customer fetch returns null', async () => {
    // Arrange
    const mockOrbClient = {
      customers: {
        fetch: jest.fn().mockResolvedValue(null)
      }
    };

    mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

    // Act
    const result = await getCustomerDetails('cus_null_response');

    // Assert
    expect(result).toEqual({
      success: false,
      customer: null,
      error: 'Customer not found'
    });
  });

  it('should handle non-Error exceptions gracefully', async () => {
    // Arrange
    const mockOrbClient = {
      customers: {
        fetch: jest.fn().mockRejectedValue('Database connection timeout')
      }
    };

    mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

    // Act
    const result = await getCustomerDetails('cus_timeout_error');

    // Assert
    expect(result).toEqual({
      success: false,
      customer: null,
      error: 'Failed to fetch customer details'
    });
  });

  it('should detect "not found" errors regardless of case', async () => {
    // Arrange
    const caseInsensitiveError = new Error('Resource NOT FOUND in system');
    const mockOrbClient = {
      customers: {
        fetch: jest.fn().mockRejectedValue(caseInsensitiveError)
      }
    };

    mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

    // Act
    const result = await getCustomerDetails('cus_case_test');

    // Assert
    expect(result).toEqual({
      success: false,
      customer: null,
      error: 'Customer not found'
    });
  });

  it('should preserve original error message for non-404 errors', async () => {
    // Arrange
    const authError = new Error('Authentication failed - invalid API key');
    const mockOrbClient = {
      customers: {
        fetch: jest.fn().mockRejectedValue(authError)
      }
    };

    mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

    // Act
    const result = await getCustomerDetails('cus_auth_test');

    // Assert
    expect(result).toEqual({
      success: false,
      customer: null,
      error: 'Authentication failed - invalid API key'
    });
  });
});