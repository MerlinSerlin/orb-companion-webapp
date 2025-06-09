// src/lib/plans/data.ts

// --- Interfaces ---
export interface EntitlementFeatureDisplay {
  name: string;
  value: string;
  perUnitDisplayName?: string;
}

export interface PlanUIDetail {
  plan_id: string;
  name: string;
  description: string;
  price: string;
  billingInterval?: 'month' | 'year' | null;
  features: EntitlementFeatureDisplay[];
  displayedEntitlementsOverride?: EntitlementFeatureDisplay[];
  allowedAddOnPriceIds?: string[];
  cta: string;
  popular: boolean;
}

export interface CompanyPlanData {
  companyName: string; // Remains useful for internal consistency if iterating over values
  logo: string; // Path to the company logo
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
  "Cloud_Infra": {
    companyName: "NimbusScale",
    logo: "/cloud.svg",
    uiPlans: [
      {
        plan_id: "YCzbKQqSz3N74yZM",
        name: "Starter",
        description: "For small projects and personal websites",
        price: "$0",
        billingInterval: null,
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
        plan_id: "bvVSqtKcsErM9Rxi",
        name: "Pro",
        description: "For growing businesses and high-traffic sites",
        price: "$99",
        billingInterval: "month",
        features: [
          { name: "Bandwidth", value: "500 GB" },
          { name: "Edge Requests", value: "5M requests" },
          { name: "Builds", value: "Unlimited" },
          { name: "Build Minutes", value: "1,000 minutes" },
        ],
        displayedEntitlementsOverride: [
          { name: "Nimbus Scale Bandwidth GB", value: "%%USE_DYNAMIC_VALUE%%", perUnitDisplayName: "gb" },
          { name: "Nimbus Scale Edge Requests", value: "5M requests", perUnitDisplayName: "edge request" },
          { name: "Nimbus Scale Builds", value: "Unlimited" },
          { name: "Nimbus Scale Build Minutes", value: "%%USE_DYNAMIC_VALUE%%", perUnitDisplayName: "build minute" },
          { name: "Concurrent Builds", value: "%%USE_DYNAMIC_VALUE%%" },
          { name: "Observability", value: "%%USE_DYNAMIC_VALUE%%" }
        ],
        allowedAddOnPriceIds: ["RmP4RPnRjGpTE29V"], // Observability price ID
        cta: "Select Pro",
        popular: true,
      },
      {
        plan_id: "bhmJBqKathJDQapv",
        name: "Enterprise",
        description: "For large-scale applications with high demands",
        price: "Custom",
        billingInterval: null,
        features: [
          { name: "SLAs", value: "24/7/365" },
          { name: "Priority Support", value: "24/7" },
          { name: "Multi-Region Deployments", value: "Available" },
          { name: "Faster Builds", value: "Enabled" },
          { name: "RBAC and SSO", value: "Available" },
        ],
        displayedEntitlementsOverride: [
          { name: "Nimbus Scale Bandwidth GB", value: "%%USE_DYNAMIC_VALUE%%", perUnitDisplayName: "gb" },
          { name: "Nimbus Scale Edge Requests", value: "5M requests", perUnitDisplayName: "edge request" },
          { name: "Nimbus Scale Builds", value: "Unlimited" },
          { name: "Nimbus Scale Build Minutes", value: "%%USE_DYNAMIC_VALUE%%", perUnitDisplayName: "build minute" },
          { name: "Concurrent Builds", value: "%%USE_DYNAMIC_VALUE%%" },
          { name: "Observability", value: "%%USE_DYNAMIC_VALUE%%" }
        ],
        allowedAddOnPriceIds: ["RmP4RPnRjGpTE29V"], // Observability price ID
        cta: "Contact Sales",
        popular: false,
      },
    ],
    // Order of features to display in the UI
    entitlementDisplayOrder: [
      "Nimbus Scale Bandwidth GB",
      "Nimbus Scale Build Minutes",
      "Nimbus Scale Builds",
      "Nimbus Scale Edge Requests",
      "Nimbus Scale Storage GB",
      "Observability",
      "Concurrent Builds"
    ],
  },
  "AI_Agents": {
    companyName: "Neural Prime",
    logo: "/brain.svg",
    uiPlans: [
      {
        plan_id: "HoDSRU6V3det4CbX",
        name: "Pay As You Go",
        description: "For Solo Builders",
        price: "$10 To Get Started",
        billingInterval: null,
        features: [
          { name: "Access to Standard Models", value: "Included" },
          { name: "On Demand Usage", value: "Included" },
          { name: "1000 Token Credits", value: "Included" },
          { name: "Premium Models Add-On", value: "Available" },
        ],
        displayedEntitlementsOverride: [
          { name: "1000 Token Credits", value: "Included" },
          { name: "Access to Standard Models", value: "Included" },
          { name: "Standard Models", value: ".05 Token Credits per Token Consumed" },
          { name: "Premium Models", value: "%%USE_DYNAMIC_VALUE%%" }
        ],
        allowedAddOnPriceIds: ['TEE8AfhNoSybQ8Nj'],
        cta: "Subscribe",
        popular: false,
      },
      {
        plan_id: "LKsipzW4a3pZ2csm",
        name: "Team",
        description: "For Teams of Builders",
        price: "$79",
        billingInterval: "month",
        features: [
          { name: "Access to All Models", value: "Included" },
          { name: "Multi-repository context", value: "Included" },
          { name: "Priority Support", value: "Included" },
          { name: "Centralized Billing", value: "Included" },
          { name: "10K Token Credits/Month", value: "($100 Value)" },
          { name: "Up to 20 Users", value: "$10/user/month" },
        ],
        displayedEntitlementsOverride: [
          { name: "10K Token Credits/Month", value: "Included" },
          { name: "Premium Models", value: ".25 Token Credits per Token Consumed" },
          { name: "Standard Models", value: ".05 Token Credits per Token Consumed" },
          { name: "Team Members", value: "%%USE_DYNAMIC_VALUE%%" },
        ],
        allowedAddOnPriceIds: [], // No add-ons for this plan yet
        cta: "Subscribe",
        popular: false,
      },
      {
        plan_id: "neural_prime_enterprise",
        name: "Enterprise",
        description: "For large-scale applications with high demands",
        price: "Custom",
        billingInterval: null,
        features: [
          { name: "24/7/365 Support", value: "Included" },
          { name: "SLAs", value: "Included" },
          { name: "Custom Pricing", value: "Available" },
          { name: "RBAC and SSO", value: "Available" },
        ],
        cta: "Contact Sales",
        popular: false,
      },
    ],
    entitlementDisplayOrder: [ /* ... */ ],  
  }
};

// --- Helper Function to Get Current Config (updated) ---
export const getCurrentCompanyConfig = (companyKey: string): CompanyPlanData => {
  if (!companyKey) {
    throw new Error('Company key is required but not provided. This indicates a bug in the application flow.');
  }
  
  const config = COMPANY_PLAN_CONFIGS_MAP[companyKey];
  if (!config) {
    console.error(`Configuration for company "${companyKey}" not found! Available keys: ${Object.keys(COMPANY_PLAN_CONFIGS_MAP).join(', ')}`);
    throw new Error(`Invalid company key: "${companyKey}". This indicates a bug in the application configuration.`);
  }
  return config;
};