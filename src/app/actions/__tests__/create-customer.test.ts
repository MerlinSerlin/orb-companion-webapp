jest.mock('@/lib/orb', () => ({
  createOrbClient: jest.fn(),
}));

import { createCustomer } from '../orb';
import { createOrbClient } from '@/lib/orb';

const mockCreateOrbClient = createOrbClient as jest.MockedFunction<typeof createOrbClient>;

describe('createCustomer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

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