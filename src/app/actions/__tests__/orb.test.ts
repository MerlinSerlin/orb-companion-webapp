// Mock the orb client before importing the function
jest.mock('@/lib/orb', () => ({
  createOrbClient: jest.fn(),
}));

import { createCustomer, removeFixedFeeQuantityTransition } from '../orb';
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