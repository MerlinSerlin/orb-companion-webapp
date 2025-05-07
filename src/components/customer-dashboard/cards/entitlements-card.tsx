import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Info, CheckCircle2, PlusCircle, CalendarDays, Trash2 } from 'lucide-react';
import type { EntitlementFeature } from '@/lib/utils/subscriptionUtils';
import { OBSERVABILITY_EVENTS_PRICE_ID } from '@/lib/data/add-on-prices';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDate, formatNumber } from '@/lib/utils/formatters';

interface EntitlementsCardProps {
  features: EntitlementFeature[];
  onOpenAddOnDialog: () => void; // Callback to open the dialog
  onOpenAddObservabilityDialog: () => void; // Callback to open the dialog for adding Observability
  onRemoveScheduledTransition?: (priceIntervalId: string, effectiveDate: string) => void; // New prop
}

export function EntitlementsCard({ features, onOpenAddOnDialog, onOpenAddObservabilityDialog, onRemoveScheduledTransition }: EntitlementsCardProps) {
  // Check if the observability feature is already included
  const hasObservability = features.some(
    (feature) => feature.priceId === OBSERVABILITY_EVENTS_PRICE_ID
  );

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
            return (
              <li key={index} className="flex items-start justify-between border-b pb-3 pt-1 last:border-b-0 text-sm">
                {/* Left side: Icon, Name */}
                <div className="flex items-center pt-0.5">
                  <CheckCircle2 className="mr-2 h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="font-medium">{feature.name}</span>
                </div>

                {/* Right side: Value, Overage, Button, Scheduled Change */}
                <div className="flex flex-col items-end text-right space-y-1">
                  <div className="flex flex-col items-end space-y-0.5">
                    {/* Current Quantity */}
                    <span className="font-medium">{feature.baseValue}</span>
                    {/* Overage Info */}
                    {feature.overageInfo && (
                      <span className="text-xs text-muted-foreground">
                        {feature.overageInfo}
                      </span>
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

                  {/* Display statusText and Popover for allFutureTransitions */}
                  {feature.statusText && (
                    <div className="flex items-center text-xs text-blue-600 dark:text-blue-400 mt-1 space-x-1">
                      <Info className="h-3 w-3 flex-shrink-0" />
                      <span>
                        {feature.statusText}
                      </span>
                      {feature.allFutureTransitions && feature.allFutureTransitions.length > 0 && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-5 w-5 p-0 ml-1">
                              <CalendarDays className="h-3 w-3" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-3 text-xs" align="end">
                            <div className="font-medium mb-2 pb-1 border-b">All Scheduled Changes:</div>
                            <ul className="space-y-1.5">
                              {feature.allFutureTransitions.map((transition, tIndex) => (
                                <li key={tIndex} className="flex items-center justify-between space-x-2">
                                  <span>
                                    Change to {formatNumber(transition.quantity)} on {formatDate(transition.effective_date)}
                                  </span>
                                  {onRemoveScheduledTransition && feature.priceIntervalId && (
                                    <Button 
                                      variant="ghost"
                                      size="icon"
                                      className="h-5 w-5 p-0 text-destructive hover:text-destructive"
                                      onClick={() => {
                                        if (feature.priceIntervalId) { // Double check for safety, though covered by outer if
                                            onRemoveScheduledTransition(feature.priceIntervalId, transition.effective_date);
                                        }
                                      }}
                                      title="Remove scheduled change"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>
                  )}
                </div>
              </li>
            );
          })}

          {/* Conditionally render Add Observability option */}
          {!hasObservability && (
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
          {features.length === 0 && !hasObservability && (
             <p className="text-sm text-muted-foreground">No feature details available for this plan.</p>
          )}
        </ul>
      </CardContent>
    </Card>
  );
} 