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
import { unschedulePlanChange } from "@/app/actions/orb";
import { toast } from "sonner";
import { Loader2, AlertTriangle } from "lucide-react";
import { ApiPreviewDialog } from "../../dialogs/api-preview-dialog";
import { useCustomerStore } from "@/lib/store/customer-store";
import type { ScheduledPlanChange } from "@/lib/store/customer-store";

type JsonValue = string | number | boolean | null | { [key: string]: JsonValue } | JsonValue[];

interface UnschedulePlanChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscriptionId: string;
  scheduledChange: ScheduledPlanChange;
  onUnscheduleSuccess?: () => void;
}

export function UnschedulePlanChangeDialog({
  open,
  onOpenChange,
  subscriptionId,
  scheduledChange,
  onUnscheduleSuccess
}: UnschedulePlanChangeDialogProps) {
  const [isUnscheduling, setIsUnscheduling] = React.useState<boolean>(false);
  const selectedInstance = useCustomerStore((state) => state.selectedInstance);
  const removeScheduledPlanChange = useCustomerStore((state) => state.removeScheduledPlanChange);

  // API payload for preview (unschedule doesn't have a body, but we can show the endpoint)
  const apiPayload = React.useMemo((): Record<string, JsonValue> => {
    return {
      note: "This endpoint cancels all pending plan changes for the subscription",
      subscription_id: subscriptionId
    };
  }, [subscriptionId]);

  const handleUnschedule = async () => {
    if (!selectedInstance) {
      toast.error("Error", { description: "No instance selected" });
      return;
    }

    setIsUnscheduling(true);

    try {
      const result = await unschedulePlanChange(subscriptionId, selectedInstance);
      
      if (result.success) {
        // Remove from local store
        removeScheduledPlanChange(subscriptionId);
        
        toast.success("Scheduled Plan Change Cancelled", {
          description: "Your scheduled plan upgrade has been cancelled successfully.",
          duration: 5000,
        });
        
        // Trigger refresh to update the UI
        onUnscheduleSuccess?.();
        onOpenChange(false);
      } else {
        throw new Error(result.error || "Failed to cancel scheduled plan change");
      }
    } catch (error) {
      console.error("Error cancelling scheduled plan change:", error);
      toast.error("Cancellation Failed", {
        description: error instanceof Error ? error.message : "Failed to cancel scheduled plan change",
        duration: 5000,
      });
    } finally {
      setIsUnscheduling(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Cancel Scheduled Upgrade
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel your scheduled plan upgrade?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 bg-muted/50 rounded-md space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Target Plan:</span>
              <span className="font-medium">{scheduledChange.targetPlanName}</span>
            </div>
            {scheduledChange.changeDate && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Scheduled Date:</span>
                <span className="font-medium">
                  {new Date(scheduledChange.changeDate).toLocaleDateString()}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Timing:</span>
              <span className="font-medium">
                {scheduledChange.changeOption === 'immediate' && 'Immediate'}
                {scheduledChange.changeOption === 'end_of_subscription_term' && 'End of billing period'}
                {scheduledChange.changeOption === 'requested_date' && 'Specific date'}
              </span>
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
            <p className="text-sm text-amber-800">
              <strong>Note:</strong> Cancelling this upgrade will remove the scheduled plan change. 
              You can schedule a new upgrade at any time.
            </p>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <ApiPreviewDialog
            payload={apiPayload}
            endpoint={`https://api.withorb.com/v1/subscriptions/${subscriptionId}/unschedule_pending_plan_changes`}
            method="POST"
            title="Preview Unschedule API Call"
            description="This shows the API call that will cancel your scheduled plan upgrade."
            buttonText="Preview API Call"
            buttonVariant="outline"
            buttonSize="default"
            disabled={isUnscheduling}
          />
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUnscheduling}>
            Keep Upgrade
          </Button>
          <Button 
            variant="destructive"
            onClick={handleUnschedule}
            disabled={isUnscheduling}
          >
            {isUnscheduling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isUnscheduling ? "Cancelling..." : "Cancel Upgrade"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
