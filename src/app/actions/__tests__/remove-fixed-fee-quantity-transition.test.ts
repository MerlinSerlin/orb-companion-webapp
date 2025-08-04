// Mock the orb client before importing the function
jest.mock('@/lib/orb', () => ({
  createOrbClient: jest.fn(),
}));

import { removeFixedFeeQuantityTransition } from '../orb';
import { createOrbClient } from '@/lib/orb';

const mockCreateOrbClient = createOrbClient as jest.MockedFunction<typeof createOrbClient>;

describe('removeFixedFeeQuantityTransition', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear console to avoid cluttering test output
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

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