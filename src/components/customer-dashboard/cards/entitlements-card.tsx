import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Info, CheckCircle2, PlusCircle, Trash2, Infinity } from 'lucide-react';
import type { EntitlementFeature } from '@/lib/utils/subscriptionUtils';
import type { Subscription } from "@/lib/types";
import { getCurrentCompanyConfig } from "@/lib/plans"; 
import { useCustomerStore } from "@/lib/store/customer-store";
import { ORB_INSTANCES } from "@/lib/orb-config";
import { getAddOnKeyByPriceId, getAddOnDisplayNameFromKey, getCurrentInstanceAddOns } from "@/lib/add-on-prices"; // Import new helpers

interface EntitlementsCardProps {
  features: EntitlementFeature[];
  activeSubscription: Subscription | null;
  onOpenAdjustFixedPriceDialog?: (feature: EntitlementFeature) => void; // Changed from onOpenAddOnDialog
  onInitiateAddAddOn: (priceId: string, itemName: string) => void; 
  onRemoveScheduledTransition?: (priceIntervalId: string, effectiveDate: string) => void;
  onOpenCancelFutureDialog?: (priceIntervalId: string, priceIntervalName: string, currentStartDate: string) => void;
  isLoading?: boolean;
}

const EntitlementSkeletonItem = () => (
  <li className="flex items-start justify-between border-b pb-3 pt-1 last:border-b-0 text-sm animate-pulse">
    <div className="flex items-center pt-0.5">
      <div className="mr-2 h-4 w-4 bg-muted rounded-full flex-shrink-0" />
      <div className="h-4 bg-muted rounded w-24" />
    </div>
    <div className="flex flex-col items-end text-right space-y-1">
      <div className="h-4 bg-muted rounded w-16" />
      <div className="h-3 bg-muted rounded w-20 mt-1" />
    </div>
  </li>
);

export function EntitlementsCard({ 
  features, 
  activeSubscription,
  onOpenAdjustFixedPriceDialog, // Use new prop
  onInitiateAddAddOn, 
  onRemoveScheduledTransition, 
  onOpenCancelFutureDialog,
  isLoading
}: EntitlementsCardProps) {
  
  // Calculate all future intervals for features that can be cancelled
  const futureIntervalsMap = React.useMemo(() => {
    if (!activeSubscription?.price_intervals) return new Map();

    const today = new Date().toISOString().split('T')[0];
    const currentInstanceAddOns = getCurrentInstanceAddOns();
    const allAddOnPriceIds = currentInstanceAddOns 
      ? Object.values(currentInstanceAddOns).map(addOn => addOn.priceId)
      : [];

    const intervalsMap = new Map();
    const priceIntervals = activeSubscription.price_intervals;

    // Find future intervals for each feature
    features.forEach(feature => {
      if (!feature.priceId) return;

      const futureInterval = priceIntervals.find(interval => {
        const hasStart = interval.start_date && interval.start_date > today;
        const notCancelled = !interval.end_date || interval.end_date !== interval.start_date;
        const hasPrice = interval.price && interval.price.id;
        const notPlatformFee = interval.price?.item?.name !== "Platform Fee";
        const isAddOnPrice = interval.price?.id && allAddOnPriceIds.includes(interval.price.id);
        const matchesPriceId = interval.price?.id === feature.priceId;
        
        return hasStart && notCancelled && hasPrice && notPlatformFee && isAddOnPrice && matchesPriceId;
      });

      if (futureInterval) {
        intervalsMap.set(feature.priceId, futureInterval);
      }
    });

    return intervalsMap;
  }, [activeSubscription, features]);

  // Helper function to find any interval (not just future add-ons) for a feature
  const findIntervalForFeature = React.useCallback((priceId: string) => {
    if (!activeSubscription?.price_intervals || !priceId) return null;
    
    return activeSubscription.price_intervals.find(interval => 
      interval.price?.id === priceId
    );
  }, [activeSubscription]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Entitlements</CardTitle>
          <CardDescription>Features included in the current plan</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            <EntitlementSkeletonItem />
            <EntitlementSkeletonItem />
            <EntitlementSkeletonItem />
          </ul>
        </CardContent>
      </Card>
    );
  }

  const selectedInstance = useCustomerStore.getState().selectedInstance;
  let companyConfig = null;
  if (selectedInstance) {
      const instanceConfig = ORB_INSTANCES[selectedInstance];
      if (instanceConfig) {
          companyConfig = getCurrentCompanyConfig(instanceConfig.companyKey);
      } else {
          console.error(`[EntitlementsCard] Invalid selectedInstance: ${selectedInstance}`);
      }
  } else {
      console.warn("[EntitlementsCard] No selectedInstance in store. Cannot determine allowed add-ons.");
  }

  const currentPlanDetails = companyConfig && activeSubscription?.plan?.id && activeSubscription.plan
    ? companyConfig.uiPlans.find(p => p.plan_id === activeSubscription!.plan!.id)
    : null;

  // DEBUGGING: Log the features array received by the card
  console.log("[EntitlementsCard] Features prop:", JSON.stringify(features, null, 2));

  const allowedAddOnsToDisplay = (currentPlanDetails?.allowedAddOnPriceIds || [])
    .map(priceId => {
      // DEBUGGING: Log current priceId from allowedAddOnPriceIds
      console.log(`[EntitlementsCard] Checking allowed add-on priceId: ${priceId}`);

      const addOnKey = getAddOnKeyByPriceId(priceId); 
      if (!addOnKey) {
        console.warn(`[EntitlementsCard] Could not find addOnKey for priceId: ${priceId}. Instance selected: ${selectedInstance}`);
        return null; 
      }
      const displayName = getAddOnDisplayNameFromKey(addOnKey);
      
      // DEBUGGING: Log before the .some() check
      console.log(`[EntitlementsCard] About to check if priceId ${priceId} (Display: ${displayName}) is active in features list.`);
      features.forEach(f => console.log(`[EntitlementsCard] Feature in list: name=${f.name}, priceId=${f.priceId}`));

      const isAlreadyActive = features.some(f => {
        // DEBUGGING: Log comparison
        console.log(`[EntitlementsCard] Comparing f.priceId (${f.priceId}) with priceId (${priceId}). Match: ${f.priceId === priceId}`);
        return f.priceId === priceId;
      });
      
      // DEBUGGING: Log result of isAlreadyActive
      console.log(`[EntitlementsCard] isAlreadyActive for priceId ${priceId} (Display: ${displayName}): ${isAlreadyActive}`);

      return isAlreadyActive ? null : { priceId, displayName, addOnKey };
    })
    .filter(Boolean) as { priceId: string; displayName: string; addOnKey: string }[]; // Type assertion after filter(Boolean)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Entitlements</CardTitle>
        <CardDescription>Features included in the current plan</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {features.map((feature, index) => {
            const nextTransition = feature.allFutureTransitions && feature.allFutureTransitions.length > 0 
                                   ? feature.allFutureTransitions[0] 
                                   : null;

            // Get the future interval for this feature from the pre-calculated map
            const futureInterval = feature.priceId ? futureIntervalsMap.get(feature.priceId) : null;

            return (
              <li key={`${feature.priceId || feature.name}-${index}`} className="flex items-start justify-between border-b pb-3 pt-1 last:border-b-0 text-sm">
                <div className="flex items-center pt-0.5">
                  <CheckCircle2 className="mr-2 h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="font-medium whitespace-nowrap">{feature.name}</span>
                </div>
                <div className="flex flex-col items-end text-right space-y-1">
                  <div className="flex flex-col items-end space-y-1">
                    <span className="font-medium">{feature.baseValue}</span>
                    {feature.overageInfo && !feature.showDetailed && (
                      <span className="text-xs text-muted-foreground">{feature.overageInfo}</span>
                    )}
                    {feature.showDetailed && feature.tierDetails && feature.tierDetails.length > 0 && (
                      <div className="mt-1">
                        <div className="space-y-0.5 text-right">
                          {feature.tierDetails.map((tier, tierIndex) => (
                            <div key={tierIndex} className="text-xs leading-tight text-muted-foreground text-right">
                              {tier.range.includes('∞') ? (
                                <div className="flex items-center justify-end gap-1">
                                  <span>{tier.range.replace(' - ∞', '')} -</span>
                                  <Infinity className="h-3 w-3" />
                                  <span>: {tier.rate}</span>
                                </div>
                              ) : (
                                <span>{tier.range}: {tier.rate}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Generic button for adjustable fixed price items */}
                  {feature.isAdjustableFixedPrice && onOpenAdjustFixedPriceDialog && (
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="mt-1 h-6 px-2" 
                      onClick={() => onOpenAdjustFixedPriceDialog(feature)} // Pass the whole feature
                    >
                      {/* Button text logic: 'Adjust' if quantity > 0 or has status, else 'Add' (or 'Manage') */}
                      {(feature.rawQuantity && feature.rawQuantity > 0) || (feature.rawQuantity === 0 && feature.statusText) ? 'Adjust' : 'Add'}
                    </Button>
                  )}
                  {/* Only show status text for future dates, not today or past */}
                  {feature.statusText && (() => {
                    // For "Starts on..." status, use the actual start_date from any interval if available
                    const statusMatch = feature.statusText.match(/Starts on (.+)/);
                    if (statusMatch) {
                      // Try to find the actual interval for this feature (including base plan features)
                      const actualInterval = futureInterval || findIntervalForFeature(feature.priceId || '');
                      
                      if (actualInterval && actualInterval.start_date) {
                        // Use the actual start_date from the interval (ISO format)
                        const intervalStartDate = actualInterval.start_date.split('T')[0]; // Extract YYYY-MM-DD
                        const today = new Date().toISOString().split('T')[0]; // Get today in YYYY-MM-DD format
                        
                        // Only show if the date is in the future
                        if (intervalStartDate > today) {
                          return (
                            <div className="flex items-center text-xs text-blue-600 dark:text-blue-400 mt-1 space-x-1">
                              <Info className="h-3 w-3 flex-shrink-0" />
                              <span>{feature.statusText}</span>
                              {onRemoveScheduledTransition && feature.priceIntervalId && nextTransition && (
                                <Button 
                                  variant="ghost" size="icon" className="h-5 w-5 p-0 ml-1 text-destructive hover:text-destructive"
                                  onClick={() => { if (feature.priceIntervalId && nextTransition) { onRemoveScheduledTransition(feature.priceIntervalId, nextTransition.effective_date); }}}
                                  title="Remove this scheduled change"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          );
                        }
                        // If not in the future, don't render anything for "Starts on..." status
                        return null;
                      }
                    }
                    
                    // Fallback: if no actual interval found or statusText doesn't match "Starts on..." pattern, show it anyway
                    return (
                      <div className="flex items-center text-xs text-blue-600 dark:text-blue-400 mt-1 space-x-1">
                        <Info className="h-3 w-3 flex-shrink-0" />
                        <span>{feature.statusText}</span>
                        {onRemoveScheduledTransition && feature.priceIntervalId && nextTransition && (
                          <Button 
                            variant="ghost" size="icon" className="h-5 w-5 p-0 ml-1 text-destructive hover:text-destructive"
                            onClick={() => { if (feature.priceIntervalId && nextTransition) { onRemoveScheduledTransition(feature.priceIntervalId, nextTransition.effective_date); }}}
                            title="Remove this scheduled change"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    );
                  })()}
                  {/* Cancel Schedule button for future-scheduled intervals */}
                  {futureInterval && onOpenCancelFutureDialog && (
                    <Button
                      variant="outline" size="sm" className="mt-1 h-6 px-2 text-destructive hover:text-destructive"
                      onClick={() => {
                        const startDateOnly = futureInterval.start_date!.split('T')[0];
                        onOpenCancelFutureDialog(futureInterval.id, feature.name, startDateOnly);
                      }}
                    >
                      Cancel Schedule
                    </Button>
                  )}
                </div>
              </li>
            );
          })}

          {/* Dynamically render Add options for allowed add-ons */}
          {allowedAddOnsToDisplay.map(addOn => (
            <li key={addOn.priceId} className="flex items-start justify-between border-b pb-3 pt-1 last:border-b-0 text-sm">
              <div className="flex items-center pt-0.5">
                <PlusCircle className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="font-medium">{addOn.displayName}</span>
              </div>
              <div className="flex flex-col items-end text-right space-y-1">
                <Button
                  variant="default" size="sm" className="mt-1 h-6 px-2"
                  onClick={() => onInitiateAddAddOn(addOn.priceId, addOn.displayName)} // Use generic handler
                >
                  Add
                </Button>
              </div>
            </li>
          ))}
          
          {/* Message if no features and no add-ons to display */}
          {features.length === 0 && allowedAddOnsToDisplay.length === 0 && (
             <p className="text-sm text-muted-foreground">No feature details or available add-ons for this plan.</p>
          )}
        </ul>
      </CardContent>
    </Card>
  );
} 