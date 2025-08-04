// Mock the orb client before importing the function
jest.mock('@/lib/orb', () => ({
  createOrbClient: jest.fn(),
}));

import { schedulePlanChange } from '../orb';
import { createOrbClient } from '@/lib/orb';

const mockCreateOrbClient = createOrbClient as jest.MockedFunction<typeof createOrbClient>;

describe('schedulePlanChange', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

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