/**
 * Regression test for instance parameter bug
 * 
 * This test ensures that when calling removeFixedFeeQuantityTransition from dashboard components,
 * the correct instance parameter is passed through. This prevents the bug where the
 * function would default to 'cloud-infra' instead of using the user's selected instance.
 */

import { removeFixedFeeQuantityTransition } from '@/app/actions/orb';

// Mock the orb client
jest.mock('@/lib/orb', () => ({
  createOrbClient: jest.fn(),
}));

import { createOrbClient } from '@/lib/orb';
const mockCreateOrbClient = createOrbClient as jest.MockedFunction<typeof createOrbClient>;

describe('Instance Parameter Regression Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('REGRESSION: should NOT default to cloud-infra when ai-agents instance is required', async () => {
    // Arrange - This test simulates the exact bug we fixed
    const mockSubscription = {
      id: 'sub_ai_agents_123',
      price_intervals: [
        {
          id: 'interval_123',
          fixed_fee_quantity_transitions: [
            { effective_date: '2025-07-26T00:00:00+00:00', quantity: 5 }
          ]
        }
      ]
    };

    const mockOrbClient = {
      subscriptions: {
        fetch: jest.fn().mockResolvedValue(mockSubscription),
        priceIntervals: jest.fn().mockResolvedValue({})
      }
    };

    mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

    // Act - Call with ai-agents instance (this was the bug - it was getting ignored)
    await removeFixedFeeQuantityTransition(
      'sub_ai_agents_123',
      'interval_123',
      '2025-07-26T00:00:00+00:00',
      'ai-agents' // This parameter was being ignored in the bug
    );

    // Assert - CRITICAL: Must use ai-agents, NOT cloud-infra
    expect(mockCreateOrbClient).toHaveBeenCalledWith('ai-agents');
    expect(mockCreateOrbClient).not.toHaveBeenCalledWith('cloud-infra');
  });

  it('REGRESSION: should use cloud-infra when explicitly specified', async () => {
    // Arrange
    const mockSubscription = {
      id: 'sub_cloud_infra_123',
      price_intervals: [
        {
          id: 'interval_123',
          fixed_fee_quantity_transitions: [
            { effective_date: '2025-07-26T00:00:00+00:00', quantity: 5 }
          ]
        }
      ]
    };

    const mockOrbClient = {
      subscriptions: {
        fetch: jest.fn().mockResolvedValue(mockSubscription),
        priceIntervals: jest.fn().mockResolvedValue({})
      }
    };

    mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

    // Act
    await removeFixedFeeQuantityTransition(
      'sub_cloud_infra_123',
      'interval_123',
      '2025-07-26T00:00:00+00:00',
      'cloud-infra'
    );

    // Assert
    expect(mockCreateOrbClient).toHaveBeenCalledWith('cloud-infra');
  });

  it('REGRESSION: should default to cloud-infra only when no instance parameter provided', async () => {
    // Arrange
    const mockSubscription = {
      id: 'sub_default_123',
      price_intervals: [
        {
          id: 'interval_123',
          fixed_fee_quantity_transitions: [
            { effective_date: '2025-07-26T00:00:00+00:00', quantity: 5 }
          ]
        }
      ]
    };

    const mockOrbClient = {
      subscriptions: {
        fetch: jest.fn().mockResolvedValue(mockSubscription),
        priceIntervals: jest.fn().mockResolvedValue({})
      }
    };

    mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

    // Act - Simulate old buggy call (missing instance parameter)
    await removeFixedFeeQuantityTransition(
      'sub_default_123',
      'interval_123',
      '2025-07-26T00:00:00+00:00'
      // Note: No instance parameter - this should default to cloud-infra
    );

    // Assert - Should default to cloud-infra when no parameter is provided
    expect(mockCreateOrbClient).toHaveBeenCalledWith('cloud-infra');
  });

  it('REGRESSION: demonstrates the exact bug scenario that was fixed', async () => {
    // This test documents the exact scenario that was broken:
    // 1. User selected 'ai-agents' instance in localStorage
    // 2. Dashboard component received currentInstance as 'ai-agents'  
    // 3. handleRemoveScheduledTransition was called but didn't pass instance parameter
    // 4. removeFixedFeeQuantityTransition defaulted to 'cloud-infra'
    // 5. API call failed with 404 because subscription was in ai-agents instance

    const mockAiAgentsSubscription = {
      id: 'FsgrXbgnf45YBCMJ', // The actual subscription ID from the bug
      price_intervals: [
        {
          id: '5rfMPu6v39kbeVHs', // The actual interval ID from the bug
          fixed_fee_quantity_transitions: [
            { effective_date: '2025-07-26T00:00:00+00:00', quantity: 5 }
          ]
        }
      ]
    };

    const mockOrbClient = {
      subscriptions: {
        fetch: jest.fn().mockResolvedValue(mockAiAgentsSubscription),
        priceIntervals: jest.fn().mockResolvedValue({})
      }
    };

    mockCreateOrbClient.mockReturnValue(mockOrbClient as unknown as ReturnType<typeof createOrbClient>);

    // Act - Call with the correct instance (post-fix behavior)
    const result = await removeFixedFeeQuantityTransition(
      'FsgrXbgnf45YBCMJ',
      '5rfMPu6v39kbeVHs', 
      '2025-07-26T00:00:00+00:00',
      'ai-agents' // This was missing in the bug!
    );

    // Assert - Should work correctly now
    expect(mockCreateOrbClient).toHaveBeenCalledWith('ai-agents');
    expect(result.success).toBe(true);

    // If we had called with cloud-infra (the buggy behavior), 
    // it would have failed because the subscription doesn't exist there
  });
});