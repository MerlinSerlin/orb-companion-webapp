import type { Subscription, PriceInterval, FixedFeeQuantityTransition } from "@/lib/types";
import { formatNumber, formatDate } from "./formatters";

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

    // DEBUGGING: Log the price object being processed
    if (price?.id === "LbwJF4Vpm6rmGRFh") { // Check for your specific price ID
        console.log("[DEBUG] Processing Observability Price:", JSON.stringify(price, null, 2));
        console.log("[DEBUG] Tiered Package Config:", JSON.stringify(price.tiered_package_config, null, 2));
    }

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
        const firstTier = tiers[0];
        if (firstTier) {
          const isZeroCost = firstTier.unit_amount == null || firstTier.unit_amount === '0' || firstTier.unit_amount === '0.00';
          if (firstTier.last_unit === null && firstTier.first_unit === 0 && isZeroCost) {
            overageInfo = 'Unlimited';
            baseValue = 'Unlimited'; // Set baseValue for clarity
          } else if (firstTier.last_unit !== null && firstTier.last_unit !== undefined && firstTier.last_unit > 0) {
            const amount = firstTier.last_unit;
            rawQuantity = amount; // This might not be accurate for pure usage, represents limit
            let unit = '';
            if (price.item?.name.includes('GB')) unit = ' GB';
            if (price.item?.name.includes('Minutes')) unit = ' minutes';
            if (price.item?.name.includes('Request')) unit = ' requests';
            baseValue = `${formatNumber(amount)}${unit}`;
          }
          if (baseValue !== 'Unlimited' && tiers.length > 1) {
            const overageTier = tiers[1];
            if (overageTier && overageTier.unit_amount && parseFloat(overageTier.unit_amount) > 0) {
              let perUnit = '';
              if (price.item?.name.includes('GB')) perUnit = 'GB';
              if (price.item?.name.includes('Minutes')) perUnit = 'minute';
              if (price.item?.name.includes('Request')) perUnit = 'request';
              const overageAmount = parseFloat(overageTier.unit_amount);
              rawOveragePrice = overageAmount;
              const formattedOverageAmount = overageAmount < 0.01 && overageAmount > 0 ? overageAmount.toString() : overageAmount.toFixed(2);
              overageInfo = `(then ${currencySymbol}${formattedOverageAmount}${perUnit ? `/${perUnit}` : ''})`;
            }
          }
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
    });
  });

  // Move "Concurrent Builds" to the end if it exists
  const concurrentBuildsIndex = entitlementFeatures.findIndex(feat => feat.name === 'Concurrent Builds');
  if (concurrentBuildsIndex > -1) {
    const [concurrentBuildsFeature] = entitlementFeatures.splice(concurrentBuildsIndex, 1);
    entitlementFeatures.push(concurrentBuildsFeature);
  }

  return entitlementFeatures;
} 