// Mock the orb client before importing the function
jest.mock('@/lib/orb', () => ({
  createOrbClient: jest.fn(),
}));

import { editPriceIntervalSchedule, type PriceIntervalScheduleEdit } from '../orb';
import { createOrbClient } from '@/lib/orb';
import { ORB_INSTANCES } from '@/lib/orb-config';

const mockCreateOrbClient = createOrbClient as jest.MockedFunction<typeof createOrbClient>;

describe('editPriceIntervalSchedule', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear console to avoid cluttering test output
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

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