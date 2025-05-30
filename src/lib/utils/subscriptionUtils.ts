import type { Subscription, PriceInterval, FixedFeeQuantityTransition } from "@/lib/types";
import { formatNumber, formatDate } from "./formatters";
import { DESIRED_ENTITLEMENT_ORDER } from "../../components/plans/plan-data";

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

export function deriveEntitlementsFromSubscription(subscription: Subscription | null): EntitlementFeature[] {
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

    let baseValue = "Included"; // Default baseValue
    let overageInfo: string | undefined = undefined;
    let rawQuantity: number | undefined = undefined;
    let rawOveragePrice: number | undefined = undefined;
    const currencySymbol = price.currency === 'USD' ? '$' : '';
    let statusText: string | null = null; // Initialize statusText
    let allFutureTransitions: FixedFeeQuantityTransition[] | undefined = undefined; // Initialize new field
    let tierDetails: TierDetail[] | undefined = undefined; // Store tier details
    let showDetailed: boolean = false; // Flag for detailed view

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
          const formattedOverageAmount = overageAmount.toFixed(2);
          overageInfo = `(then ${currencySymbol}${formattedOverageAmount}/${perUnit})`;
        }
      }
    } else if (price.price_type === 'usage_price') {
      const itemUnitName = price.item?.name || 'events';

      if (price.model_type === 'tiered_package' && price.tiered_package_config?.tiers && price.tiered_package_config.tiers.length > 0) {
        const tiers = price.tiered_package_config.tiers;
        const firstTier = tiers[0];

        if (firstTier) {
          if (firstTier.package_amount === "0.00" && typeof firstTier.last_unit === 'number') {
            baseValue = `First ${formatNumber(firstTier.last_unit)} ${itemUnitName}: Free`;
          } else if (typeof firstTier.last_unit === 'number' && typeof firstTier.package_size === 'number' && firstTier.package_size > 0) { 
            baseValue = `First ${formatNumber(firstTier.last_unit)} ${itemUnitName}: ${currencySymbol}${firstTier.package_amount}/${formatNumber(firstTier.package_size)}`;
          } else if (typeof firstTier.package_size === 'number' && firstTier.package_size > 0) { // Handles cases where first_unit might be 0 and last_unit is null (catch-all for the first tier)
             baseValue = `${currencySymbol}${firstTier.package_amount} / ${formatNumber(firstTier.package_size)} ${itemUnitName}`;
          } else {
             baseValue = "Usage-based (tiered package)"; // Fallback for unexpected first tier
          }

          if (tiers.length > 1) {
            const overageTier = tiers[1];
            // Ensure package_size is a positive number before formatting
            if (overageTier && parseFloat(overageTier.package_amount) >= 0 && typeof overageTier.package_size === 'number' && overageTier.package_size > 0) {
              overageInfo = `(then ${currencySymbol}${overageTier.package_amount} / ${formatNumber(overageTier.package_size)} ${itemUnitName})`;
            }
          }
        } else {
          baseValue = "Usage-based (tiered package)"; // Fallback if no tiers defined
        }
      } else if (price.model_type === 'package' && price.package_config) {
        const { package_amount, package_size } = price.package_config;

        if (package_amount === "0.00" && typeof package_size === 'number' && package_size > 0) {
            baseValue = `${formatNumber(package_size)} ${itemUnitName}: Free`;
            overageInfo = undefined;
        } 
        else if (parseFloat(package_amount) > 0 && typeof package_size === 'number' && package_size > 0) {
            baseValue = "Included";
            overageInfo = `(${currencySymbol}${package_amount} / ${formatNumber(package_size)} ${itemUnitName})`;
        } else {
            baseValue = "Usage-based (package)";
            overageInfo = undefined;
        }
      } else if (price.model_type === 'tiered' && price.tiered_config?.tiers) {
        const tiers = price.tiered_config.tiers;
        
        // Always show detailed tier information for tiered pricing
        if (tiers.length > 0) {
          tierDetails = []; // Initialize tierDetails array
          let unit = '';
          
          // Determine unit type
          if (price.item?.name.includes('Token')) unit = ' Tok-CR';
          else if (price.item?.name.includes('GB')) unit = ' GB';
          else if (price.item?.name.includes('Minutes')) unit = ' minute';
          else if (price.item?.name.includes('Request')) unit = ' request';
          
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
            } else if (unitAmount < 0.01 && unitAmount > 0) {
              rate = `${unitAmount} per${unit}`;
            } else {
              rate = `${unitAmount.toFixed(2)} per${unit}`;
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
        const unitAmount = price.unit_config?.unit_amount;
        baseValue = unitAmount && parseFloat(unitAmount) > 0 ? `${currencySymbol}${unitAmount}/${price.item?.name || 'unit'}` : 'Included';
        const isZeroCostUnit = unitAmount == null || unitAmount === '0' || unitAmount === '0.00';
        if (isZeroCostUnit) {
          overageInfo = 'Unlimited'; // Or baseValue = 'Unlimited'
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

    const displayName = price.item.name.replace(/^Nimbus Scale\s+/, '');

    entitlementFeatures.push({
      priceId: price.id,
      priceIntervalId: currentInterval.id,
      name: displayName,
      baseValue: baseValue,
      overageInfo: overageInfo,
      rawQuantity: rawQuantity,
      rawOveragePrice: rawOveragePrice,
      statusText: statusText,
      allFutureTransitions: allFutureTransitions,
      tierDetails: tierDetails || undefined,
      showDetailed: showDetailed,
    });
  });

  // Sort the features based on the DESIRED_ENTITLEMENT_ORDER
  entitlementFeatures.sort((a, b) => {
    const indexA = DESIRED_ENTITLEMENT_ORDER.indexOf(a.name);
    const indexB = DESIRED_ENTITLEMENT_ORDER.indexOf(b.name);

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