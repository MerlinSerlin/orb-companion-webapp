import { act, renderHook } from '@testing-library/react';
import { useCustomerStore } from '../customer-store';
import type { ScheduledPlanChange } from '../customer-store';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('CustomerStore', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Reset the store to initial state
    const { result } = renderHook(() => useCustomerStore());
    act(() => {
      result.current.logout();
    });
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useCustomerStore());
      
      expect(result.current.pendingPlanId).toBeNull();
      expect(result.current.customerId).toBeNull();
      expect(result.current.externalCustomerId).toBeNull();
      expect(result.current.selectedInstance).toBeNull();
      expect(result.current.scheduledPlanChanges).toEqual({});
    });
  });

  describe('Basic State Management', () => {
    it('should set and get pendingPlanId', () => {
      const { result } = renderHook(() => useCustomerStore());
      
      act(() => {
        result.current.setPendingPlanId('test-plan-id');
      });
      
      expect(result.current.pendingPlanId).toBe('test-plan-id');
    });

    it('should set and get customerId', () => {
      const { result } = renderHook(() => useCustomerStore());
      
      act(() => {
        result.current.setCustomerId('cus_123456');
      });
      
      expect(result.current.customerId).toBe('cus_123456');
    });

    it('should set and get externalCustomerId', () => {
      const { result } = renderHook(() => useCustomerStore());
      
      act(() => {
        result.current.setExternalCustomerId('john_doe');
      });
      
      expect(result.current.externalCustomerId).toBe('john_doe');
    });

    it('should set and get selectedInstance', () => {
      const { result } = renderHook(() => useCustomerStore());
      
      act(() => {
        result.current.setSelectedInstance('cloud-infra');
      });
      
      expect(result.current.selectedInstance).toBe('cloud-infra');
    });
  });

  describe('Scheduled Plan Changes', () => {
    const mockScheduledChange: ScheduledPlanChange = {
      subscriptionId: 'sub_123',
      targetPlanId: 'plan_456',
      targetPlanName: 'Pro Plan',
      changeDate: '2024-01-15',
      changeOption: 'requested_date',
      scheduledAt: '2024-01-01T00:00:00Z',
    };

    it('should set and get scheduled plan change', () => {
      const { result } = renderHook(() => useCustomerStore());
      
      act(() => {
        result.current.setScheduledPlanChange('sub_123', mockScheduledChange);
      });
      
      expect(result.current.scheduledPlanChanges['sub_123']).toEqual(mockScheduledChange);
      expect(result.current.getScheduledPlanChange('sub_123')).toEqual(mockScheduledChange);
    });

    it('should remove scheduled plan change', () => {
      const { result } = renderHook(() => useCustomerStore());
      
      // First set a scheduled change
      act(() => {
        result.current.setScheduledPlanChange('sub_123', mockScheduledChange);
      });
      
      expect(result.current.getScheduledPlanChange('sub_123')).toEqual(mockScheduledChange);
      
      // Then remove it
      act(() => {
        result.current.removeScheduledPlanChange('sub_123');
      });
      
      expect(result.current.getScheduledPlanChange('sub_123')).toBeNull();
      expect(result.current.scheduledPlanChanges['sub_123']).toBeUndefined();
    });

    it('should return null for non-existent scheduled plan change', () => {
      const { result } = renderHook(() => useCustomerStore());
      
      expect(result.current.getScheduledPlanChange('non_existent')).toBeNull();
    });

    it('should handle multiple scheduled plan changes', () => {
      const { result } = renderHook(() => useCustomerStore());
      
      const change1: ScheduledPlanChange = { ...mockScheduledChange, subscriptionId: 'sub_1' };
      const change2: ScheduledPlanChange = { ...mockScheduledChange, subscriptionId: 'sub_2', targetPlanName: 'Enterprise Plan' };
      
      act(() => {
        result.current.setScheduledPlanChange('sub_1', change1);
        result.current.setScheduledPlanChange('sub_2', change2);
      });
      
      expect(result.current.getScheduledPlanChange('sub_1')).toEqual(change1);
      expect(result.current.getScheduledPlanChange('sub_2')).toEqual(change2);
      expect(Object.keys(result.current.scheduledPlanChanges)).toHaveLength(2);
    });
  });

  describe('Logout Functionality', () => {
    it('should clear all customer data including selectedInstance', () => {
      const { result } = renderHook(() => useCustomerStore());
      
      // Set up some state
      act(() => {
        result.current.setPendingPlanId('test-plan');
        result.current.setCustomerId('cus_123');
        result.current.setExternalCustomerId('john_doe');
        result.current.setSelectedInstance('cloud-infra');
        result.current.setScheduledPlanChange('sub_123', {
          subscriptionId: 'sub_123',
          targetPlanId: 'plan_456',
          targetPlanName: 'Pro Plan',
          changeDate: '2024-01-15',
          changeOption: 'requested_date',
          scheduledAt: '2024-01-01T00:00:00Z',
        });
      });
      
      // Verify state is set
      expect(result.current.pendingPlanId).toBe('test-plan');
      expect(result.current.customerId).toBe('cus_123');
      expect(result.current.externalCustomerId).toBe('john_doe');
      expect(result.current.selectedInstance).toBe('cloud-infra');
      expect(Object.keys(result.current.scheduledPlanChanges)).toHaveLength(1);
      
      // Call logout
      act(() => {
        result.current.logout();
      });
      
      // Verify all customer data including selectedInstance is cleared
      expect(result.current.pendingPlanId).toBeNull();
      expect(result.current.customerId).toBeNull();
      expect(result.current.externalCustomerId).toBeNull();
      expect(result.current.selectedInstance).toBeNull(); // Should be cleared
      expect(result.current.scheduledPlanChanges).toEqual({});
      
      // Verify localStorage.removeItem was called
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('customer-storage');
    });

    it('should handle logout when localStorage is not available', () => {
      const { result } = renderHook(() => useCustomerStore());
      
      // Mock window.localStorage to be undefined
      const originalLocalStorage = window.localStorage;
      Object.defineProperty(window, 'localStorage', {
        value: undefined,
        configurable: true,
      });
      
      // Set up some state
      act(() => {
        result.current.setCustomerId('cus_123');
        result.current.setSelectedInstance('ai-agents');
      });
      
      // This should not throw an error
      expect(() => {
        act(() => {
          result.current.logout();
        });
      }).not.toThrow();
      
      // Verify state is still cleared properly
      expect(result.current.customerId).toBeNull();
      expect(result.current.selectedInstance).toBeNull(); // Should be cleared
      
      // Restore localStorage
      Object.defineProperty(window, 'localStorage', {
        value: originalLocalStorage,
        configurable: true,
      });
    });
  });

  describe('Reset Functionality (Regression Test)', () => {
    it('should properly call logout without "this" context errors', () => {
      const { result } = renderHook(() => useCustomerStore());
      
      // Set up some state
      act(() => {
        result.current.setPendingPlanId('test-plan');
        result.current.setCustomerId('cus_123');
        result.current.setExternalCustomerId('john_doe');
        result.current.setSelectedInstance('cloud-infra');
      });
      
      // Verify state is set
      expect(result.current.customerId).toBe('cus_123');
      expect(result.current.selectedInstance).toBe('cloud-infra');
      
      // This should not throw "Cannot read properties of undefined (reading 'logout')"
      expect(() => {
        act(() => {
          result.current.reset();
        });
      }).not.toThrow();
      
      // Verify reset worked properly (same behavior as logout)
      expect(result.current.pendingPlanId).toBeNull();
      expect(result.current.customerId).toBeNull();
      expect(result.current.externalCustomerId).toBeNull();
      expect(result.current.selectedInstance).toBeNull(); // Should be cleared
      
      // Verify localStorage.removeItem was called
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('customer-storage');
    });

    it('should have reset and logout behave identically', () => {
      const { result: result1 } = renderHook(() => useCustomerStore());
      const { result: result2 } = renderHook(() => useCustomerStore());
      
      // Set up identical state in both stores
      const setupState = (store: typeof result1.current) => {
        store.setPendingPlanId('test-plan');
        store.setCustomerId('cus_123');
        store.setExternalCustomerId('john_doe');
        store.setSelectedInstance('ai-agents');
        store.setScheduledPlanChange('sub_123', {
          subscriptionId: 'sub_123',
          targetPlanId: 'plan_456',
          targetPlanName: 'Pro Plan',
          changeDate: '2024-01-15',
          changeOption: 'immediate',
          scheduledAt: '2024-01-01T00:00:00Z',
        });
      };
      
      act(() => {
        setupState(result1.current);
        setupState(result2.current);
      });
      
      // Call logout on first store, reset on second
      act(() => {
        result1.current.logout();
        result2.current.reset();
      });
      
      // Both should have identical final state
      expect(result1.current.pendingPlanId).toBe(result2.current.pendingPlanId);
      expect(result1.current.customerId).toBe(result2.current.customerId);
      expect(result1.current.externalCustomerId).toBe(result2.current.externalCustomerId);
      expect(result1.current.selectedInstance).toBe(result2.current.selectedInstance);
      expect(result1.current.scheduledPlanChanges).toEqual(result2.current.scheduledPlanChanges);
    });
  });

  describe('Store Methods Availability', () => {
    it('should have all required methods available', () => {
      const { result } = renderHook(() => useCustomerStore());
      
      // Verify all methods exist and are functions
      expect(typeof result.current.setPendingPlanId).toBe('function');
      expect(typeof result.current.setCustomerId).toBe('function');
      expect(typeof result.current.setExternalCustomerId).toBe('function');
      expect(typeof result.current.setSelectedInstance).toBe('function');
      expect(typeof result.current.setScheduledPlanChange).toBe('function');
      expect(typeof result.current.removeScheduledPlanChange).toBe('function');
      expect(typeof result.current.getScheduledPlanChange).toBe('function');
      expect(typeof result.current.logout).toBe('function');
      expect(typeof result.current.reset).toBe('function');
    });

    it('should not throw when calling any method', () => {
      const { result } = renderHook(() => useCustomerStore());
      
      // These should not throw errors
      expect(() => {
        act(() => {
          result.current.setPendingPlanId(null);
          result.current.setCustomerId(null);
          result.current.setExternalCustomerId(null);
          result.current.setSelectedInstance(null);
          result.current.removeScheduledPlanChange('non-existent');
          result.current.getScheduledPlanChange('non-existent');
          result.current.logout();
          result.current.reset();
        });
      }).not.toThrow();
    });
  });
}); 