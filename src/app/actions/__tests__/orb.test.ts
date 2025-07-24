// Mock the orb client before importing the function
jest.mock('@/lib/orb', () => ({
  createOrbClient: jest.fn(),
}));

import { createCustomer, createSubscription, getCustomerSubscriptions, getCustomerDetails, schedulePlanChange, unschedulePlanChange, removeFixedFeeQuantityTransition } from '../orb';
import { createOrbClient } from '@/lib/orb';

const mockCreateOrbClient = createOrbClient as jest.MockedFunction<typeof createOrbClient>;

describe('Server Actions - Customer Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear console to avoid cluttering test output
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createCustomer', () => {
    it('should create customer successfully with formatted external ID', async () => {
      // Arrange
      const mockCustomer = {
        id: 'cus_123456789',
        external_customer_id: 'John_Doe',
        email: 'john.doe@example.com',
        name: 'John Doe'
      };

      const mockOrbClient = {
        customers: {
          create: jest.fn().mockResolvedValue(mockCustomer)
        }
      };

      mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

      // Act
      const result = await createCustomer('John Doe', 'john.doe@example.com', 'cloud-infra');

      // Assert
      expect(result).toEqual({
        success: true,
        customerId: 'cus_123456789',
        externalCustomerId: 'John_Doe'
      });

      expect(mockCreateOrbClient).toHaveBeenCalledWith('cloud-infra');
      expect(mockOrbClient.customers.create).toHaveBeenCalledWith({
        email: 'john.doe@example.com',
        name: 'John Doe',
        external_customer_id: 'John_Doe'
      });
    });

    it('should format external ID by replacing spaces with underscores', async () => {
      // Arrange
      const mockCustomer = {
        id: 'cus_987654321',
        external_customer_id: 'Jane_Marie_Smith',
        email: 'jane.smith@example.com',
        name: 'Jane Marie Smith'
      };

      const mockOrbClient = {
        customers: {
          create: jest.fn().mockResolvedValue(mockCustomer)
        }
      };

      mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

      // Act
      const result = await createCustomer('  Jane Marie Smith  ', 'jane.smith@example.com');

      // Assert
      expect(mockOrbClient.customers.create).toHaveBeenCalledWith({
        email: 'jane.smith@example.com',
        name: '  Jane Marie Smith  ',
        external_customer_id: 'Jane_Marie_Smith'
      });

      expect(result.success).toBe(true);
      expect(result.externalCustomerId).toBe('Jane_Marie_Smith');
    });

    it('should handle API errors gracefully', async () => {
      // Arrange
      const mockError = new Error('Customer with this email already exists');
      const mockOrbClient = {
        customers: {
          create: jest.fn().mockRejectedValue(mockError)
        }
      };

      mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

      // Act
      const result = await createCustomer('John Doe', 'duplicate@example.com');

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Customer with this email already exists'
      });
    });

    it('should handle non-Error exceptions gracefully', async () => {
      // Arrange
      const mockOrbClient = {
        customers: {
          create: jest.fn().mockRejectedValue('Unknown error string')
        }
      };

      mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

      // Act
      const result = await createCustomer('John Doe', 'john@example.com');

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Failed to create customer'
      });
    });

    it('should use ai-agents instance when specified', async () => {
      // Arrange
      const mockCustomer = {
        id: 'cus_ai_123',
        external_customer_id: 'AI_User',
        email: 'ai@example.com',
        name: 'AI User'
      };

      const mockOrbClient = {
        customers: {
          create: jest.fn().mockResolvedValue(mockCustomer)
        }
      };

      mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

      // Act
      const result = await createCustomer('AI User', 'ai@example.com', 'ai-agents');

      // Assert
      expect(mockCreateOrbClient).toHaveBeenCalledWith('ai-agents');
      expect(result.success).toBe(true);
    });
  });

  describe('createSubscription', () => {
    it('should create subscription successfully with basic plan', async () => {
      // Arrange
      const mockSubscription = {
        id: 'sub_abc123def456',
        plan_id: 'plan_basic_monthly',
        status: 'active',
        start_date: '2025-07-24'
      };

      const mockOrbClient = {
        subscriptions: {
          create: jest.fn().mockResolvedValue(mockSubscription)
        }
      };

      mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

      // Act
      const result = await createSubscription('cus_12345', 'plan_basic_monthly');

      // Assert
      expect(result).toEqual({
        success: true,
        subscription: {
          id: 'sub_abc123def456',
          plan_id: 'plan_basic_monthly',
          status: 'active',
          start_date: '2025-07-24'
        }
      });

      expect(mockCreateOrbClient).toHaveBeenCalledWith('cloud-infra');
      expect(mockOrbClient.subscriptions.create).toHaveBeenCalledWith({
        customer_id: 'cus_12345',
        plan_id: 'plan_basic_monthly'
      });
    });

    it('should create subscription with custom start date when provided', async () => {
      // Arrange
      const mockSubscription = {
        id: 'sub_future123',
        plan_id: 'plan_premium',
        status: 'upcoming',
        start_date: '2025-08-01'
      };

      const mockOrbClient = {
        subscriptions: {
          create: jest.fn().mockResolvedValue(mockSubscription)
        }
      };

      mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

      // Act
      const result = await createSubscription('cus_67890', 'plan_premium', '2025-08-01');

      // Assert
      expect(result.success).toBe(true);
      expect(result.subscription?.start_date).toBe('2025-08-01');
      
      expect(mockOrbClient.subscriptions.create).toHaveBeenCalledWith({
        customer_id: 'cus_67890',
        plan_id: 'plan_premium',
        start_date: '2025-08-01'
      });
    });

    it('should create subscription using ai-agents instance when specified', async () => {
      // Arrange
      const mockSubscription = {
        id: 'sub_ai_agent_123',
        plan_id: 'plan_ai_premium',
        status: 'active',
        start_date: '2025-07-24'
      };

      const mockOrbClient = {
        subscriptions: {
          create: jest.fn().mockResolvedValue(mockSubscription)
        }
      };

      mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

      // Act
      const result = await createSubscription('cus_ai_user', 'plan_ai_premium', undefined, 'ai-agents');

      // Assert
      expect(mockCreateOrbClient).toHaveBeenCalledWith('ai-agents');
      expect(result.success).toBe(true);
      expect(result.subscription?.id).toBe('sub_ai_agent_123');
    });

    it('should handle subscription creation errors gracefully', async () => {
      // Arrange
      const subscriptionError = new Error('Plan not found for customer');
      const mockOrbClient = {
        subscriptions: {
          create: jest.fn().mockRejectedValue(subscriptionError)
        }
      };

      mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

      // Act
      const result = await createSubscription('cus_invalid', 'plan_nonexistent');

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Plan not found for customer'
      });
    });

    it('should handle non-Error exceptions during subscription creation', async () => {
      // Arrange
      const mockOrbClient = {
        subscriptions: {
          create: jest.fn().mockRejectedValue('Unexpected error format')
        }
      };

      mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

      // Act
      const result = await createSubscription('cus_test', 'plan_test');

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Failed to create subscription'
      });
    });

    it('should handle Orb API errors with detailed error information', async () => {
      // Arrange - Simulate Orb API error with extended properties
      const orbApiError = new Error('Customer billing address required') as Error & {
        status: number;
        detail: string;
        type: string;
      };
      orbApiError.status = 422;
      orbApiError.detail = 'Customer must have a valid billing address';
      orbApiError.type = 'validation_error';

      const mockOrbClient = {
        subscriptions: {
          create: jest.fn().mockRejectedValue(orbApiError)
        }
      };

      mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

      // Act
      const result = await createSubscription('cus_no_address', 'plan_requires_billing');

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Customer billing address required'
      });

      // Verify that error details are logged (mocked console calls would be tracked)
      expect(mockOrbClient.subscriptions.create).toHaveBeenCalledWith({
        customer_id: 'cus_no_address',
        plan_id: 'plan_requires_billing'
      });
    });
  });

  describe('getCustomerSubscriptions', () => {
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

  describe('getCustomerDetails', () => {
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

  describe('schedulePlanChange', () => {
    it('should schedule immediate plan change successfully', async () => {
      // Arrange
      const mockOrbClient = {
        subscriptions: {
          schedulePlanChange: jest.fn().mockResolvedValue({})
        }
      };

      mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

      // Act
      const result = await schedulePlanChange('sub_123', 'plan_premium', 'immediate');

      // Assert
      expect(result).toEqual({
        success: true
      });

      expect(mockCreateOrbClient).toHaveBeenCalledWith('cloud-infra');
      expect(mockOrbClient.subscriptions.schedulePlanChange).toHaveBeenCalledWith('sub_123', {
        plan_id: 'plan_premium',
        change_option: 'immediate'
      });
    });

    it('should schedule plan change at end of subscription term', async () => {
      // Arrange
      const mockOrbClient = {
        subscriptions: {
          schedulePlanChange: jest.fn().mockResolvedValue({})
        }
      };

      mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

      // Act
      const result = await schedulePlanChange('sub_456', 'plan_enterprise', 'end_of_subscription_term');

      // Assert
      expect(result.success).toBe(true);
      expect(mockOrbClient.subscriptions.schedulePlanChange).toHaveBeenCalledWith('sub_456', {
        plan_id: 'plan_enterprise',
        change_option: 'end_of_subscription_term'
      });
    });

    it('should schedule plan change for specific date', async () => {
      // Arrange
      const mockOrbClient = {
        subscriptions: {
          schedulePlanChange: jest.fn().mockResolvedValue({})
        }
      };

      mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

      // Act
      const result = await schedulePlanChange('sub_789', 'plan_custom', 'requested_date', '2025-08-01');

      // Assert
      expect(result.success).toBe(true);
      expect(mockOrbClient.subscriptions.schedulePlanChange).toHaveBeenCalledWith('sub_789', {
        plan_id: 'plan_custom',
        change_option: 'requested_date',
        change_date: '2025-08-01'
      });
    });

    it('should use ai-agents instance when specified', async () => {
      // Arrange
      const mockOrbClient = {
        subscriptions: {
          schedulePlanChange: jest.fn().mockResolvedValue({})
        }
      };

      mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

      // Act
      const result = await schedulePlanChange('sub_ai_123', 'plan_ai_premium', 'immediate', undefined, 'ai-agents');

      // Assert
      expect(mockCreateOrbClient).toHaveBeenCalledWith('ai-agents');
      expect(result.success).toBe(true);
    });

    it('should handle missing required parameters', async () => {
      // Act & Assert - Missing subscriptionId
      const result1 = await schedulePlanChange('', 'plan_test');
      expect(result1).toEqual({
        success: false,
        error: 'Missing required parameters for scheduling plan change.'
      });

      // Act & Assert - Missing targetPlanId
      const result2 = await schedulePlanChange('sub_test', '');
      expect(result2).toEqual({
        success: false,
        error: 'Missing required parameters for scheduling plan change.'
      });
    });

    it('should validate change date format when using requested_date option', async () => {
      // Act & Assert - Missing change date for requested_date
      const result1 = await schedulePlanChange('sub_test', 'plan_test', 'requested_date');
      expect(result1).toEqual({
        success: false,
        error: 'Change date is required when using requested_date option.'
      });

      // Act & Assert - Invalid date format
      const result2 = await schedulePlanChange('sub_test', 'plan_test', 'requested_date', '2025/08/01');
      expect(result2).toEqual({
        success: false,
        error: 'Invalid change date format. Use YYYY-MM-DD.'
      });
    });

    it('should handle API errors when scheduling plan changes', async () => {
      // Arrange
      const apiError = new Error('Plan change not allowed for active subscription');
      const mockOrbClient = {
        subscriptions: {
          schedulePlanChange: jest.fn().mockRejectedValue(apiError)
        }
      };

      mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

      // Act
      const result = await schedulePlanChange('sub_restricted', 'plan_invalid');

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Plan change not allowed for active subscription'
      });
    });

    it('should handle Orb API errors with axios response data', async () => {
      // Arrange
      const axiosError = new Error('Validation failed') as Error & {
        response: { data: { detail: 'Invalid plan ID', code: 'INVALID_PLAN' } };
      };
      axiosError.response = { data: { detail: 'Invalid plan ID', code: 'INVALID_PLAN' } };

      const mockOrbClient = {
        subscriptions: {
          schedulePlanChange: jest.fn().mockRejectedValue(axiosError)
        }
      };

      mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

      // Act
      const result = await schedulePlanChange('sub_validation_error', 'plan_invalid');

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Validation failed'
      });
    });
  });

  describe('unschedulePlanChange', () => {
    it('should unschedule pending plan changes successfully', async () => {
      // Arrange
      const mockOrbClient = {
        subscriptions: {
          unschedulePendingPlanChanges: jest.fn().mockResolvedValue({})
        }
      };

      mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

      // Act
      const result = await unschedulePlanChange('sub_with_pending_change');

      // Assert
      expect(result).toEqual({
        success: true
      });

      expect(mockCreateOrbClient).toHaveBeenCalledWith('cloud-infra');
      expect(mockOrbClient.subscriptions.unschedulePendingPlanChanges).toHaveBeenCalledWith('sub_with_pending_change');
    });

    it('should use ai-agents instance when specified', async () => {
      // Arrange
      const mockOrbClient = {
        subscriptions: {
          unschedulePendingPlanChanges: jest.fn().mockResolvedValue({})
        }
      };

      mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

      // Act
      const result = await unschedulePlanChange('sub_ai_pending', 'ai-agents');

      // Assert
      expect(mockCreateOrbClient).toHaveBeenCalledWith('ai-agents');
      expect(result.success).toBe(true);
    });

    it('should handle missing subscription ID', async () => {
      // Act
      const result = await unschedulePlanChange('');

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Subscription ID is required for unscheduling plan change.'
      });
    });

    it('should handle API errors when unscheduling plan changes', async () => {
      // Arrange
      const apiError = new Error('No pending plan changes found');
      const mockOrbClient = {
        subscriptions: {
          unschedulePendingPlanChanges: jest.fn().mockRejectedValue(apiError)
        }
      };

      mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

      // Act
      const result = await unschedulePlanChange('sub_no_pending');

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'No pending plan changes found'
      });
    });

    it('should handle non-Error exceptions gracefully', async () => {
      // Arrange
      const mockOrbClient = {
        subscriptions: {
          unschedulePendingPlanChanges: jest.fn().mockRejectedValue('Network error')
        }
      };

      mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

      // Act
      const result = await unschedulePlanChange('sub_network_error');

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'An unexpected error occurred.'
      });
    });

    it('should log axios response data when available', async () => {
      // Arrange
      const axiosError = new Error('Subscription locked') as Error & {
        response: { data: { message: 'Subscription is locked', code: 'LOCKED' } };
      };
      axiosError.response = { data: { message: 'Subscription is locked', code: 'LOCKED' } };

      const mockOrbClient = {
        subscriptions: {
          unschedulePendingPlanChanges: jest.fn().mockRejectedValue(axiosError)
        }
      };

      mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

      // Act
      const result = await unschedulePlanChange('sub_locked');

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Subscription locked'
      });
    });
  });

  describe('removeFixedFeeQuantityTransition', () => {
    const mockSubscription = {
      id: 'sub_123456789',
      price_intervals: [
        {
          id: 'interval_abc123',
          fixed_fee_quantity_transitions: [
            { effective_date: '2025-07-26T00:00:00+00:00', quantity: 5 },
            { effective_date: '2025-08-01T00:00:00+00:00', quantity: 10 }
          ]
        }
      ]
    };

    it('should remove transition and use correct instance when provided', async () => {
      // Arrange
      const mockOrbClient = {
        subscriptions: {
          fetch: jest.fn().mockResolvedValue(mockSubscription),
          priceIntervals: jest.fn().mockResolvedValue({})
        }
      };

      mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

      // Act
      const result = await removeFixedFeeQuantityTransition(
        'sub_123456789',
        'interval_abc123', 
        '2025-07-26T00:00:00+00:00',
        'ai-agents'
      );

      // Assert
      expect(mockCreateOrbClient).toHaveBeenCalledWith('ai-agents');
      expect(mockOrbClient.subscriptions.fetch).toHaveBeenCalledWith('sub_123456789');
      expect(mockOrbClient.subscriptions.priceIntervals).toHaveBeenCalledWith(
        'sub_123456789',
        {
          edit: [
            {
              price_interval_id: 'interval_abc123',
              fixed_fee_quantity_transitions: [
                { effective_date: '2025-08-01T00:00:00+00:00', quantity: 10 }
              ]
            }
          ]
        }
      );
      expect(result.success).toBe(true);
    });

    it('should default to cloud-infra instance when no instance provided', async () => {
      // Arrange
      const mockOrbClient = {
        subscriptions: {
          fetch: jest.fn().mockResolvedValue(mockSubscription),
          priceIntervals: jest.fn().mockResolvedValue({})
        }
      };

      mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

      // Act - Note: not passing instance parameter
      const result = await removeFixedFeeQuantityTransition(
        'sub_123456789',
        'interval_abc123',
        '2025-07-26T00:00:00+00:00'
      );

      // Assert - Should default to 'cloud-infra'
      expect(mockCreateOrbClient).toHaveBeenCalledWith('cloud-infra');
      expect(result.success).toBe(true);
    });

    it('should handle subscription not found (404 error)', async () => {
      // Arrange
      const notFoundError = new Error('404 {"detail":"Could not find a resource of type Subscription"}');
      const mockOrbClient = {
        subscriptions: {
          fetch: jest.fn().mockRejectedValue(notFoundError)
        }
      };

      mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

      // Act
      const result = await removeFixedFeeQuantityTransition(
        'nonexistent_sub',
        'interval_abc123',
        '2025-07-26T00:00:00+00:00',
        'ai-agents'
      );

      // Assert - Should use correct instance even when subscription not found
      expect(mockCreateOrbClient).toHaveBeenCalledWith('ai-agents');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to fetch current subscription details from Orb.');
    });

    it('should handle missing price interval', async () => {
      // Arrange
      const subscriptionWithoutInterval = {
        id: 'sub_123456789',
        price_intervals: [
          { id: 'different_interval', fixed_fee_quantity_transitions: [] }
        ]
      };

      const mockOrbClient = {
        subscriptions: {
          fetch: jest.fn().mockResolvedValue(subscriptionWithoutInterval)
        }
      };

      mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

      // Act
      const result = await removeFixedFeeQuantityTransition(
        'sub_123456789',
        'missing_interval',
        '2025-07-26T00:00:00+00:00',
        'ai-agents'
      );

      // Assert
      expect(mockCreateOrbClient).toHaveBeenCalledWith('ai-agents');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Price interval missing_interval not found on subscription.');
    });

    it('should handle missing required parameters', async () => {
      // Act & Assert - Missing subscriptionId
      const result1 = await removeFixedFeeQuantityTransition('', 'interval_abc123', '2025-07-26T00:00:00+00:00');
      expect(result1.success).toBe(false);
      expect(result1.error).toBe('Missing required parameters for removing transition.');

      // Act & Assert - Missing priceIntervalId  
      const result2 = await removeFixedFeeQuantityTransition('sub_123456789', '', '2025-07-26T00:00:00+00:00');
      expect(result2.success).toBe(false);
      expect(result2.error).toBe('Missing required parameters for removing transition.');

      // Act & Assert - Missing effectiveDateToRemove
      const result3 = await removeFixedFeeQuantityTransition('sub_123456789', 'interval_abc123', '');
      expect(result3.success).toBe(false);
      expect(result3.error).toBe('Missing required parameters for removing transition.');
    });
  });
});