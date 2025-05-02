import type { Subscription, PriceInterval } from "@/lib/types";
import { formatNumber } from "./formatters";

// Define the structure for the derived entitlement feature
export interface EntitlementFeature {
  priceId?: string;
  priceIntervalId?: string;
  name: string;
  baseValue: string;
  overageInfo?: string;
  rawQuantity?: number;
  rawOveragePrice?: number;
  scheduledChange?: { quantity: number; effectiveDate: string } | null;
}

// Define the type for fixed fee quantity transitions within the interval
interface FixedFeeQuantityTransition {
  effective_date: string;
  quantity: number;
  price_id?: string;
}

// Add the transition field to PriceInterval if not already defined globally (or refine PriceInterval type)
// This assumes PriceInterval type might be extended here or globally
interface ExtendedPriceInterval extends PriceInterval {
  fixed_fee_quantity_transitions?: FixedFeeQuantityTransition[] | null;
}

export function deriveEntitlementsFromSubscription(subscription: Subscription | null): EntitlementFeature[] {
  if (!subscription?.price_intervals) {
    return [];
  }

  const entitlementFeatures: EntitlementFeature[] = [];

  subscription.price_intervals.forEach(interval => {
    // Cast interval to ExtendedPriceInterval to access transitions
    const extendedInterval = interval as ExtendedPriceInterval;
    const price = interval.price;

    if (!price || !price.item || price.item.name === "Platform Fee") {
      return; // Skip Platform Fee
    }

    let baseValue = "Included";
    let overageInfo: string | undefined = undefined;
    let rawQuantity: number | undefined = undefined;
    let rawOveragePrice: number | undefined = undefined;
    const currencySymbol = price.currency === 'USD' ? '$' : '';
    let scheduledChange: { quantity: number; effectiveDate: string } | null = null;

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
      if (price.model_type === 'tiered' && price.tiered_config?.tiers) {
        const tiers = price.tiered_config.tiers;
        const firstTier = tiers[0];
        if (firstTier) {
          const isZeroCost = firstTier.unit_amount == null || firstTier.unit_amount === '0' || firstTier.unit_amount === '0.00';
          if (firstTier.last_unit === null && firstTier.first_unit === 0 && isZeroCost) {
            overageInfo = 'Unlimited';
          } else if (firstTier.last_unit !== null && firstTier.last_unit !== undefined && firstTier.last_unit > 0) {
            const amount = firstTier.last_unit;
            rawQuantity = amount;
            let unit = '';
            if (price.item.name.includes('GB')) unit = ' GB';
            if (price.item.name.includes('Minutes')) unit = ' minutes';
            if (price.item.name.includes('Request')) unit = ' requests';
            baseValue = `${formatNumber(amount)}${unit}`;
          }
          if (baseValue !== 'Unlimited' && tiers.length > 1) {
            const overageTier = tiers[1];
            if (overageTier && overageTier.unit_amount && parseFloat(overageTier.unit_amount) > 0) {
              let perUnit = '';
              if (price.item.name.includes('GB')) perUnit = 'GB';
              if (price.item.name.includes('Minutes')) perUnit = 'minute';
              if (price.item.name.includes('Request')) perUnit = 'request';
              const overageAmount = parseFloat(overageTier.unit_amount);
              rawOveragePrice = overageAmount;
              let formattedOverageAmount;
              if (overageAmount < 0.01 && overageAmount > 0) {
                formattedOverageAmount = overageAmount.toString();
              } else {
                formattedOverageAmount = overageAmount.toFixed(2);
              }
              overageInfo = `(then ${currencySymbol}${formattedOverageAmount}${perUnit ? `/${perUnit}` : ''})`;
            }
          }
        }
      } else if (price.model_type === 'unit') {
        const unitAmount = price.unit_config?.unit_amount;
        const isZeroCostUnit = unitAmount == null || unitAmount === '0' || unitAmount === '0.00';
        if (isZeroCostUnit) {
          overageInfo = 'Unlimited';
        }
      }
    }

    // --- Check for SCHEDULED transitions for fixed-price items --- 
    if (price.price_type === 'fixed_price' && extendedInterval.fixed_fee_quantity_transitions && extendedInterval.fixed_fee_quantity_transitions.length > 0) {
      const sortedTransitions = [...extendedInterval.fixed_fee_quantity_transitions].sort((a, b) =>
        new Date(b.effective_date).getTime() - new Date(a.effective_date).getTime()
      );
      const latestTransition = sortedTransitions[0];
      scheduledChange = {
        quantity: latestTransition.quantity,
        effectiveDate: latestTransition.effective_date
      };
    }

    const displayName = price.item.name.replace(/^Nimbus Scale\s+/, '');

    entitlementFeatures.push({
      priceId: price.id,
      priceIntervalId: interval.id,
      name: displayName,
      baseValue: baseValue,
      overageInfo: overageInfo,
      rawQuantity: rawQuantity,
      rawOveragePrice: rawOveragePrice,
      scheduledChange: scheduledChange,
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