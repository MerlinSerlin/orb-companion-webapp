import { formatDate, formatNumber, formatCurrencyValue } from '@/lib/utils/formatters';
import type { Subscription, PriceInterval, FixedFeeQuantityTransition } from '@/lib/types';
import { getAddOnKeyByPriceId, getAddOnDisplayNameFromKey } from '@/lib/add-on-prices';

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

// The ExtendedPriceInterval might be redundant if PriceInterval from types.ts already has fixed_fee_quantity_transitions
// For now, let's assume PriceInterval from types.ts is sufficient or ExtendedPriceInterval has other uses not shown.
// If ExtendedPriceInterval is solely to add fixed_fee_quantity_transitions, it could be removed and direct casting used.
// For safety, keeping it but ensuring it uses the imported type.
interface ExtendedPriceInterval extends PriceInterval {
  // This property should be compatible if PriceInterval from types.ts has the same (or compatible) field
  // and FixedFeeQuantityTransition is correctly imported.
  fixed_fee_quantity_transitions?: FixedFeeQuantityTransition[] | null; 
}

export function deriveEntitlementsFromSubscription(
  subscription: Subscription | null, 
  entitlementDisplayOrder: string[] = []
): EntitlementFeature[] {
  if (!subscription?.price_intervals) {
    return [];
  }

  const entitlementFeatures: EntitlementFeature[] = [];
  const today = new Date().toISOString().split('T')[0]; // Get today's date for comparison

  subscription.price_intervals.forEach(interval => {
    // Cast to ExtendedPriceInterval if it provides a more specific version of fixed_fee_quantity_transitions
    // or if direct access to interval.fixed_fee_quantity_transitions is fine (if type is directly on PriceInterval)
    const currentInterval = interval as ExtendedPriceInterval; // Use the potentially more specific type
    const price = currentInterval.price;

    if (!price || !price.item || price.item.name === "Platform Fee") {
      return; // Skip Platform Fee
    }

    // Get the add-on key and desired display name
    const addOnKey = getAddOnKeyByPriceId(price.id);
    const finalDisplayName = addOnKey ? getAddOnDisplayNameFromKey(addOnKey) : price.item.name.replace(/^Nimbus Scale\s+/, ''); // Fallback if not a mapped add-on

    // Use the original item name for unit heuristic
    const originalItemNameForUnitHeuristic = price.item.name.replace(/^Nimbus Scale\s+/, '');

    let baseValue = "Included"; // Default baseValue
    let overageInfo: string | undefined = undefined;
    let rawQuantity: number | undefined = undefined;
    let rawOveragePrice: number | undefined = undefined;
    
    let statusText: string | null = null; // Initialize statusText
    let allFutureTransitions: FixedFeeQuantityTransition[] | undefined = undefined; // Initialize new field
    let tierDetails: TierDetail[] | undefined = undefined; // Store tier details
    let showDetailed: boolean = false; // Flag for detailed view

    let unitNameForPackageDetail = 'units'; // Default
    if (originalItemNameForUnitHeuristic.toLowerCase().includes('event')) {
      unitNameForPackageDetail = 'events';
    } else if (originalItemNameForUnitHeuristic.toLowerCase().includes('request')) {
      unitNameForPackageDetail = 'requests';
    } else if (originalItemNameForUnitHeuristic.toLowerCase().includes('model')) {
      unitNameForPackageDetail = 'models';
    }
    // Add more heuristics as needed, or consider a more robust mapping

    // --- Determine CURRENT quantity and base value --- 
    if (price.price_type === 'fixed_price' && typeof price.fixed_price_quantity === 'number') {
      rawQuantity = price.fixed_price_quantity;
      baseValue = formatNumber(rawQuantity);
      if (price.model_type === 'tiered' && price.tiered_config?.tiers && price.tiered_config.tiers.length > 1) {
        const overageTier = price.tiered_config.tiers[1];
        if (overageTier && overageTier.unit_amount && parseFloat(overageTier.unit_amount) > 0) {
          let perUnit = 'additional unit';
          if (price.item.name.includes('Build')) perUnit = 'build';
          const overageAmount = parseFloat(overageTier.unit_amount);
          rawOveragePrice = overageAmount;
          overageInfo = `(then ${formatCurrencyValue(overageAmount, price.currency, { itemName: perUnit, decimalPlaces: 2 })})`;
        }
      } else if (price.model_type === 'unit' && price.unit_config?.unit_amount) {
        // For fixed_price with unit model, the unit_amount is the price per unit.
        // This can be considered the "overage price" for each additional unit beyond any included base.
        const unitCost = parseFloat(price.unit_config.unit_amount);
        if (unitCost >= 0) { // Allow 0 for free additional units if configured that way
          rawOveragePrice = unitCost;
          // Overage info might not be needed if the baseValue already implies per unit cost or if it's just a quantity.
          // For now, let's ensure rawOveragePrice is set for the dialog.
          // overageInfo = `(${formatCurrencyValue(unitCost, price.currency, { itemName: price.item.name.toLowerCase(), decimalPlaces: 2 })})`;
        }
      }
    } else if (price.price_type === 'usage_price') {
      // const itemUnitName = price.item?.name || 'events'; // This specific variable might not be needed here if handled by model_type

      if (price.model_type === 'tiered_package' && price.tiered_package_config?.tiers && price.tiered_package_config.tiers.length > 0) {
        const tiers = price.tiered_package_config.tiers;
        const firstTier = tiers[0];

        if (firstTier) {
          if (firstTier.package_amount === "0.00" && typeof firstTier.last_unit === 'number') {
            baseValue = `First ${formatNumber(firstTier.last_unit)} ${unitNameForPackageDetail}: Free`;
          } else if (typeof firstTier.last_unit === 'number' && typeof firstTier.package_size === 'number' && firstTier.package_size > 0) { 
            // Use formatCurrencyValue for tiered_package model baseValue
            const formattedPackagePrice = formatCurrencyValue(firstTier.package_amount, price.currency, { itemName: `${formatNumber(firstTier.package_size)} ${unitNameForPackageDetail}` });
            baseValue = `First ${formatNumber(firstTier.last_unit)} ${unitNameForPackageDetail}: ${formattedPackagePrice}`;
          } else if (typeof firstTier.package_size === 'number' && firstTier.package_size > 0) {
            // Use formatCurrencyValue for tiered_package model baseValue (catch-all first tier)
            baseValue = formatCurrencyValue(firstTier.package_amount, price.currency, { itemName: `${formatNumber(firstTier.package_size)} ${unitNameForPackageDetail}` });
          } else {
             baseValue = "Usage-based (tiered package)"; // Fallback for unexpected first tier
          }

          if (tiers.length > 1) {
            const overageTier = tiers[1];
            // Ensure package_size is a positive number before formatting
            if (overageTier && parseFloat(overageTier.package_amount) >= 0 && typeof overageTier.package_size === 'number' && overageTier.package_size > 0) {
              // Use formatCurrencyValue for tiered_package model overageInfo
              overageInfo = `(then ${formatCurrencyValue(overageTier.package_amount, price.currency, { itemName: `${formatNumber(overageTier.package_size)} ${unitNameForPackageDetail}` })})`;
            }
          }
        } else {
          baseValue = "Usage-based (tiered package)"; // Fallback if no tiers defined
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
      } else if (addOnKey === 'PREMIUM_REQUESTS' && price.model_type === 'unit') {
        // Specific handling for Premium Requests display text
        baseValue = ".25 Token Credits per Token Consumed";
        overageInfo = undefined; // Ensure no conflicting overage info
        // We can also set rawOveragePrice if needed for other parts of the UI, e.g., dialogs
        if (price.unit_config?.unit_amount) {
          rawOveragePrice = parseFloat(price.unit_config.unit_amount); 
        }
      } else if (price.model_type === 'tiered' && price.tiered_config?.tiers) {
        const tiers = price.tiered_config.tiers;
        
        // Always show detailed tier information for tiered pricing
        if (tiers.length > 0) {
          tierDetails = []; // Initialize tierDetails array
          const perItemNameForTier = price.item?.name || 'unit'; // The item it's "per"
          
          tiers.forEach((tier) => {
            const unitAmount = tier.unit_amount ? parseFloat(tier.unit_amount) : 0;
            let range = '';
            
            // Determine range with proper null checks and infinity symbol
            if (typeof tier.first_unit === 'number' && typeof tier.last_unit === 'number') {
              range = `${formatNumber(tier.first_unit)} - ${formatNumber(tier.last_unit)}`;
            } else if (typeof tier.first_unit === 'number' && tier.last_unit === null) {
              range = `${formatNumber(tier.first_unit)} - ∞`;
            } else if (typeof tier.last_unit === 'number') {
              range = `0 - ${formatNumber(tier.last_unit)}`;
            }
            
            // Format rate
            let rate = '';
            if (unitAmount === 0) {
              rate = 'Free';
            } else {
              // For tiered, display as "AMOUNT CURRENCY per PER_ITEM_NAME"
              // formatCurrencyValue handles the AMOUNT CURRENCY part, then we append "per item_name"
              const amountAndCurrency = formatCurrencyValue(unitAmount, price.currency, { decimalPlaces: (unitAmount < 0.01 && unitAmount > 0) ? undefined : 2 }); // Use more decimals for small amounts
              rate = `${amountAndCurrency} per ${perItemNameForTier.toLowerCase()}`;
            }
            
            tierDetails!.push({
              range,
              rate,
              unitAmount
            });
          });
          
          // Always set detailed view for tiered pricing
          baseValue = 'Tier Details';
          overageInfo = undefined;
          showDetailed = true;
        }
      } else if (price.model_type === 'unit') {
        // Generic unit price logic (for items other than PREMIUM_REQUESTS)
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

    // --- Determine statusText and allFutureTransitions --- 
    if (price.price_type === 'fixed_price') {
        if (currentInterval.fixed_fee_quantity_transitions && currentInterval.fixed_fee_quantity_transitions.length > 0) {
            const futureTransitions = currentInterval.fixed_fee_quantity_transitions.filter(
                (t: FixedFeeQuantityTransition) => t.effective_date > today // Only consider future transitions
            );
            futureTransitions.sort((a: FixedFeeQuantityTransition, b: FixedFeeQuantityTransition) => 
                new Date(a.effective_date).getTime() - new Date(b.effective_date).getTime()
            );
            
            if (futureTransitions.length > 0) {
                const nextChange = futureTransitions[0];
                statusText = `Scheduled change to ${formatNumber(nextChange.quantity)} on ${formatDate(nextChange.effective_date)}`;
                allFutureTransitions = futureTransitions; // Store all future transitions
            }
        }
    } else if (price.price_type === 'usage_price') {
        if (currentInterval.start_date) {
            // Only show statusText if the start date is in the future
            if (currentInterval.start_date > today) { 
                statusText = `Starts on ${formatDate(currentInterval.start_date)}`;
            }
            // If currentInterval.start_date is today or in the past, statusText remains null
        }
    }

    // Define item names that are fixed price but should not be user-adjustable in the UI
    const NON_ADJUSTABLE_FIXED_PRICE_ITEM_NAMES = ["Included Allocation (Tok-CR)"];

    entitlementFeatures.push({
      priceId: price.id,
      priceIntervalId: currentInterval.id,
      name: finalDisplayName, // Use the name derived from add-on mapping or fallback
      baseValue: baseValue,
      overageInfo: overageInfo,
      rawQuantity: rawQuantity,
      rawOveragePrice: rawOveragePrice,
      statusText: statusText,
      allFutureTransitions: allFutureTransitions,
      tierDetails: tierDetails || undefined,
      showDetailed: showDetailed,
      isAdjustableFixedPrice: price.price_type === 'fixed_price' && 
                                price.item.name !== 'Platform Fee' &&
                                !NON_ADJUSTABLE_FIXED_PRICE_ITEM_NAMES.includes(price.item.name),
      priceModelType: price.model_type,
    });
  });

  // Sort the features based on the entitlementDisplayOrder
  entitlementFeatures.sort((a, b) => {
    const indexA = entitlementDisplayOrder.indexOf(a.name);
    const indexB = entitlementDisplayOrder.indexOf(b.name);

    // If both items are in the desired order list, sort by their index
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }
    // If only A is in the list, A comes first
    if (indexA !== -1) {
      return -1;
    }
    // If only B is in the list, B comes first
    if (indexB !== -1) {
      return 1;
    }
    // If neither is in the list, keep their relative order (or sort by name as a fallback)
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

export const formatActiveSubscriptionWithUsage = () => {
  // TODO: Implementation of the function
  // This function was previously declared but not implemented
  return null;
} 