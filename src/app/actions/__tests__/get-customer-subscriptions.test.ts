// Mock the orb client before importing the function
jest.mock('@/lib/orb', () => ({
  createOrbClient: jest.fn(),
}));

import { getCustomerSubscriptions } from '../orb';
import { createOrbClient } from '@/lib/orb';

const mockCreateOrbClient = createOrbClient as jest.MockedFunction<typeof createOrbClient>;

describe('getCustomerSubscriptions', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should retrieve customer subscriptions successfully', async () => {
    // Arrange
    const mockOrbResponse = {
      data: [
        {
          id: 'sub_active_123',
          status: 'active',
          start_date: '2025-07-01',
          end_date: null,
          current_billing_period_start_date: '2025-07-01',
          current_billing_period_end_date: '2025-08-01',
          customer: {
            external_customer_id: 'john_doe_external'
          },
          plan: {
            name: 'Basic Monthly',
            currency: 'USD'
          },
          price_intervals: [
            {
              id: 'interval_123',
              start_date: '2025-07-01',
              end_date: null,
              price: {
                id: 'price_123',
                name: 'Monthly Base Fee',
                price_type: 'fixed_price'
              }
            }
          ]
        }
      ]
    };

    const mockOrbClient = {
      subscriptions: {
        list: jest.fn().mockResolvedValue(mockOrbResponse)
      }
    };

    mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

    // Act
    const result = await getCustomerSubscriptions('cus_12345');

    // Assert
    expect(result).toEqual({
      success: true,
      externalCustomerId: 'john_doe_external',
      subscriptions: [
        {
          id: 'sub_active_123',
          name: 'Basic Monthly',
          currency: 'USD',
          status: 'active',
          start_date: '2025-07-01',
          end_date: null,
          current_billing_period_start_date: '2025-07-01',
          current_billing_period_end_date: '2025-08-01',
          plan: mockOrbResponse.data[0].plan,
          price_intervals: mockOrbResponse.data[0].price_intervals
        }
      ]
    });

    expect(mockCreateOrbClient).toHaveBeenCalledWith('cloud-infra');
    expect(mockOrbClient.subscriptions.list).toHaveBeenCalledWith({
      customer_id: ['cus_12345']
    });
  });

  it('should return empty subscriptions when customer has no subscriptions', async () => {
    // Arrange
    const mockOrbResponse = {
      data: []
    };

    const mockOrbClient = {
      subscriptions: {
        list: jest.fn().mockResolvedValue(mockOrbResponse)
      }
    };

    mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

    // Act
    const result = await getCustomerSubscriptions('cus_no_subs');

    // Assert
    expect(result).toEqual({
      success: true,
      externalCustomerId: undefined,
      subscriptions: []
    });
  });

  it('should handle null or undefined subscription data gracefully', async () => {
    // Arrange
    const mockOrbResponse = {
      data: null
    };

    const mockOrbClient = {
      subscriptions: {
        list: jest.fn().mockResolvedValue(mockOrbResponse)
      }
    };

    mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

    // Act
    const result = await getCustomerSubscriptions('cus_null_data');

    // Assert
    expect(result).toEqual({
      success: true,
      externalCustomerId: undefined,
      subscriptions: []
    });
  });

  it('should use ai-agents instance when specified', async () => {
    // Arrange
    const mockOrbResponse = {
      data: [
        {
          id: 'sub_ai_agent_456',
          status: 'active',
          start_date: '2025-07-15',
          end_date: null,
          current_billing_period_start_date: '2025-07-15',
          current_billing_period_end_date: '2025-08-15',
          customer: {
            external_customer_id: 'ai_user_external'
          },
          plan: {
            name: 'AI Agent Premium',
            currency: 'USD'
          },
          price_intervals: []
        }
      ]
    };

    const mockOrbClient = {
      subscriptions: {
        list: jest.fn().mockResolvedValue(mockOrbResponse)
      }
    };

    mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

    // Act
    const result = await getCustomerSubscriptions('cus_ai_user', 'ai-agents');

    // Assert
    expect(mockCreateOrbClient).toHaveBeenCalledWith('ai-agents');
    expect(result.success).toBe(true);
    expect(result.subscriptions?.[0]?.id).toBe('sub_ai_agent_456');
  });

  it('should handle API errors when fetching subscriptions', async () => {
    // Arrange
    const apiError = new Error('Customer not found');
    const mockOrbClient = {
      subscriptions: {
        list: jest.fn().mockRejectedValue(apiError)
      }
    };

    mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

    // Act
    const result = await getCustomerSubscriptions('cus_nonexistent');

    // Assert
    expect(result).toEqual({
      success: false,
      error: 'Customer not found',
      subscriptions: null
    });
  });

  it('should handle non-Error exceptions when fetching subscriptions', async () => {
    // Arrange
    const mockOrbClient = {
      subscriptions: {
        list: jest.fn().mockRejectedValue('Network timeout')
      }
    };

    mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

    // Act
    const result = await getCustomerSubscriptions('cus_network_error');

    // Assert
    expect(result).toEqual({
      success: false,
      error: 'Failed to fetch subscriptions',
      subscriptions: null
    });
  });

  it('should extract external customer ID from first subscription when available', async () => {
    // Arrange
    const mockOrbResponse = {
      data: [
        {
          id: 'sub_first',
          status: 'active',
          start_date: '2025-07-01',
          end_date: null,
          current_billing_period_start_date: '2025-07-01',
          current_billing_period_end_date: '2025-08-01',
          customer: {
            external_customer_id: 'extracted_customer_id'
          },
          plan: {
            name: 'First Plan',
            currency: 'USD'
          },
          price_intervals: []
        },
        {
          id: 'sub_second',
          status: 'active',
          start_date: '2025-07-01',
          end_date: null,
          current_billing_period_start_date: '2025-07-01',
          current_billing_period_end_date: '2025-08-01',
          customer: {
            external_customer_id: 'should_be_ignored'
          },
          plan: {
            name: 'Second Plan',
            currency: 'USD'  
          },
          price_intervals: []
        }
      ]
    };

    const mockOrbClient = {
      subscriptions: {
        list: jest.fn().mockResolvedValue(mockOrbResponse)
      }
    };

    mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

    // Act
    const result = await getCustomerSubscriptions('cus_multiple_subs');

    // Assert
    expect(result.success).toBe(true);
    expect(result.externalCustomerId).toBe('extracted_customer_id');
    expect(result.subscriptions).toHaveLength(2);
  });
});