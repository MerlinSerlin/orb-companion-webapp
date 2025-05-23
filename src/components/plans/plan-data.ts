// src/components/plans/plan-data.ts

// --- Imports ---
import { OBSERVABILITY_EVENTS_PRICE_ID } from '@/lib/data/add-on-prices';

// --- Interfaces ---
export interface EntitlementFeatureDisplay {
  name: string;
  value: string;
}

export interface PlanUIDetail {
  plan_id: string;
  name: string;
  description: string;
  price: string;
  features: EntitlementFeatureDisplay[];
  allowedAddOnPriceIds?: string[];
  cta: string;
  popular: boolean;
}

export interface CompanyPlanData {
  companyName: string; // Remains useful for internal consistency if iterating over values
  uiPlans: PlanUIDetail[];
  entitlementDisplayOrder: string[];
  // TODO: Consider adding company-specific add-on price IDs here later
}

// New interface for the map structure
export interface CompanyConfigsMap {
  [companyName: string]: CompanyPlanData; // Index signature
}

// --- Main Configuration Object/Map ---
export const COMPANY_PLAN_CONFIGS_MAP: CompanyConfigsMap = {
  "NimbusScale": {
    companyName: "NimbusScale",
    uiPlans: [
      {
        plan_id: "kRDwGmuatwQJdNLY",
        name: "Starter",
        description: "For small projects and personal websites",
        price: "$0",
        features: [
          { name: "Bandwidth", value: "100 GB" },
          { name: "Edge Requests", value: "1M requests" },
          { name: "Storage", value: "10 GB" },
          { name: "Builds", value: "100 per month" },
          { name: "Build Minutes", value: "300 minutes" },
        ],
        allowedAddOnPriceIds: [],
        cta: "Select Starter",
        popular: false,
      },
      {
        plan_id: "egBAFXj9pykJhyeA",
        name: "Pro",
        description: "For growing businesses and high-traffic sites",
        price: "$99",
        features: [
          { name: "Bandwidth", value: "500 GB" },
          { name: "Edge Requests", value: "5M requests" },
          { name: "Storage", value: "50 GB" },
          { name: "Builds", value: "Unlimited" },
          { name: "Build Minutes", value: "1,000 minutes" },
        ],
        allowedAddOnPriceIds: [OBSERVABILITY_EVENTS_PRICE_ID],
        cta: "Select Pro",
        popular: true,
      },
      {
        plan_id: "nimbus_scale_enterprise",
        name: "Enterprise",
        description: "For large-scale applications with high demands",
        price: "",
        features: [
          { name: "SLAs", value: "24/7/365" },
          { name: "Priority Support", value: "24/7" },
          { name: "Multi-Region Deployments", value: "Available" },
          { name: "Faster Builds", value: "Enabled" },
          { name: "RBAC and SSO", value: "Available" },
        ],
        allowedAddOnPriceIds: [OBSERVABILITY_EVENTS_PRICE_ID],
        cta: "Contact Sales",
        popular: false,
      },
    ],
    // Order of features to display in the UI
    entitlementDisplayOrder: [
      "Bandwidth GB",
      "Build Minutes",
      "Builds",
      "Edge Requests",
      "Storage GB",
      "Observability Events",
      "Concurrent Builds"
    ],
  },
  // Example for another company:
  // "AnotherCompany": {
  //   companyName: "AnotherCompany",
  //   uiPlans: [ /* ... */ ],
  //   entitlementDisplayOrder: [ /* ... */ ],
  // }
};

// --- Helper Function to Get Current Config (updated) ---
export const getCurrentCompanyConfig = (companyKey: string = "NimbusScale"): CompanyPlanData => {
  const config = COMPANY_PLAN_CONFIGS_MAP[companyKey];
  if (!config) {
    console.error(`Configuration for company "${companyKey}" not found! Defaulting to NimbusScale or first available.`);
    // Fallback to NimbusScale if specific key not found, or the first config if NimbusScale itself is missing.
    return COMPANY_PLAN_CONFIGS_MAP["NimbusScale"] || Object.values(COMPANY_PLAN_CONFIGS_MAP)[0] || {
      companyName: "DefaultFallback",
      uiPlans: [],
      entitlementDisplayOrder: []
    };
  }
  return config;
};

// --- Exports for Backwards Compatibility / Current Usage ---
// Defaulting to "NimbusScale" for current direct exports.
// If you introduce a dynamic way to set the current company context, this could use that.
export const PLAN_DETAILS: PlanUIDetail[] = getCurrentCompanyConfig("NimbusScale").uiPlans;
export const DESIRED_ENTITLEMENT_ORDER: string[] = getCurrentCompanyConfig("NimbusScale").entitlementDisplayOrder;


// --- Add-On Price IDs --- 
// (Existing content, if any, remains here)





