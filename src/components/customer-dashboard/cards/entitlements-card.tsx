import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Info, CheckCircle2 } from 'lucide-react';
import { formatDate } from '@/lib/utils/formatters';
import type { EntitlementFeature } from '@/lib/utils/subscriptionUtils';

interface EntitlementsCardProps {
  features: EntitlementFeature[];
  onOpenAddOnDialog: () => void; // Callback to open the dialog
}

export function EntitlementsCard({ features, onOpenAddOnDialog }: EntitlementsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Entitlements</CardTitle>
        <CardDescription>
          Features included in the current plan
        </CardDescription>
      </CardHeader>
      <CardContent>
        {features.length > 0 ? (
          <ul className="space-y-4">
            {features.map((feature, index) => (
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

                  {/* Button */}
                  {feature.name === 'Concurrent Builds' && (
                    <Button
                      variant="default"
                      size="sm"
                      className="mt-1 h-6 px-2"
                      onClick={onOpenAddOnDialog} // Use the passed callback
                    >
                      {/* Conditional Button Text */}
                      {feature.scheduledChange || (feature.rawQuantity && feature.rawQuantity > 1) ? 'Adjust' : 'Add'}
                    </Button>
                  )}

                  {/* Scheduled Change Indicator */}
                  {feature.scheduledChange && (
                    <div className="flex items-center text-xs text-blue-600 dark:text-blue-400 mt-1 space-x-1">
                      <Info className="h-3 w-3 flex-shrink-0" />
                      <span>
                        Scheduled change to {feature.scheduledChange.quantity} on {formatDate(feature.scheduledChange.effectiveDate)}
                      </span>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>No feature details available for this plan.</p>
        )}
      </CardContent>
    </Card>
  );
} 