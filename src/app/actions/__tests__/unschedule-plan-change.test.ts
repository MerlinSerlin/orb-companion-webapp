// Mock the orb client before importing the function
jest.mock('@/lib/orb', () => ({
  createOrbClient: jest.fn(),
}));

import { unschedulePlanChange } from '../orb';
import { createOrbClient } from '@/lib/orb';

const mockCreateOrbClient = createOrbClient as jest.MockedFunction<typeof createOrbClient>;

describe('unschedulePlanChange', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear console to avoid cluttering test output
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

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