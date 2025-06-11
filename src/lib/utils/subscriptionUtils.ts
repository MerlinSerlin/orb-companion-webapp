import { formatNumber, formatCurrencyValue, formatDate } from '@/lib/utils/formatters';
import type { Subscription, FixedFeeQuantityTransition, Price, PriceTier, PriceInterval } from '@/lib/types';
import { getAddOnKeyByPriceId, getAddOnDisplayNameFromKey, getAddOnConfigByKey } from '@/lib/add-on-prices/pricing';

// Define the structure for individual tier details
export interface TierDetail {
  range: string; // e.g., "0 - 100,000", "100,000 - 250,000", "250,000+"
  rate: string;  // e.g., "1 Tok-CR", "0.97 Tok-CR"
  unitAmount: number; // Raw numeric value for calculations
}

// Define the structure for the derived entitlement feature
export interface EntitlementFeature {
  priceId?: string;
  priceIntervalId?: string;
  name: string;
  baseValue: string;
  overageInfo?: string;
  rawQuantity?: number;
  rawOveragePrice?: number;
  statusText?: string | null;
  allFutureTransitions?: FixedFeeQuantityTransition[] | undefined;
  tierDetails?: TierDetail[]; // New field for detailed tier information
  showDetailed?: boolean;     // Flag to control whether to show detailed or simple view
  isAdjustableFixedPrice?: boolean; // New flag for adjustable fixed price items
  priceModelType?: string; // New: To distinguish unit vs tiered fixed prices etc.
}

export interface EntitlementOverrideConfig {
  value?: string; // Existing dynamic value placeholder or static text
  perUnitDisplayName?: string;
}

export function deriveEntitlementsFromSubscription(
  subscription: Subscription | null, 
  entitlementDisplayOrder: string[] = [],
  entitlementOverridesConfig: Map<string, EntitlementOverrideConfig> = new Map()
): EntitlementFeature[] {
  if (!subscription?.plan?.prices || !subscription?.price_intervals) {
    return [];
  }

  const entitlementFeatures: EntitlementFeature[] = [];
  const today = new Date().toISOString().split('T')[0];

  // Create a map of active price intervals by price ID for quick lookup
  const activePriceIntervals = new Map<string, PriceInterval>();
  subscription.price_intervals
    .filter(interval => !interval.end_date) // Only active intervals
    .forEach(interval => {
      if (interval.price?.id) {
        activePriceIntervals.set(interval.price.id, interval);
      }
    });

  // Process plan prices (base plan definition)
  subscription.plan.prices.forEach((price: Price) => {
    if (!price || !price.item || price.item.name === "Platform Fee") {
      return; // Skip Platform Fee
    }

    // Find the corresponding active price interval
    const activeInterval = activePriceIntervals.get(price.id);
    
    const entitlementFeature = createEntitlementFeature(
      price, 
      activeInterval?.id, // Use price interval ID for adjustments
      activeInterval?.fixed_fee_quantity_transitions,
      activeInterval?.start_date,
      entitlementOverridesConfig,
      today
    );
    
    if (entitlementFeature) {
      entitlementFeatures.push(entitlementFeature);
    }
  });

  // Add any price intervals that don't have corresponding plan prices (add-ons)
  subscription.price_intervals
    .filter(interval => !interval.end_date) // Only active intervals
    .forEach(interval => {
      const price = interval.price;
      if (!price || !price.item || price.item.name === "Platform Fee") {
        return;
      }

      // Check if this price was already processed from plan prices
      const alreadyProcessed = subscription.plan?.prices?.some(planPrice => planPrice.id === price.id);
      if (alreadyProcessed) {
        return;
      }

      // This is an add-on - process it
      const entitlementFeature = createEntitlementFeature(
        price,
        interval.id, // Use price interval ID
        interval.fixed_fee_quantity_transitions,
        interval.start_date,
        entitlementOverridesConfig,
        today
      );
      
      if (entitlementFeature) {
        entitlementFeatures.push(entitlementFeature);
      }
    });

  // Sort and organize features
  entitlementFeatures.sort((a, b) => {
    const indexA = entitlementDisplayOrder.indexOf(a.name);
    const indexB = entitlementDisplayOrder.indexOf(b.name);

    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }
    if (indexA !== -1) {
      return -1;
    }
    if (indexB !== -1) {
      return 1;
    }
    return a.name.localeCompare(b.name);
  });

  // Move "Concurrent Builds" to the end if it exists
  const concurrentBuildsIndex = entitlementFeatures.findIndex(feat => feat.name === 'Concurrent Builds');
  if (concurrentBuildsIndex > -1) {
    const [concurrentBuildsFeature] = entitlementFeatures.splice(concurrentBuildsIndex, 1);
    entitlementFeatures.push(concurrentBuildsFeature);
  }

  return entitlementFeatures;
}

// Helper function to create an entitlement feature from a price
function createEntitlementFeature(
  price: Price,
  priceIntervalId: string | undefined,
  fixedFeeQuantityTransitions: FixedFeeQuantityTransition[] | null | undefined,
  startDate: string | null | undefined,
  entitlementOverridesConfig: Map<string, EntitlementOverrideConfig>,
  today: string
): EntitlementFeature | null {
  // Get the add-on key and desired display name
  const addOnKey = getAddOnKeyByPriceId(price.id);
  const finalDisplayName = addOnKey ? getAddOnDisplayNameFromKey(addOnKey) : price.item!.name;
  const addOnConfig = addOnKey ? getAddOnConfigByKey(addOnKey) : null;

  // Use the original item name for unit heuristic
  const originalItemNameForUnitHeuristic = price.item!.name;

  let baseValue = "Included"; // Default baseValue
  let overageInfo: string | undefined = undefined;
  let rawQuantity: number | undefined = undefined;
  let rawOveragePrice: number | undefined = undefined;
  let statusText: string | null = null;
  let allFutureTransitions: FixedFeeQuantityTransition[] | undefined = undefined;
  
  let tierDetails: TierDetail[] | undefined = undefined;
  let showDetailed: boolean = false;

  let unitNameForPackageDetail = 'units'; // Default
  if (originalItemNameForUnitHeuristic.toLowerCase().includes('event')) {
    unitNameForPackageDetail = 'events';
  } else if (originalItemNameForUnitHeuristic.toLowerCase().includes('request')) {
    unitNameForPackageDetail = 'requests';
  } else if (originalItemNameForUnitHeuristic.toLowerCase().includes('model')) {
    unitNameForPackageDetail = 'models';
  }

  // Handle status text and future transitions for fixed prices
  if (price.price_type === 'fixed_price') {
    if (fixedFeeQuantityTransitions && fixedFeeQuantityTransitions.length > 0) {
      const futureTransitions = fixedFeeQuantityTransitions.filter(
        (t: FixedFeeQuantityTransition) => t.effective_date > today
      );
      futureTransitions.sort((a: FixedFeeQuantityTransition, b: FixedFeeQuantityTransition) => 
        new Date(a.effective_date).getTime() - new Date(b.effective_date).getTime()
      );
      
      if (futureTransitions.length > 0) {
        const nextChange = futureTransitions[0];
        statusText = `Scheduled change to ${formatNumber(nextChange.quantity)} on ${formatDate(nextChange.effective_date)}`;
        allFutureTransitions = futureTransitions;
      }
    }
  } else if (price.price_type === 'usage_price') {
    if (startDate && startDate > today) {
      statusText = `Starts on ${formatDate(startDate)}`;
    }
  }

  // Process pricing logic (same as before)
  if (price.price_type === 'fixed_price' && typeof price.fixed_price_quantity === 'number') {
    rawQuantity = price.fixed_price_quantity;
    baseValue = formatNumber(rawQuantity);
    if (price.model_type === 'tiered' && price.tiered_config?.tiers && price.tiered_config.tiers.length > 1) {
      const overageTier = price.tiered_config.tiers[1];
      if (overageTier && overageTier.unit_amount && parseFloat(overageTier.unit_amount) > 0) {
        let perUnit = 'additional unit';
        if (price.item!.name.includes('Build')) perUnit = 'build';
        const overageAmount = parseFloat(overageTier.unit_amount);
        rawOveragePrice = overageAmount;
        overageInfo = `(then ${formatCurrencyValue(overageAmount, price.currency, { itemName: perUnit, decimalPlaces: 2 })})`;
      }
    } else if (price.model_type === 'unit' && price.unit_config?.unit_amount) {
      const unitCost = parseFloat(price.unit_config.unit_amount);
      if (unitCost >= 0) {
        rawOveragePrice = unitCost;
      }
    }
  } else if (price.price_type === 'usage_price') {
    if (addOnConfig?.activeDisplayValue) {
      baseValue = addOnConfig.activeDisplayValue;
      overageInfo = undefined;
      if (price.model_type === 'unit' && price.unit_config?.unit_amount) {
        rawOveragePrice = parseFloat(price.unit_config.unit_amount);
      }
    } else if (price.model_type === 'tiered_package' && price.tiered_package_config?.tiers && price.tiered_package_config.tiers.length > 0) {
      const tiers = price.tiered_package_config.tiers;
      const firstTier = tiers[0];

      if (firstTier) {
        if (firstTier.package_amount === "0.00" && typeof firstTier.last_unit === 'number') {
          baseValue = `First ${formatNumber(firstTier.last_unit)} ${unitNameForPackageDetail}: Free`;
        } else if (typeof firstTier.last_unit === 'number' && typeof firstTier.package_size === 'number' && firstTier.package_size > 0) { 
          const formattedPackagePrice = formatCurrencyValue(firstTier.package_amount, price.currency, { itemName: `${formatNumber(firstTier.package_size)} ${unitNameForPackageDetail}` });
          baseValue = `First ${formatNumber(firstTier.last_unit)} ${unitNameForPackageDetail}: ${formattedPackagePrice}`;
        } else if (typeof firstTier.package_size === 'number' && firstTier.package_size > 0) {
          baseValue = formatCurrencyValue(firstTier.package_amount, price.currency, { itemName: `${formatNumber(firstTier.package_size)} ${unitNameForPackageDetail}` });
        } else {
          baseValue = "Usage-based (tiered package)";
        }

        if (tiers.length > 1) {
          const overageTier = tiers[1];
          if (overageTier && parseFloat(overageTier.package_amount) >= 0 && typeof overageTier.package_size === 'number' && overageTier.package_size > 0) {
            overageInfo = `(then ${formatCurrencyValue(overageTier.package_amount, price.currency, { itemName: `${formatNumber(overageTier.package_size)} ${unitNameForPackageDetail}` })})`;
          }
        }
      } else {
        baseValue = "Usage-based (tiered package)";
      }
    } else if (price.model_type === 'package' && price.package_config) {
      const { package_amount, package_size } = price.package_config;

      if (package_amount === "0.00" && typeof package_size === 'number' && package_size > 0) {
        baseValue = `${formatNumber(package_size)} ${unitNameForPackageDetail}: Free`;
        overageInfo = undefined;
      } 
      else if (parseFloat(package_amount) > 0 && typeof package_size === 'number' && package_size > 0) {
        baseValue = formatCurrencyValue(package_amount, price.currency, { itemName: `${formatNumber(package_size)} ${unitNameForPackageDetail}` });
        overageInfo = undefined;
      } else {
        baseValue = "Usage-based (package)";
        overageInfo = undefined;
      }
    } else if (price.model_type === 'tiered' && price.tiered_config?.tiers) {
      const tiers = price.tiered_config.tiers;
      
      if (tiers.length > 0) {
        tierDetails = [];
        
        const overrideConfig = entitlementOverridesConfig.get(finalDisplayName);
        const perItemNameForTier = overrideConfig?.perUnitDisplayName || price.item?.name || 'unit';
        
        tiers.forEach((tier: PriceTier) => {
          const unitAmount = tier.unit_amount ? parseFloat(tier.unit_amount) : 0;
          let range = '';
          
          if (typeof tier.first_unit === 'number' && typeof tier.last_unit === 'number') {
            range = `${formatNumber(tier.first_unit)} - ${formatNumber(tier.last_unit)}`;
          } else if (typeof tier.first_unit === 'number' && tier.last_unit === null) {
            range = `${formatNumber(tier.first_unit)} - ∞`;
          } else if (typeof tier.last_unit === 'number') {
            range = `0 - ${formatNumber(tier.last_unit)}`;
          }
          
          let rate = '';
          if (unitAmount === 0) {
            rate = 'Free';
          } else {
            const amountAndCurrency = formatCurrencyValue(unitAmount, price.currency, { decimalPlaces: (unitAmount < 0.01 && unitAmount > 0) ? undefined : 2 });
            rate = `${amountAndCurrency} per ${perItemNameForTier.toLowerCase()}`;
          }
          
          tierDetails!.push({
            range,
            rate,
            unitAmount
          });
        });
        
        baseValue = 'Tier Details';
        overageInfo = undefined;
        showDetailed = true;
      }
    } else if (price.model_type === 'unit') {
      const unitAmount = price.unit_config?.unit_amount;
      const itemNameOrUnit = price.item?.name || 'unit';
      if (unitAmount && parseFloat(unitAmount) > 0) {
        baseValue = formatCurrencyValue(unitAmount, price.currency, { itemName: itemNameOrUnit });
      } else {
        baseValue = 'Included';
      }
      const isZeroCostUnit = unitAmount == null || unitAmount === '0' || unitAmount === '0.00';
      if (isZeroCostUnit) {
        overageInfo = 'Unlimited'; 
      }
    }
  }

  const NON_ADJUSTABLE_FIXED_PRICE_ITEM_NAMES = ["Included Allocation (Tok-CR)"];

  return {
    priceId: price.id,
    priceIntervalId: priceIntervalId, // Now comes from active price interval
    name: finalDisplayName,
    baseValue: baseValue,
    overageInfo: overageInfo,
    rawQuantity: rawQuantity,
    rawOveragePrice: rawOveragePrice,
    statusText: statusText,
    allFutureTransitions: allFutureTransitions,
    tierDetails: tierDetails || undefined,
    showDetailed: showDetailed,
    isAdjustableFixedPrice: price.price_type === 'fixed_price' && 
                              price.item!.name !== 'Platform Fee' &&
                              !NON_ADJUSTABLE_FIXED_PRICE_ITEM_NAMES.includes(price.item!.name),
    priceModelType: price.model_type,
  };
}

export const formatActiveSubscriptionWithUsage = () => {
  // TODO: Implementation of the function
  // This function was previously declared but not implemented
  return null;
} 