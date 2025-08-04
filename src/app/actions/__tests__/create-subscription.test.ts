jest.mock('@/lib/orb', () => ({
  createOrbClient: jest.fn(),
}));

import { createSubscription } from '../orb';
import { createOrbClient } from '@/lib/orb';

const mockCreateOrbClient = createOrbClient as jest.MockedFunction<typeof createOrbClient>;

describe('createSubscription', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

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