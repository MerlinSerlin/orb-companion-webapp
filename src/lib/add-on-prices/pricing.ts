import { useCustomerStore } from '@/lib/store/customer-store';
import { ORB_INSTANCES, isValidCompanyKey } from '@/lib/orb-config';

// Define a type for the structure of individual add-on configurations
export interface AddOnConfigDetail {
  priceId: string;
  activeDisplayValue?: string; // This is the new field for the specific display string
}

// Define the overall structure for ADD_ON_PRICE_MAPPINGS to ensure type safety
interface ConfiguredAddOnMappings {
  Cloud_Infra: {
    OBSERVABILITY: AddOnConfigDetail;
    // Potentially other Cloud_Infra add-ons defined here
  };
  AI_Agents: {
    PREMIUM_MODELS: AddOnConfigDetail;
    // Potentially other AI_Agents add-ons defined here
  };
}

// Add-on price mappings by instance/company using the new structure
const ADD_ON_PRICE_MAPPINGS: ConfiguredAddOnMappings = {
  Cloud_Infra: {
    OBSERVABILITY: { priceId: "RmP4RPnRjGpTE29V" }, // No specific activeDisplayValue needed here
  },
  AI_Agents: {
    PREMIUM_MODELS: {
      priceId: "TEE8AfhNoSybQ8Nj",
      activeDisplayValue: ".25 Token Credits per Token Consumed"
    },
  }
};

// Type to get the keys of the companies (Cloud_Infra, AI_Agents)
type CompanyKeys = keyof ConfiguredAddOnMappings;

// Type to get the keys of add-ons for a specific company
// Example: AddOnKeysFor<'AI_Agents'> would be "PREMIUM_MODELS"
type AddOnKeysFor<C extends CompanyKeys> = keyof ConfiguredAddOnMappings[C];

// Generic helper to get an add-on's price ID by its key
export const getAddOnPriceId = (addOnKey: string): string | null => {
  const selectedInstance = useCustomerStore.getState().selectedInstance;
  if (!selectedInstance) {
    console.error('❌ No instance selected for getAddOnPriceId.');
    throw new Error('Instance selection is required.');
  }

  const instanceConfig = ORB_INSTANCES[selectedInstance];
  
  if (!isValidCompanyKey(instanceConfig.companyKey)) {
    console.error(`Invalid company key: ${instanceConfig.companyKey}`);
    return null;
  }
  
  const companyKey = instanceConfig.companyKey;
  const companyMappings = ADD_ON_PRICE_MAPPINGS[companyKey];

  if (!companyMappings) {
    console.warn(`No add-on mappings found for company: ${companyKey}`);
    return null;
  }

  // Check if addOnKey exists in the company mappings
  if (!(addOnKey in companyMappings)) {
    console.warn(`Invalid addOnKey: ${addOnKey} for company: ${companyKey}`);
    return null;
  }
  
  const typedAddOnKey = addOnKey as AddOnKeysFor<typeof companyKey>;
  const addOnConfig = companyMappings[typedAddOnKey];

  if (!addOnConfig) {
    console.warn(`No configuration found for addOnKey: ${addOnKey} in company: ${companyKey}`);
    return null;
  }

  return (addOnConfig as AddOnConfigDetail).priceId;
};

// New helper function to get the entire config object for an add-on
export const getAddOnConfigByKey = (addOnKey: string): AddOnConfigDetail | null => {
  const selectedInstance = useCustomerStore.getState().selectedInstance;
  if (!selectedInstance) {
    // console.warn('⚠️ No instance selected for getAddOnConfigByKey.'); // Allow if context permits
    return null;
  }

  const instanceConfig = ORB_INSTANCES[selectedInstance];
  if (!isValidCompanyKey(instanceConfig.companyKey)) {
    console.error(`Invalid company key: ${instanceConfig.companyKey}`);
    return null;
  }
  
  const companyKey = instanceConfig.companyKey;
  const companyMappings = ADD_ON_PRICE_MAPPINGS[companyKey];

  if (!companyMappings) {
    // console.warn(`No add-on mappings found for company: ${companyKey} in getAddOnConfigByKey`);
    return null;
  }
  
  // Check if addOnKey exists in the company mappings
  if (!(addOnKey in companyMappings)) {
    // console.warn(`Invalid addOnKey: ${addOnKey} for company: ${companyKey}`);
    return null;
  }
  
  const typedAddOnKey = addOnKey as AddOnKeysFor<typeof companyKey>;
  const addOnConfig = companyMappings[typedAddOnKey];

  if (!addOnConfig) {
    // console.warn(`No add-on configuration found for addOnKey: ${addOnKey} in company: ${companyKey}`);
    return null;
  }
  return addOnConfig;
};

// Generic helper to get all add-on configurations for the current instance
export const getCurrentInstanceAddOns = (): ConfiguredAddOnMappings[CompanyKeys] | null => {
  const selectedInstance = useCustomerStore.getState().selectedInstance;
  if (!selectedInstance) {
    console.error('❌ No instance selected for getCurrentInstanceAddOns.');
    throw new Error('Instance selection is required.');
  }

  const instanceConfig = ORB_INSTANCES[selectedInstance];
  
  if (!isValidCompanyKey(instanceConfig.companyKey)) {
    console.error(`Invalid company key: ${instanceConfig.companyKey}`);
    return null;
  }
  
  const companyKey = instanceConfig.companyKey;

  return ADD_ON_PRICE_MAPPINGS[companyKey] || null;
};

// Generic helper to find an add-on key by its price ID
export const getAddOnKeyByPriceId = (priceId: string): string | null => {
  const selectedInstance = useCustomerStore.getState().selectedInstance;
  if (!selectedInstance) {
    console.warn('⚠️ No instance selected for getAddOnKeyByPriceId.');
    return null;
  }

  const instanceConfig = ORB_INSTANCES[selectedInstance];
  if (!instanceConfig) {
    console.error(`❌ Invalid selectedInstance: ${selectedInstance} in getAddOnKeyByPriceId.`);
    return null;
  }
  
  if (!isValidCompanyKey(instanceConfig.companyKey)) {
    console.error(`Invalid company key: ${instanceConfig.companyKey}`);
    return null;
  }
  
  const companyKey = instanceConfig.companyKey;
  const companyMappings = ADD_ON_PRICE_MAPPINGS[companyKey];

  if (!companyMappings) {
    return null;
  }

  for (const [addOnKey, config] of Object.entries(companyMappings)) {
    if (config.priceId === priceId) {
      return addOnKey;
    }
  }
  return null;
};

// Helper to get a display-friendly name from an add-on key
export const getAddOnDisplayNameFromKey = (addOnKey: string): string => {
  if (!addOnKey) return "Unnamed Add-on";
  return addOnKey
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Constants for well-known price IDs can still be useful
export const OBSERVABILITY_PRICE_ID = ADD_ON_PRICE_MAPPINGS.Cloud_Infra.OBSERVABILITY.priceId;
export const PREMIUM_MODELS_PRICE_ID = ADD_ON_PRICE_MAPPINGS.AI_Agents.PREMIUM_MODELS.priceId;
// Note: The constant PREMIUM_REQUESTS_PRICE_ID was pointing to the same ID as PREMIUM_MODELS.
// Using PREMIUM_MODELS_PRICE_ID for clarity as the key in mappings is PREMIUM_MODELS. 