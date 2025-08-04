// Mock the orb client before importing the function
jest.mock('@/lib/orb', () => ({
  createOrbClient: jest.fn(),
}));

import { editFixedFeeQuantityTransitions } from '../orb';
import { createOrbClient } from '@/lib/orb';
import { ORB_INSTANCES } from '@/lib/orb-config';
import type { FixedFeeQuantityTransition } from '@/lib/types';

const mockCreateOrbClient = createOrbClient as jest.MockedFunction<typeof createOrbClient>;

describe('editFixedFeeQuantityTransitions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear console to avoid cluttering test output
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

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