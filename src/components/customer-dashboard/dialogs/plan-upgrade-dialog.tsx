"use client"

import * as React from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { schedulePlanChange } from "@/app/actions/orb";
import { toast } from "sonner";
import { Loader2, Calendar, ArrowUp } from "lucide-react";
import { ApiPreviewDialog } from "../../dialogs/api-preview-dialog";
import type { Subscription } from "@/lib/types";
import { useCustomerStore } from "@/lib/store/customer-store";
import { formatDate } from "@/lib/utils/formatters";

type JsonValue = string | number | boolean | null | { [key: string]: JsonValue } | JsonValue[];

interface PlanUpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan: {
    id: string;
    name: string;
  };
  targetPlan: {
    id: string;
    name: string;
  };
  subscription: Subscription;
  onUpgradeSuccess?: () => void;
}

export function PlanUpgradeDialog({
  open,
  onOpenChange,
  currentPlan,
  targetPlan,
  subscription,
  onUpgradeSuccess
}: PlanUpgradeDialogProps) {
  const [effectiveDateState, setEffectiveDateState] = React.useState<Date | null>(null);
  const [changeOption, setChangeOption] = React.useState<'immediate' | 'end_of_subscription_term' | 'requested_date'>('immediate');
  const [isUpgrading, setIsUpgrading] = React.useState<boolean>(false);
  const selectedInstance = useCustomerStore((state) => state.selectedInstance);
  const setScheduledPlanChange = useCustomerStore((state) => state.setScheduledPlanChange);

  const formatDateForInputInternal = React.useCallback((date: Date): string => {
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Minimum date is today
  const minDate = React.useMemo(() => {
    return formatDateForInputInternal(new Date());
  }, [formatDateForInputInternal]);

  // Reset form when dialog opens/closes
  React.useEffect(() => {
    if (open) {
      setChangeOption('immediate');
      setEffectiveDateState(null);
    }
  }, [open]);

  const apiPayload = React.useMemo((): Record<string, JsonValue> => {
    const payload: Record<string, JsonValue> = {
      plan_id: targetPlan.id,
      change_option: changeOption,
    };

    if (changeOption === 'requested_date' && effectiveDateState) {
      payload.change_date = formatDateForInputInternal(effectiveDateState);
    }

    return payload;
  }, [targetPlan.id, changeOption, effectiveDateState, formatDateForInputInternal]);

  const handleUpgrade = async () => {
    if (!selectedInstance) {
      toast.error("Error", { description: "No instance selected" });
      return;
    }

    if (changeOption === 'requested_date' && !effectiveDateState) {
      toast.error("Invalid Date", { description: "Please select an effective date for the plan change." });
      return;
    }

    setIsUpgrading(true);

    try {
      const result = await schedulePlanChange(
        subscription.id,
        targetPlan.id,
        changeOption,
        changeOption === 'requested_date' && effectiveDateState ? formatDateForInputInternal(effectiveDateState) : undefined,
        selectedInstance
      );

      if (result.success) {
        // Store the scheduled plan change in the customer store
        const changeDate = changeOption === 'requested_date' && effectiveDateState 
          ? effectiveDateState.toISOString()
          : changeOption === 'end_of_subscription_term'
          ? subscription.current_period_end || null
          : new Date().toISOString(); // immediate

        setScheduledPlanChange(subscription.id, {
          subscriptionId: subscription.id,
          targetPlanId: targetPlan.id,
          targetPlanName: targetPlan.name,
          changeDate,
          changeOption,
          scheduledAt: new Date().toISOString()
        });

        const timing = changeOption === 'immediate' 
          ? 'immediately' 
          : changeOption === 'end_of_subscription_term' 
            ? 'at the end of your current billing period'
            : `on ${formatDate(formatDateForInputInternal(effectiveDateState!))}`;

        toast.success("Plan Upgrade Scheduled", {
          description: `Your plan will be upgraded from ${currentPlan.name} to ${targetPlan.name} ${timing}`,
          duration: 6000,
        });
        
        // Trigger immediate refresh
        onUpgradeSuccess?.();
        
        // Also trigger a delayed refresh in case Orb takes time to update
        setTimeout(() => {
          console.log("[PlanUpgradeDialog] Triggering delayed refresh after plan upgrade");
          onUpgradeSuccess?.();
        }, 2000); // 2 second delay
        
        onOpenChange(false);
      } else {
        toast.error("Upgrade Failed", {
          description: result.error || "Failed to schedule plan upgrade",
        });
      }
    } catch (error) {
      console.error('Error upgrading plan:', error);
      toast.error("Upgrade Failed", {
        description: "An unexpected error occurred while upgrading the plan",
      });
    } finally {
      setIsUpgrading(false);
    }
  };

  const getTimingDescription = () => {
    switch (changeOption) {
      case 'immediate':
        return 'Your plan will be upgraded immediately and you\'ll be billed prorated for the new plan.';
      case 'end_of_subscription_term':
        return 'Your plan will be upgraded at the end of your current billing period.';
      case 'requested_date':
        return 'Your plan will be upgraded on the date you specify.';
      default:
        return '';
    }
  };

  const isValidForm = () => {
    if (changeOption === 'requested_date') {
      return effectiveDateState !== null;
    }
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowUp className="h-5 w-5 text-green-600" />
            Upgrade Your Plan
          </DialogTitle>
          <DialogDescription>
            Schedule your upgrade from <Badge variant="outline">{currentPlan.name}</Badge> to <Badge variant="secondary">{targetPlan.name}</Badge>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Timing Options */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">When would you like to upgrade?</Label>
            
            <div className="space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="changeOption"
                  value="immediate"
                  checked={changeOption === 'immediate'}
                  onChange={(e) => setChangeOption(e.target.value as 'immediate')}
                  className="w-4 h-4"
                />
                <span className="text-sm">Immediately</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="changeOption"
                  value="end_of_subscription_term"
                  checked={changeOption === 'end_of_subscription_term'}
                  onChange={(e) => setChangeOption(e.target.value as 'end_of_subscription_term')}
                  className="w-4 h-4"
                />
                <span className="text-sm">At the end of my billing period</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="changeOption"
                  value="requested_date"
                  checked={changeOption === 'requested_date'}
                  onChange={(e) => setChangeOption(e.target.value as 'requested_date')}
                  className="w-4 h-4"
                />
                <span className="text-sm">On a specific date</span>
              </label>
            </div>
          </div>

          {/* Date Picker (only shown when requested_date is selected) */}
          {changeOption === 'requested_date' && (
            <div className="space-y-2">
              <Label htmlFor="effectiveDate" className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4" />
                Effective Date
              </Label>
              <Input
                id="effectiveDate"
                type="date"
                value={effectiveDateState ? formatDateForInputInternal(effectiveDateState) : ""}
                onChange={(e) => e.target.value ? setEffectiveDateState(new Date(e.target.value + "T00:00:00")) : setEffectiveDateState(null)}
                min={minDate}
                className="w-full"
                disabled={isUpgrading}
              />
              <p className="text-xs text-muted-foreground">
                Select today or any future date for your plan upgrade.
              </p>
            </div>
          )}

          {/* Timing Description */}
          <div className="p-3 bg-muted/50 rounded-md">
            <p className="text-sm text-muted-foreground">
              {getTimingDescription()}
            </p>
          </div>

          {/* Current Period Info */}
          {subscription.current_period_start && subscription.current_period_end && (
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Current billing period: {formatDate(subscription.current_period_start)} - {formatDate(subscription.current_period_end)}</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <ApiPreviewDialog
            payload={apiPayload}
            endpoint={`https://api.withorb.com/v1/subscriptions/${subscription.id}/schedule_plan_change`}
            method="POST"
            title="Preview Plan Upgrade API Call"
            description={`This shows the API call that will upgrade your plan from ${currentPlan.name} to ${targetPlan.name}.`}
            buttonText="Preview API Call"
            buttonVariant="outline"
            buttonSize="default"
            disabled={isUpgrading || !isValidForm()}
          />
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUpgrading}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpgrade}
            disabled={isUpgrading || !isValidForm() || !selectedInstance}
          >
            {isUpgrading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isUpgrading ? "Upgrading..." : `Upgrade to ${targetPlan.name}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 