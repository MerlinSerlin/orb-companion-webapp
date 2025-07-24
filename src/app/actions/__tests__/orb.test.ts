// Mock the orb client before importing the function
jest.mock('@/lib/orb', () => ({
  createOrbClient: jest.fn(),
}));

import { createCustomer, createSubscription, getCustomerSubscriptions, getCustomerDetails, schedulePlanChange, unschedulePlanChange, removeFixedFeeQuantityTransition, editFixedFeeQuantityTransitions, addPriceInterval, editPriceIntervalSchedule, getPriceDetails, type PriceIntervalScheduleEdit } from '../orb';
import { createOrbClient } from '@/lib/orb';
import { ORB_INSTANCES } from '@/lib/orb-config';
import type { FixedFeeQuantityTransition } from '@/lib/types';

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

  describe('editFixedFeeQuantityTransitions', () => {
    it('should successfully edit fixed fee quantity transitions', async () => {
      // Arrange
      const mockOrbClient = {
        subscriptions: {
          priceIntervals: jest.fn().mockResolvedValue({})
        }
      };

      mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

      const transitions = [
        { quantity: 5, effective_date: '2025-08-01' },
        { quantity: 10, effective_date: '2025-09-01' }
      ];

      // Act
      const result = await editFixedFeeQuantityTransitions('sub_transition_test', 'interval_abc123', transitions);

      // Assert
      expect(result.success).toBe(true);
      expect(mockCreateOrbClient).toHaveBeenCalledWith('cloud-infra');
      expect(mockOrbClient.subscriptions.priceIntervals).toHaveBeenCalledWith('sub_transition_test', {
        edit: [{
          price_interval_id: 'interval_abc123',
          fixed_fee_quantity_transitions: transitions
        }]
      });
    });

    it('should successfully edit fixed fee quantity transitions for ai-agents instance', async () => {
      // Arrange
      const mockOrbClient = {
        subscriptions: {
          priceIntervals: jest.fn().mockResolvedValue({})
        }
      };

      mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

      const transitions = [
        { quantity: 3, effective_date: '2025-08-15' }
      ];

      // Act
      const result = await editFixedFeeQuantityTransitions('sub_ai_transition', 'interval_xyz789', transitions, 'ai-agents');

      // Assert
      expect(result.success).toBe(true);
      expect(mockCreateOrbClient).toHaveBeenCalledWith('ai-agents');
      expect(mockOrbClient.subscriptions.priceIntervals).toHaveBeenCalledWith('sub_ai_transition', {
        edit: [{
          price_interval_id: 'interval_xyz789',
          fixed_fee_quantity_transitions: transitions
        }]
      });
    });

    it('should handle single transition for immediate quantity change', async () => {
      // Arrange
      const mockOrbClient = {
        subscriptions: {
          priceIntervals: jest.fn().mockResolvedValue({})
        }
      };

      mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

      const singleTransition = [
        { quantity: 1, effective_date: '2025-07-25' }
      ];

      // Act
      const result = await editFixedFeeQuantityTransitions('sub_immediate', 'interval_immediate', singleTransition);

      // Assert
      expect(result.success).toBe(true);
      expect(mockOrbClient.subscriptions.priceIntervals).toHaveBeenCalledWith('sub_immediate', {
        edit: [{
          price_interval_id: 'interval_immediate',
          fixed_fee_quantity_transitions: singleTransition
        }]
      });
    });

    it('should handle multiple transitions for complex scheduling', async () => {
      // Arrange
      const mockOrbClient = {
        subscriptions: {
          priceIntervals: jest.fn().mockResolvedValue({})
        }
      };

      mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

      const complexTransitions = [
        { quantity: 2, effective_date: '2025-08-01' },
        { quantity: 5, effective_date: '2025-09-01' },
        { quantity: 8, effective_date: '2025-10-01' },
        { quantity: 3, effective_date: '2025-11-01' }
      ];

      // Act
      const result = await editFixedFeeQuantityTransitions('sub_complex', 'interval_complex', complexTransitions);

      // Assert
      expect(result.success).toBe(true);
      expect(mockOrbClient.subscriptions.priceIntervals).toHaveBeenCalledWith('sub_complex', {
        edit: [{
          price_interval_id: 'interval_complex',
          fixed_fee_quantity_transitions: complexTransitions
        }]
      });
    });

    it('should handle missing required parameters', async () => {
      // Act & Assert - Missing subscriptionId
      const result1 = await editFixedFeeQuantityTransitions('', 'interval_abc123', [{ quantity: 5, effective_date: '2025-08-01' }]);
      expect(result1.success).toBe(false);
      expect(result1.error).toBe('Missing required parameters for editing fixed fee quantity transitions.');

      // Act & Assert - Missing priceIntervalId
      const result2 = await editFixedFeeQuantityTransitions('sub_123456789', '', [{ quantity: 5, effective_date: '2025-08-01' }]);
      expect(result2.success).toBe(false);
      expect(result2.error).toBe('Missing required parameters for editing fixed fee quantity transitions.');

      // Act & Assert - Missing transitions
      const result3 = await editFixedFeeQuantityTransitions('sub_123456789', 'interval_abc123', []);
      expect(result3.success).toBe(false);
      expect(result3.error).toBe('Missing required parameters for editing fixed fee quantity transitions.');

      // Act & Assert - Null transitions
      const result4 = await editFixedFeeQuantityTransitions('sub_123456789', 'interval_abc123', null as unknown as FixedFeeQuantityTransition[]);
      expect(result4.success).toBe(false);
      expect(result4.error).toBe('Missing required parameters for editing fixed fee quantity transitions.');
    });

    it('should handle API configuration errors', async () => {
      // Arrange - Mock ORB_INSTANCES to simulate missing API key
      const originalApiKey = ORB_INSTANCES['cloud-infra'].apiKey;
      Object.defineProperty(ORB_INSTANCES['cloud-infra'], 'apiKey', {
        value: undefined,
        writable: true,
        configurable: true
      });

      // Act
      const result = await editFixedFeeQuantityTransitions('sub_no_key', 'interval_test', [{ quantity: 5, effective_date: '2025-08-01' }]);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Server configuration error.');

      // Restore original API key
      Object.defineProperty(ORB_INSTANCES['cloud-infra'], 'apiKey', {
        value: originalApiKey,
        writable: true,
        configurable: true
      });
    });

    it('should handle API errors when editing transitions', async () => {
      // Arrange
      const apiError = new Error('Price interval not found');
      const mockOrbClient = {
        subscriptions: {
          priceIntervals: jest.fn().mockRejectedValue(apiError)
        }
      };

      mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

      const transitions = [{ quantity: 5, effective_date: '2025-08-01' }];

      // Act
      const result = await editFixedFeeQuantityTransitions('sub_error', 'interval_invalid', transitions);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Price interval not found');
    });

    it('should handle unknown errors during transition editing', async () => {
      // Arrange
      const unknownError = { message: 'Unknown error type' };
      const mockOrbClient = {
        subscriptions: {
          priceIntervals: jest.fn().mockRejectedValue(unknownError)
        }
      };

      mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

      const transitions = [{ quantity: 5, effective_date: '2025-08-01' }];

      // Act
      const result = await editFixedFeeQuantityTransitions('sub_unknown_error', 'interval_error', transitions);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('An unexpected error occurred.');
    });

    it('should handle zero quantity transitions for removing charges', async () => {
      // Arrange
      const mockOrbClient = {
        subscriptions: {
          priceIntervals: jest.fn().mockResolvedValue({})
        }
      };

      mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

      const zeroTransitions = [
        { quantity: 0, effective_date: '2025-08-01' }
      ];

      // Act
      const result = await editFixedFeeQuantityTransitions('sub_zero_qty', 'interval_zero', zeroTransitions);

      // Assert
      expect(result.success).toBe(true);
      expect(mockOrbClient.subscriptions.priceIntervals).toHaveBeenCalledWith('sub_zero_qty', {
        edit: [{
          price_interval_id: 'interval_zero',
          fixed_fee_quantity_transitions: zeroTransitions
        }]
      });
    });

    it('should handle large quantity values for enterprise customers', async () => {
      // Arrange
      const mockOrbClient = {
        subscriptions: {
          priceIntervals: jest.fn().mockResolvedValue({})
        }
      };

      mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

      const largeTransitions = [
        { quantity: 1000, effective_date: '2025-08-01' },
        { quantity: 5000, effective_date: '2025-09-01' }
      ];

      // Act
      const result = await editFixedFeeQuantityTransitions('sub_enterprise', 'interval_enterprise', largeTransitions);

      // Assert
      expect(result.success).toBe(true);
      expect(mockOrbClient.subscriptions.priceIntervals).toHaveBeenCalledWith('sub_enterprise', {
        edit: [{
          price_interval_id: 'interval_enterprise',
          fixed_fee_quantity_transitions: largeTransitions
        }]
      });
    });
  });

  describe('addPriceInterval', () => {
    beforeEach(() => {
      // Reset date mock for each test
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-07-24T10:30:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should successfully add price interval with provided start date', async () => {
      // Arrange
      const mockOrbClient = {
        subscriptions: {
          priceIntervals: jest.fn().mockResolvedValue({})
        }
      };

      mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

      // Act
      const result = await addPriceInterval('sub_test_123', 'price_abc456', '2025-08-01');

      // Assert
      expect(result.success).toBe(true);
      expect(mockCreateOrbClient).toHaveBeenCalledWith('cloud-infra');
      expect(mockOrbClient.subscriptions.priceIntervals).toHaveBeenCalledWith('sub_test_123', {
        add: [{
          price_id: 'price_abc456',
          start_date: '2025-08-01'
        }]
      });
    });

    it('should successfully add price interval with ai-agents instance', async () => {
      // Arrange
      const mockOrbClient = {
        subscriptions: {
          priceIntervals: jest.fn().mockResolvedValue({})
        }
      };

      mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

      // Act
      const result = await addPriceInterval('sub_ai_test', 'price_ai_789', '2025-09-15', 'ai-agents');

      // Assert
      expect(result.success).toBe(true);
      expect(mockCreateOrbClient).toHaveBeenCalledWith('ai-agents');
      expect(mockOrbClient.subscriptions.priceIntervals).toHaveBeenCalledWith('sub_ai_test', {
        add: [{
          price_id: 'price_ai_789',
          start_date: '2025-09-15'
        }]
      });
    });

    it('should default to today when no start date provided', async () => {
      // Arrange
      const mockOrbClient = {
        subscriptions: {
          priceIntervals: jest.fn().mockResolvedValue({})
        }
      };

      mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

      // Act
      const result = await addPriceInterval('sub_default_date', 'price_default_123');

      // Assert
      expect(result.success).toBe(true);
      expect(mockOrbClient.subscriptions.priceIntervals).toHaveBeenCalledWith('sub_default_date', {
        add: [{
          price_id: 'price_default_123',
          start_date: '2025-07-24' // Today's date in UTC
        }]
      });
    });

    it('should default to today when null start date provided', async () => {
      // Arrange
      const mockOrbClient = {
        subscriptions: {
          priceIntervals: jest.fn().mockResolvedValue({})
        }
      };

      mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

      // Act
      const result = await addPriceInterval('sub_null_date', 'price_null_456', null);

      // Assert
      expect(result.success).toBe(true);
      expect(mockOrbClient.subscriptions.priceIntervals).toHaveBeenCalledWith('sub_null_date', {
        add: [{
          price_id: 'price_null_456',
          start_date: '2025-07-24' // Today's date in UTC
        }]
      });
    });

    it('should handle missing required parameters', async () => {
      // Act & Assert - Missing subscriptionId
      const result1 = await addPriceInterval('', 'price_test123');
      expect(result1.success).toBe(false);
      expect(result1.error).toBe('Missing required parameters for adding price interval.');

      // Act & Assert - Missing priceId
      const result2 = await addPriceInterval('sub_test123', '');
      expect(result2.success).toBe(false);
      expect(result2.error).toBe('Missing required parameters for adding price interval.');
    });

    it('should validate start date format', async () => {
      // Act & Assert - Invalid date format
      const result1 = await addPriceInterval('sub_test', 'price_test', '2025/08/01');
      expect(result1.success).toBe(false);
      expect(result1.error).toBe('Invalid start date format. Use YYYY-MM-DD.');

      // Act & Assert - Invalid date format with time
      const result2 = await addPriceInterval('sub_test', 'price_test', '2025-08-01T10:30:00');
      expect(result2.success).toBe(false);
      expect(result2.error).toBe('Invalid start date format. Use YYYY-MM-DD.');

      // Act & Assert - Invalid date format with dashes in wrong places
      const result3 = await addPriceInterval('sub_test', 'price_test', '08-01-2025');
      expect(result3.success).toBe(false);
      expect(result3.error).toBe('Invalid start date format. Use YYYY-MM-DD.');
    });

    it('should handle API configuration errors', async () => {
      // Arrange - Mock ORB_INSTANCES to simulate missing API key
      const originalApiKey = ORB_INSTANCES['cloud-infra'].apiKey;
      Object.defineProperty(ORB_INSTANCES['cloud-infra'], 'apiKey', {
        value: undefined,
        writable: true,
        configurable: true
      });

      // Act
      const result = await addPriceInterval('sub_no_key', 'price_test', '2025-08-01');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Server configuration error.');

      // Restore original API key
      Object.defineProperty(ORB_INSTANCES['cloud-infra'], 'apiKey', {
        value: originalApiKey,
        writable: true,
        configurable: true
      });
    });

    it('should handle API errors when adding price interval', async () => {
      // Arrange
      const apiError = new Error('Price not found');
      const mockOrbClient = {
        subscriptions: {
          priceIntervals: jest.fn().mockRejectedValue(apiError)
        }
      };

      mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

      // Act
      const result = await addPriceInterval('sub_error', 'price_invalid', '2025-08-01');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Price not found');
    });

    it('should handle unknown errors during price interval addition', async () => {
      // Arrange
      const unknownError = { message: 'Unknown error type' };
      const mockOrbClient = {
        subscriptions: {
          priceIntervals: jest.fn().mockRejectedValue(unknownError)
        }
      };

      mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

      // Act
      const result = await addPriceInterval('sub_unknown_error', 'price_error', '2025-08-01');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('An unexpected error occurred.');
    });

    it('should handle future dates for scheduled price additions', async () => {
      // Arrange
      const mockOrbClient = {
        subscriptions: {
          priceIntervals: jest.fn().mockResolvedValue({})
        }
      };

      mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

      // Act
      const result = await addPriceInterval('sub_future', 'price_future', '2025-12-31');

      // Assert
      expect(result.success).toBe(true);
      expect(mockOrbClient.subscriptions.priceIntervals).toHaveBeenCalledWith('sub_future', {
        add: [{
          price_id: 'price_future',
          start_date: '2025-12-31'
        }]
      });
    });

    it('should handle past dates for historical price additions', async () => {
      // Arrange
      const mockOrbClient = {
        subscriptions: {
          priceIntervals: jest.fn().mockResolvedValue({})
        }
      };

      mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

      // Act
      const result = await addPriceInterval('sub_past', 'price_past', '2025-01-01');

      // Assert
      expect(result.success).toBe(true);
      expect(mockOrbClient.subscriptions.priceIntervals).toHaveBeenCalledWith('sub_past', {
        add: [{
          price_id: 'price_past',
          start_date: '2025-01-01'
        }]
      });
    });

    it('should correctly format UTC date for different timezones', async () => {
      // Arrange - Simulate different timezone by setting a specific time
      jest.setSystemTime(new Date('2025-07-24T23:30:00Z')); // Late UTC time

      const mockOrbClient = {
        subscriptions: {
          priceIntervals: jest.fn().mockResolvedValue({})
        }
      };

      mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

      // Act
      const result = await addPriceInterval('sub_timezone', 'price_timezone');

      // Assert
      expect(result.success).toBe(true);
      expect(mockOrbClient.subscriptions.priceIntervals).toHaveBeenCalledWith('sub_timezone', {
        add: [{
          price_id: 'price_timezone',
          start_date: '2025-07-24' // Should still be 24th in UTC
        }]
      });
    });

    it('should handle edge case of month transitions in UTC', async () => {
      // Arrange - Set time to end of month
      jest.setSystemTime(new Date('2025-07-31T23:59:59Z'));

      const mockOrbClient = {
        subscriptions: {
          priceIntervals: jest.fn().mockResolvedValue({})
        }
      };

      mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

      // Act
      const result = await addPriceInterval('sub_month_end', 'price_month_end');

      // Assert
      expect(result.success).toBe(true);
      expect(mockOrbClient.subscriptions.priceIntervals).toHaveBeenCalledWith('sub_month_end', {
        add: [{
          price_id: 'price_month_end',
          start_date: '2025-07-31'
        }]
      });
    });
  });

  describe('editPriceIntervalSchedule', () => {
    it('should successfully edit price interval schedule with start date only', async () => {
      // Arrange
      const mockOrbClient = {
        subscriptions: {
          priceIntervals: jest.fn().mockResolvedValue({})
        }
      };

      mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

      const scheduleEdits: PriceIntervalScheduleEdit[] = [
        {
          price_interval_id: 'interval_123',
          start_date: '2025-08-01'
        }
      ];

      // Act
      const result = await editPriceIntervalSchedule('sub_schedule_test', scheduleEdits);

      // Assert
      expect(result.success).toBe(true);
      expect(mockCreateOrbClient).toHaveBeenCalledWith('cloud-infra');
      expect(mockOrbClient.subscriptions.priceIntervals).toHaveBeenCalledWith('sub_schedule_test', {
        edit: [{
          price_interval_id: 'interval_123',
          start_date: '2025-08-01'
        }]
      });
    });

    it('should successfully edit price interval schedule with end date only', async () => {
      // Arrange
      const mockOrbClient = {
        subscriptions: {
          priceIntervals: jest.fn().mockResolvedValue({})
        }
      };

      mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

      const scheduleEdits: PriceIntervalScheduleEdit[] = [
        {
          price_interval_id: 'interval_456',
          end_date: '2025-12-31'
        }
      ];

      // Act
      const result = await editPriceIntervalSchedule('sub_end_date_test', scheduleEdits);

      // Assert
      expect(result.success).toBe(true);
      expect(mockOrbClient.subscriptions.priceIntervals).toHaveBeenCalledWith('sub_end_date_test', {
        edit: [{
          price_interval_id: 'interval_456',
          end_date: '2025-12-31'
        }]
      });
    });

    it('should successfully edit price interval schedule with both start and end dates', async () => {
      // Arrange
      const mockOrbClient = {
        subscriptions: {
          priceIntervals: jest.fn().mockResolvedValue({})
        }
      };

      mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

      const scheduleEdits: PriceIntervalScheduleEdit[] = [
        {
          price_interval_id: 'interval_789',
          start_date: '2025-08-01',
          end_date: '2025-11-30'
        }
      ];

      // Act
      const result = await editPriceIntervalSchedule('sub_both_dates_test', scheduleEdits);

      // Assert
      expect(result.success).toBe(true);
      expect(mockOrbClient.subscriptions.priceIntervals).toHaveBeenCalledWith('sub_both_dates_test', {
        edit: [{
          price_interval_id: 'interval_789',
          start_date: '2025-08-01',
          end_date: '2025-11-30'
        }]
      });
    });

    it('should successfully edit multiple price interval schedules', async () => {
      // Arrange
      const mockOrbClient = {
        subscriptions: {
          priceIntervals: jest.fn().mockResolvedValue({})
        }
      };

      mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

      const scheduleEdits: PriceIntervalScheduleEdit[] = [
        {
          price_interval_id: 'interval_001',
          start_date: '2025-08-01'
        },
        {
          price_interval_id: 'interval_002',
          end_date: '2025-10-31'
        },
        {
          price_interval_id: 'interval_003',
          start_date: '2025-09-01',
          end_date: '2025-12-31'
        }
      ];

      // Act
      const result = await editPriceIntervalSchedule('sub_multiple_test', scheduleEdits);

      // Assert
      expect(result.success).toBe(true);
      expect(mockOrbClient.subscriptions.priceIntervals).toHaveBeenCalledWith('sub_multiple_test', {
        edit: [
          {
            price_interval_id: 'interval_001',
            start_date: '2025-08-01'
          },
          {
            price_interval_id: 'interval_002',
            end_date: '2025-10-31'
          },
          {
            price_interval_id: 'interval_003',
            start_date: '2025-09-01',
            end_date: '2025-12-31'
          }
        ]
      });
    });

    it('should successfully edit price interval schedule for ai-agents instance', async () => {
      // Arrange
      const mockOrbClient = {
        subscriptions: {
          priceIntervals: jest.fn().mockResolvedValue({})
        }
      };

      mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

      const scheduleEdits: PriceIntervalScheduleEdit[] = [
        {
          price_interval_id: 'interval_ai_123',
          start_date: '2025-08-15'
        }
      ];

      // Act
      const result = await editPriceIntervalSchedule('sub_ai_schedule', scheduleEdits, 'ai-agents');

      // Assert
      expect(result.success).toBe(true);
      expect(mockCreateOrbClient).toHaveBeenCalledWith('ai-agents');
      expect(mockOrbClient.subscriptions.priceIntervals).toHaveBeenCalledWith('sub_ai_schedule', {
        edit: [{
          price_interval_id: 'interval_ai_123',
          start_date: '2025-08-15'
        }]
      });
    });

    it('should handle null dates by excluding them from payload', async () => {
      // Arrange
      const mockOrbClient = {
        subscriptions: {
          priceIntervals: jest.fn().mockResolvedValue({})
        }
      };

      mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

      const scheduleEdits: PriceIntervalScheduleEdit[] = [
        {
          price_interval_id: 'interval_null_test',
          start_date: null,
          end_date: null
        }
      ];

      // Act
      const result = await editPriceIntervalSchedule('sub_null_dates', scheduleEdits);

      // Assert
      expect(result.success).toBe(true);
      expect(mockOrbClient.subscriptions.priceIntervals).toHaveBeenCalledWith('sub_null_dates', {
        edit: [{
          price_interval_id: 'interval_null_test'
          // No start_date or end_date should be included when they are null
        }]
      });
    });

    it('should handle missing subscription ID', async () => {
      // Arrange
      const scheduleEdits: PriceIntervalScheduleEdit[] = [
        {
          price_interval_id: 'interval_123',
          start_date: '2025-08-01'
        }
      ];

      // Act
      const result = await editPriceIntervalSchedule('', scheduleEdits);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Subscription ID is required.');
    });

    it('should handle empty edits array', async () => {
      // Act
      const result = await editPriceIntervalSchedule('sub_empty_edits', []);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('No schedule edits provided.');
    });

    it('should handle null edits array', async () => {
      // Act
      const result = await editPriceIntervalSchedule('sub_null_edits', null as unknown as PriceIntervalScheduleEdit[]);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('No schedule edits provided.');
    });

    it('should validate price interval ID presence', async () => {
      // Arrange
      const scheduleEdits: PriceIntervalScheduleEdit[] = [
        {
          price_interval_id: '',
          start_date: '2025-08-01'
        }
      ];

      // Act
      const result = await editPriceIntervalSchedule('sub_no_interval_id', scheduleEdits);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Each schedule edit must include a price_interval_id.');
    });

    it('should validate start date format', async () => {
      // Arrange
      const scheduleEdits: PriceIntervalScheduleEdit[] = [
        {
          price_interval_id: 'interval_invalid_start',
          start_date: '2025/08/01'
        }
      ];

      // Act
      const result = await editPriceIntervalSchedule('sub_invalid_start', scheduleEdits);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid start_date format: 2025/08/01. Use YYYY-MM-DD.');
    });

    it('should validate end date format', async () => {
      // Arrange
      const scheduleEdits: PriceIntervalScheduleEdit[] = [
        {
          price_interval_id: 'interval_invalid_end',
          end_date: '31-12-2025'
        }
      ];

      // Act
      const result = await editPriceIntervalSchedule('sub_invalid_end', scheduleEdits);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid end_date format: 31-12-2025. Use YYYY-MM-DD.');
    });

    it('should validate multiple date formats in batch', async () => {
      // Arrange
      const scheduleEdits: PriceIntervalScheduleEdit[] = [
        {
          price_interval_id: 'interval_valid',
          start_date: '2025-08-01'
        },
        {
          price_interval_id: 'interval_invalid',
          start_date: '2025-08-01T10:30:00'
        }
      ];

      // Act
      const result = await editPriceIntervalSchedule('sub_batch_validation', scheduleEdits);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid start_date format: 2025-08-01T10:30:00. Use YYYY-MM-DD.');
    });

    it('should handle API configuration errors', async () => {
      // Arrange - Mock ORB_INSTANCES to simulate missing API key
      const originalApiKey = ORB_INSTANCES['cloud-infra'].apiKey;
      Object.defineProperty(ORB_INSTANCES['cloud-infra'], 'apiKey', {
        value: undefined,
        writable: true,
        configurable: true
      });

      const scheduleEdits: PriceIntervalScheduleEdit[] = [
        {
          price_interval_id: 'interval_no_key',
          start_date: '2025-08-01'
        }
      ];

      // Act
      const result = await editPriceIntervalSchedule('sub_no_key', scheduleEdits);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Server configuration error.');

      // Restore original API key
      Object.defineProperty(ORB_INSTANCES['cloud-infra'], 'apiKey', {
        value: originalApiKey,
        writable: true,
        configurable: true
      });
    });

    it('should handle API errors when editing schedule', async () => {
      // Arrange
      const apiError = new Error('Price interval not found');
      const mockOrbClient = {
        subscriptions: {
          priceIntervals: jest.fn().mockRejectedValue(apiError)
        }
      };

      mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

      const scheduleEdits: PriceIntervalScheduleEdit[] = [
        {
          price_interval_id: 'interval_not_found',
          start_date: '2025-08-01'
        }
      ];

      // Act
      const result = await editPriceIntervalSchedule('sub_api_error', scheduleEdits);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Price interval not found');
    });

    it('should handle axios response errors with detailed logging', async () => {
      // Arrange
      const axiosError = new Error('Validation failed') as Error & {
        response: { data: { detail: 'Invalid schedule configuration', code: 'INVALID_SCHEDULE' } };
      };
      axiosError.response = { data: { detail: 'Invalid schedule configuration', code: 'INVALID_SCHEDULE' } };

      const mockOrbClient = {
        subscriptions: {
          priceIntervals: jest.fn().mockRejectedValue(axiosError)
        }
      };

      mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

      const scheduleEdits: PriceIntervalScheduleEdit[] = [
        {
          price_interval_id: 'interval_validation_error',
          start_date: '2025-08-01'
        }
      ];

      // Act
      const result = await editPriceIntervalSchedule('sub_axios_error', scheduleEdits);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Validation failed');
    });

    it('should handle unknown errors during schedule editing', async () => {
      // Arrange
      const unknownError = { message: 'Unknown error type' };
      const mockOrbClient = {
        subscriptions: {
          priceIntervals: jest.fn().mockRejectedValue(unknownError)
        }
      };

      mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

      const scheduleEdits: PriceIntervalScheduleEdit[] = [
        {
          price_interval_id: 'interval_unknown_error',
          start_date: '2025-08-01'
        }
      ];

      // Act
      const result = await editPriceIntervalSchedule('sub_unknown_error', scheduleEdits);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('An unexpected error occurred.');
    });

    it('should handle complex schedule edits with mixed date operations', async () => {
      // Arrange
      const mockOrbClient = {
        subscriptions: {
          priceIntervals: jest.fn().mockResolvedValue({})
        }
      };

      mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

      const scheduleEdits: PriceIntervalScheduleEdit[] = [
        {
          price_interval_id: 'interval_extend',
          end_date: '2025-12-31' // Extend existing interval
        },
        {
          price_interval_id: 'interval_move_start',
          start_date: '2025-09-01' // Move start date
        },
        {
          price_interval_id: 'interval_reschedule',
          start_date: '2025-10-01',
          end_date: '2025-11-30' // Complete reschedule
        },
        {
          price_interval_id: 'interval_clear_end',
          end_date: null // Remove end date constraint
        }
      ];

      // Act
      const result = await editPriceIntervalSchedule('sub_complex_schedule', scheduleEdits);

      // Assert
      expect(result.success).toBe(true);
      expect(mockOrbClient.subscriptions.priceIntervals).toHaveBeenCalledWith('sub_complex_schedule', {
        edit: [
          {
            price_interval_id: 'interval_extend',
            end_date: '2025-12-31'
          },
          {
            price_interval_id: 'interval_move_start',
            start_date: '2025-09-01'
          },
          {
            price_interval_id: 'interval_reschedule',
            start_date: '2025-10-01',
            end_date: '2025-11-30'
          },
          {
            price_interval_id: 'interval_clear_end'
            // No end_date included when null
          }
        ]
      });
    });
  });

  describe('getPriceDetails', () => {
    it('should successfully fetch price details with basic configuration', async () => {
      // Arrange
      const mockPrice = {
        id: 'price_123',
        name: 'Standard Plan',
        price_type: 'fixed',
        model_type: 'unit',
        currency: 'USD',
        item: { id: 'item_456', name: 'API Calls' },
        fixed_price_quantity: 100,
        unit_config: {
          unit_amount: '0.05'
        }
      };

      const mockOrbClient = {
        prices: {
          fetch: jest.fn().mockResolvedValue(mockPrice)
        }
      };

      mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

      // Act
      const result = await getPriceDetails('price_123');

      // Assert
      expect(result.success).toBe(true);
      expect(result.price).toEqual({
        id: 'price_123',
        name: 'Standard Plan',
        price_type: 'fixed',
        model_type: 'unit',
        currency: 'USD',
        item: { id: 'item_456', name: 'API Calls' },
        fixed_price_quantity: 100,
        unit_config: {
          unit_amount: '0.05'
        }
      });
      expect(mockCreateOrbClient).toHaveBeenCalledWith('cloud-infra');
      expect(mockOrbClient.prices.fetch).toHaveBeenCalledWith('price_123');
    });

    it('should successfully fetch price details for ai-agents instance', async () => {
      // Arrange
      const mockPrice = {
        id: 'price_ai_789',
        name: 'Premium AI Model',
        price_type: 'usage',
        model_type: 'tiered',
        currency: 'USD',
        item: { id: 'item_ai_123', name: 'Token Credits' },
        fixed_price_quantity: null,
        tiered_config: {
          tiers: [
            { first_unit: 1000, unit_amount: '0.01' },
            { first_unit: 10000, unit_amount: '0.008' }
          ]
        }
      };

      const mockOrbClient = {
        prices: {
          fetch: jest.fn().mockResolvedValue(mockPrice)
        }
      };

      mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

      // Act
      const result = await getPriceDetails('price_ai_789', 'ai-agents');

      // Assert
      expect(result.success).toBe(true);
      expect(result.price).toEqual({
        id: 'price_ai_789',
        name: 'Premium AI Model',
        price_type: 'usage',
        model_type: 'tiered',
        currency: 'USD',
        item: { id: 'item_ai_123', name: 'Token Credits' },
        fixed_price_quantity: null,
        tiered_config: {
          tiers: [
            { first_unit: 1000, unit_amount: '0.01' },
            { first_unit: 10000, unit_amount: '0.008' }
          ]
        }
      });
      expect(mockCreateOrbClient).toHaveBeenCalledWith('ai-agents');
      expect(mockOrbClient.prices.fetch).toHaveBeenCalledWith('price_ai_789');
    });

    it('should successfully fetch price details with package configuration', async () => {
      // Arrange
      const mockPrice = {
        id: 'price_package_456',
        name: 'Enterprise Package',
        price_type: 'fixed',
        model_type: 'package',
        currency: 'USD',
        item: { id: 'item_enterprise', name: 'Enterprise Bundle' },
        fixed_price_quantity: 1,
        package_config: {
          package_amount: '5000.00',
          package_size: 10000
        }
      };

      const mockOrbClient = {
        prices: {
          fetch: jest.fn().mockResolvedValue(mockPrice)
        }
      };

      mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

      // Act
      const result = await getPriceDetails('price_package_456');

      // Assert
      expect(result.success).toBe(true);
      expect(result.price).toEqual({
        id: 'price_package_456',
        name: 'Enterprise Package',
        price_type: 'fixed',
        model_type: 'package',
        currency: 'USD',
        item: { id: 'item_enterprise', name: 'Enterprise Bundle' },
        fixed_price_quantity: 1,
        package_config: {
          package_amount: '5000.00',
          package_size: 10000
        }
      });
    });

    it('should handle price with multiple config types', async () => {
      // Arrange
      const mockPrice = {
        id: 'price_multi_config',
        name: 'Multi-Config Price',
        price_type: 'usage',
        model_type: 'tiered',
        currency: 'USD',
        item: { id: 'item_multi', name: 'Multi Service' },
        fixed_price_quantity: null,
        tiered_config: {
          tiers: [{ first_unit: 100, unit_amount: '0.10' }]
        },
        unit_config: {
          unit_amount: '0.05'
        },
        package_config: {
          package_amount: '100.00',
          package_size: 1000
        }
      };

      const mockOrbClient = {
        prices: {
          fetch: jest.fn().mockResolvedValue(mockPrice)
        }
      };

      mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

      // Act
      const result = await getPriceDetails('price_multi_config');

      // Assert
      expect(result.success).toBe(true);
      expect(result.price).toEqual({
        id: 'price_multi_config',
        name: 'Multi-Config Price',
        price_type: 'usage',
        model_type: 'tiered',
        currency: 'USD',
        item: { id: 'item_multi', name: 'Multi Service' },
        fixed_price_quantity: null,
        tiered_config: {
          tiers: [{ first_unit: 100, unit_amount: '0.10' }]
        },
        unit_config: {
          unit_amount: '0.05'
        },
        package_config: {
          package_amount: '100.00',
          package_size: 1000
        }
      });
    });

    it('should handle price with null/undefined optional configurations', async () => {
      // Arrange
      const mockPrice = {
        id: 'price_minimal',
        name: 'Minimal Price',
        price_type: 'fixed',
        model_type: 'unit',
        currency: 'USD',
        item: { id: 'item_minimal', name: 'Basic Service' },
        fixed_price_quantity: undefined,
        unit_config: undefined,
        tiered_config: null,
        package_config: undefined
      };

      const mockOrbClient = {
        prices: {
          fetch: jest.fn().mockResolvedValue(mockPrice)
        }
      };

      mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

      // Act
      const result = await getPriceDetails('price_minimal');

      // Assert
      expect(result.success).toBe(true);
      expect(result.price).toEqual({
        id: 'price_minimal',
        name: 'Minimal Price',
        price_type: 'fixed',
        model_type: 'unit',
        currency: 'USD',
        item: { id: 'item_minimal', name: 'Basic Service' },
        fixed_price_quantity: undefined,
        unit_config: undefined,
        tiered_config: null,
        package_config: undefined
      });
    });

    it('should handle missing price ID', async () => {
      // Act
      const result = await getPriceDetails('');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Missing price ID.');
      expect(result.price).toBeUndefined();
    });

    it('should handle API configuration errors', async () => {
      // Arrange - Mock ORB_INSTANCES to simulate missing API key
      const originalApiKey = ORB_INSTANCES['cloud-infra'].apiKey;
      Object.defineProperty(ORB_INSTANCES['cloud-infra'], 'apiKey', {
        value: undefined,
        writable: true,
        configurable: true
      });

      // Act
      const result = await getPriceDetails('price_no_key');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Server configuration error.');
      expect(result.price).toBeUndefined();

      // Restore original API key
      Object.defineProperty(ORB_INSTANCES['cloud-infra'], 'apiKey', {
        value: originalApiKey,
        writable: true,
        configurable: true
      });
    });

    it('should handle price not found error', async () => {
      // Arrange
      const notFoundError = new Error('Price not found');
      const mockOrbClient = {
        prices: {
          fetch: jest.fn().mockRejectedValue(notFoundError)
        }
      };

      mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

      // Act
      const result = await getPriceDetails('price_not_found');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Price not found');
      expect(result.price).toBe(null);
    });

    it('should handle null response from fetch', async () => {
      // Arrange
      const mockOrbClient = {
        prices: {
          fetch: jest.fn().mockResolvedValue(null)
        }
      };

      mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

      // Act
      const result = await getPriceDetails('price_null_response');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Price not found');
      expect(result.price).toBe(null);
    });

    it('should handle undefined response from fetch', async () => {
      // Arrange
      const mockOrbClient = {
        prices: {
          fetch: jest.fn().mockResolvedValue(undefined)
        }
      };

      mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

      // Act
      const result = await getPriceDetails('price_undefined_response');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Price not found');
      expect(result.price).toBe(null);
    });

    it('should handle case-insensitive not found errors', async () => {
      // Arrange
      const notFoundError = new Error('PRICE NOT FOUND');
      const mockOrbClient = {
        prices: {
          fetch: jest.fn().mockRejectedValue(notFoundError)
        }
      };

      mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

      // Act
      const result = await getPriceDetails('price_case_test');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Price not found');
      expect(result.price).toBe(null);
    });

    it('should preserve original error message for non-404 errors', async () => {
      // Arrange
      const authError = new Error('Authentication failed');
      const mockOrbClient = {
        prices: {
          fetch: jest.fn().mockRejectedValue(authError)
        }
      };

      mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

      // Act
      const result = await getPriceDetails('price_auth_error');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Authentication failed');
      expect(result.price).toBe(null);
    });

    it('should handle unknown errors during price fetching', async () => {
      // Arrange
      const unknownError = { message: 'Unknown error type' };
      const mockOrbClient = {
        prices: {
          fetch: jest.fn().mockRejectedValue(unknownError)
        }
      };

      mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

      // Act
      const result = await getPriceDetails('price_unknown_error');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to fetch price details');
      expect(result.price).toBe(null);
    });

    it('should handle complex price with all possible configurations', async () => {
      // Arrange
      const complexPrice = {
        id: 'price_complex_full',
        name: 'Complex Full-Featured Price',
        price_type: 'usage',
        model_type: 'tiered',
        currency: 'EUR',
        item: { 
          id: 'item_complex', 
          name: 'Complex Service',
          external_item_id: 'ext_complex_123'
        },
        fixed_price_quantity: 50,
        tiered_config: {
          tiers: [
            { first_unit: 1000, unit_amount: '0.02', flat_amount: '10.00' },
            { first_unit: 5000, unit_amount: '0.015', flat_amount: '50.00' },
            { first_unit: null, unit_amount: '0.01', flat_amount: '100.00' }
          ]
        },
        unit_config: {
          unit_amount: '0.025',
          scaling_factor: 1.5
        },
        package_config: {
          package_amount: '2500.00',
          package_size: 25000
        },
        custom_field: 'This should be preserved'
      };

      const mockOrbClient = {
        prices: {
          fetch: jest.fn().mockResolvedValue(complexPrice)
        }
      };

      mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

      // Act
      const result = await getPriceDetails('price_complex_full');

      // Assert
      expect(result.success).toBe(true);
      expect(result.price).toEqual({
        id: 'price_complex_full',
        name: 'Complex Full-Featured Price',
        price_type: 'usage',
        model_type: 'tiered',
        currency: 'EUR',
        item: { 
          id: 'item_complex', 
          name: 'Complex Service',
          external_item_id: 'ext_complex_123'
        },
        fixed_price_quantity: 50,
        tiered_config: {
          tiers: [
            { first_unit: 1000, unit_amount: '0.02', flat_amount: '10.00' },
            { first_unit: 5000, unit_amount: '0.015', flat_amount: '50.00' },
            { first_unit: null, unit_amount: '0.01', flat_amount: '100.00' }
          ]
        },
        unit_config: {
          unit_amount: '0.025',
          scaling_factor: 1.5
        },
        package_config: {
          package_amount: '2500.00',
          package_size: 25000
        }
      });
    });
  });
});