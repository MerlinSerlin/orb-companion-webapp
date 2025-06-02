import { useCustomerStore } from '@/lib/store/customer-store';
import { ORB_INSTANCES } from '@/lib/orb-config';

// Add-on price mappings by instance/company
// This replaces the hardcoded approach with a structure that can grow
const ADD_ON_PRICE_MAPPINGS = {
  Cloud_Infra: {
    OBSERVABILITY_EVENTS: "AvVRaqgP9zNZWMpW", // Test price ID
    // Add more add-ons for Cloud_Infra here as needed
    // BACKUP_STORAGE: "another_price_id",
    // PREMIUM_SUPPORT: "yet_another_price_id"
  },
  AI_Agents: {
    PREMIUM_MODELS: "TEE8AfhNoSybQ8Nj", // Changed from PREMIUM_REQUESTS to match expected usage
    // Add AI-specific add-ons here
  }
} as const;

type AddOnMappings = typeof ADD_ON_PRICE_MAPPINGS;
type CompanyKeys = keyof AddOnMappings;

// Generic helper to get any add-on price ID by key - automatically uses selectedInstance
export const getAddOnPriceId = (addOnKey: string): string | null => {
  const selectedInstance = useCustomerStore.getState().selectedInstance;
  if (!selectedInstance) {
    console.error('❌ No instance selected in store for getAddOnPriceId. This indicates a bug in the application flow where an instance is expected.');
    throw new Error('Instance selection is required but not set.'); // Keeping this strict as it implies a flow error
  }
  
  const instanceConfig = ORB_INSTANCES[selectedInstance];
  const companyKey = instanceConfig.companyKey as CompanyKeys;
  
  const companyMappings = ADD_ON_PRICE_MAPPINGS[companyKey];
  if (!companyMappings) {
    console.warn(`No add-on mappings found for company: ${companyKey} and addOnKey: ${addOnKey}`);
    return null;
  }
  
  return (companyMappings as Record<string, string>)[addOnKey] || null;
};

// Generic helper to get all add-on mappings for current instance
export const getCurrentInstanceAddOns = (): Record<string, string> | null => {
  const selectedInstance = useCustomerStore.getState().selectedInstance;
  if (!selectedInstance) {
    console.error('❌ No instance selected in store for getCurrentInstanceAddOns. This indicates a bug where an instance is expected.');
    throw new Error('Instance selection is required but not set.'); // Keeping this strict
  }
  
  const instanceConfig = ORB_INSTANCES[selectedInstance];
  const companyKey = instanceConfig.companyKey;
  
  return ADD_ON_PRICE_MAPPINGS[companyKey as CompanyKeys] || null;
};

// Generic helper to find add-on key by price ID (reverse lookup)
export const getAddOnKeyByPriceId = (priceId: string): string | null => {
  const selectedInstance = useCustomerStore.getState().selectedInstance;
  // If no instance is selected, we cannot determine the company-specific mappings.
  // Return null to allow for broader utility, calling code must handle this.
  if (!selectedInstance) {
    console.warn('⚠️ No instance selected in store for getAddOnKeyByPriceId. Cannot resolve add-on key without instance context.');
    return null;
  }
  
  const instanceConfig = ORB_INSTANCES[selectedInstance];
   if (!instanceConfig) { // Should not happen if selectedInstance is valid from store
      console.error(`❌ Invalid selectedInstance in store: ${selectedInstance} used in getAddOnKeyByPriceId.`);
      return null;
  }
  const companyKey = instanceConfig.companyKey as CompanyKeys; // Ensure companyKey is a valid key
  
  const companyMappings = ADD_ON_PRICE_MAPPINGS[companyKey];
  
  if (!companyMappings) {
    // This might be normal if the priceId doesn't belong to an add-on for the current company
    // or if the company has no defined add-ons in the map.
    // console.log(`No add-on mappings found for company: ${companyKey} when looking up priceId: ${priceId}`);
    return null;
  }
  
  const addOnEntry = Object.entries(companyMappings).find(
    ([, id]) => id === priceId
  );
  return addOnEntry ? addOnEntry[0] : null;
};

// Helper to get a display-friendly name from an add-on key
export const getAddOnDisplayNameFromKey = (addOnKey: string): string => {
  if (!addOnKey) return "Unnamed Add-on";
  // Example: OBSERVABILITY_EVENTS -> Observability Events
  // Example: PREMIUM_MODELS -> Premium Models
  return addOnKey
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// For backwards compatibility during migration
export const getObservabilityEventsPrice = () => getAddOnPriceId('OBSERVABILITY_EVENTS');

// Readable constant for the observability events price ID
export const OBSERVABILITY_EVENTS_PRICE_ID = 'AvVRaqgP9zNZWMpW';
export const PREMIUM_MODELS_PRICE_ID = 'TEE8AfhNoSybQ8Nj';

// Better approach: use the generic functions directly
// const observabilityId = getAddOnPriceId('OBSERVABILITY_EVENTS');
// const premiumModelsId = getAddOnPriceId('PREMIUM_MODELS'); 
// const backupStorageId = getAddOnPriceId('BACKUP_STORAGE'); 