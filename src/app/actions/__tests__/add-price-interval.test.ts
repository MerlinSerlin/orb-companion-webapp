// Mock the orb client before importing the function
jest.mock('@/lib/orb', () => ({
  createOrbClient: jest.fn(),
}));

import { addPriceInterval } from '../orb';
import { createOrbClient } from '@/lib/orb';
import { ORB_INSTANCES } from '@/lib/orb-config';

const mockCreateOrbClient = createOrbClient as jest.MockedFunction<typeof createOrbClient>;

describe('addPriceInterval', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear console to avoid cluttering test output
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    // Reset date mock for each test
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-07-24T10:30:00Z'));
  });

  afterEach(() => {
    jest.restoreAllMocks();
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