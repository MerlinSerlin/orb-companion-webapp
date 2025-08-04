// Mock the orb client before importing the function
jest.mock('@/lib/orb', () => ({
  createOrbClient: jest.fn(),
}));

import { getPriceDetails } from '../orb';
import { createOrbClient } from '@/lib/orb';
import { ORB_INSTANCES } from '@/lib/orb-config';

const mockCreateOrbClient = createOrbClient as jest.MockedFunction<typeof createOrbClient>;

describe('getPriceDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear console to avoid cluttering test output
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

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