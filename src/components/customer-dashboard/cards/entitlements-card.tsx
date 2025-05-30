import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Info, CheckCircle2, PlusCircle, Trash2, Infinity } from 'lucide-react';
import type { EntitlementFeature } from '@/lib/utils/subscriptionUtils';
import { OBSERVABILITY_EVENTS_PRICE_ID } from '@/lib/data/add-on-prices';
import type { Subscription } from "@/lib/types"; // Import Subscription type
import { getCurrentCompanyConfig } from "@/components/plans/plan-data"; // Import plan data helper

interface EntitlementsCardProps {
  features: EntitlementFeature[];
  activeSubscription: Subscription | null; // Add activeSubscription prop
  onOpenAddOnDialog: () => void; // Callback to open the dialog
  onOpenAddObservabilityDialog: () => void; // Callback to open the dialog for adding Observability
  onRemoveScheduledTransition?: (priceIntervalId: string, effectiveDate: string) => void; // New prop
}

export function EntitlementsCard({ 
  features, 
  activeSubscription, // Destructure new prop
  onOpenAddOnDialog, 
  onOpenAddObservabilityDialog, 
  onRemoveScheduledTransition 
}: EntitlementsCardProps) {
  
  // Check if the observability feature is already included in the current entitlements
  const hasObservabilityFeature = features.some(
    (feature) => feature.priceId === OBSERVABILITY_EVENTS_PRICE_ID
  );

  // Determine if the current plan allows adding observability events
  let canAddObservability = false;
  if (activeSubscription && activeSubscription.plan && activeSubscription.plan.id) {
    const currentPlanId = activeSubscription.plan.id;
    const companyConfig = getCurrentCompanyConfig(); 
    const currentPlanDetails = companyConfig.uiPlans.find(p => p.plan_id === currentPlanId);
    if (currentPlanDetails && currentPlanDetails.allowedAddOnPriceIds) {
      canAddObservability = currentPlanDetails.allowedAddOnPriceIds.includes(OBSERVABILITY_EVENTS_PRICE_ID);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Entitlements</CardTitle>
        <CardDescription>
          Features included in the current plan
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {features.map((feature, index) => {
            // Get the next transition if available (the one that forms the statusText)
            const nextTransition = feature.allFutureTransitions && feature.allFutureTransitions.length > 0 
                                   ? feature.allFutureTransitions[0] 
                                   : null;
            return (
              <li key={index} className="flex items-start justify-between border-b pb-3 pt-1 last:border-b-0 text-sm">
                {/* Left side: Icon, Name */}
                <div className="flex items-center pt-0.5">
                  <CheckCircle2 className="mr-2 h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="font-medium whitespace-nowrap">{feature.name}</span>
                </div>

                {/* Right side: Value, Overage, Button, Scheduled Change */}
                <div className="flex flex-col items-end text-right space-y-1">
                  <div className="flex flex-col items-end space-y-1">
                    {/* Current Quantity */}
                    <span className="font-medium">{feature.baseValue}</span>
                    {/* Overage Info */}
                    {feature.overageInfo && !feature.showDetailed && (
                      <span className="text-xs text-muted-foreground">
                        {feature.overageInfo}
                      </span>
                    )}
                    {/* Tier Details - show when detailed view is enabled */}
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

                  {/* Adjust Button for Concurrent Builds */}
                  {feature.name === 'Concurrent Builds' && (
                    <Button
                      variant="default"
                      size="sm"
                      className="mt-1 h-6 px-2"
                      onClick={onOpenAddOnDialog}
                    >
                      {(feature.rawQuantity && feature.rawQuantity > 1) || (feature.rawQuantity === 1 && feature.statusText) ? 'Adjust' : 'Add'}
                    </Button>
                  )}

                  {/* Display statusText and a direct Remove button for the NEXT transition */} 
                  {feature.statusText && (
                    <div className="flex items-center text-xs text-blue-600 dark:text-blue-400 mt-1 space-x-1">
                      <Info className="h-3 w-3 flex-shrink-0" />
                      <span>
                        {feature.statusText}
                      </span>
                      {/* Direct Remove button for the next scheduled change */} 
                      {onRemoveScheduledTransition && feature.priceIntervalId && nextTransition && (
                        <Button 
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 p-0 ml-1 text-destructive hover:text-destructive"
                          onClick={() => {
                            if (feature.priceIntervalId && nextTransition) { // Ensure variables are still valid
                                onRemoveScheduledTransition(feature.priceIntervalId, nextTransition.effective_date);
                            }
                          }}
                          title="Remove this scheduled change"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </li>
            );
          })}

          {/* Conditionally render Add Observability option */}
          {canAddObservability && !hasObservabilityFeature && (
            <li className="flex items-start justify-between border-b pb-3 pt-1 last:border-b-0 text-sm">
              {/* Left side: Icon, Name */}
              <div className="flex items-center pt-0.5">
                <PlusCircle className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="font-medium">Observability Events</span>
              </div>
              {/* Right side: Button */}
              <div className="flex flex-col items-end text-right space-y-1">
                <Button
                  variant="default"
                  size="sm"
                  className="mt-1 h-6 px-2"
                  onClick={onOpenAddObservabilityDialog}
                >
                  Add
                </Button>
              </div>
            </li>
          )}
          
          {/* Message if no features at all */}
          {features.length === 0 && !(canAddObservability && !hasObservabilityFeature) && (
             <p className="text-sm text-muted-foreground">No feature details available for this plan.</p>
          )}
        </ul>
      </CardContent>
    </Card>
  );
} 