import React, { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { editPriceIntervalSchedule } from '@/app/actions/orb';
import { ApiPreviewDialog } from '@/components/dialogs/api-preview-dialog';
import type { OrbInstance } from '@/lib/orb-config';

interface RemoveActiveEntitlementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  subscriptionId: string;
  priceIntervalId: string;
  priceIntervalName: string; // For display in the dialog
  currentInstance: OrbInstance;
  onSuccess: () => void; // To trigger data refresh or other actions
}

export function RemoveActiveEntitlementDialog({
  isOpen,
  onClose,
  subscriptionId,
  priceIntervalId,
  priceIntervalName,
  currentInstance,
  onSuccess,
}: RemoveActiveEntitlementDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Get today's date to end the interval immediately
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

  // Prepare the API payload for preview
  const apiPayload = {
    edit: [
      {
        price_interval_id: priceIntervalId,
        end_date: today, // Setting end_date to today ends the interval immediately
      },
    ],
  };

  const handleConfirmRemoval = useCallback(async () => {
    if (!subscriptionId || !priceIntervalId) {
      toast.error("Missing necessary information to remove the entitlement.");
      return;
    }
    setIsLoading(true);
    try {
      const result = await editPriceIntervalSchedule(
        subscriptionId,
        [{
          price_interval_id: priceIntervalId,
          end_date: today, // Setting end_date to today ends the interval immediately
        }],
        currentInstance
      );

      if (result.success) {
        toast.success(`The entitlement "${priceIntervalName}" has been removed.`);
        onSuccess();
        onClose();
      } else {
        throw new Error(result.error || "Failed to remove entitlement.");
      }
    } catch (error) {
      console.error("Error removing active entitlement:", error);
      toast.error(error instanceof Error ? error.message : "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  }, [
    subscriptionId,
    priceIntervalId,
    priceIntervalName,
    currentInstance,
    today,
    onClose,
    onSuccess,
  ]);

  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove Active Entitlement</DialogTitle>
          <DialogDescription>
            Are you sure you want to remove the active entitlement: <strong>{priceIntervalName}</strong>?
            This will end the add-on effective today. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex justify-between items-center">
          <div className="flex-1">
            <ApiPreviewDialog
              payload={apiPayload}
              endpoint={`https://api.withorb.com/v1/subscriptions/${subscriptionId}/price_intervals`}
              method="POST"
              title="Preview API Call: Remove Entitlement"
              description="This shows the data that will be sent to end the active add-on."
              buttonText="Preview API Call"
              buttonVariant="outline"
              buttonSize="sm"
              disabled={isLoading}
            />
          </div>
          <div className="flex gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Back
              </Button>
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmRemoval}
              disabled={isLoading}
            >
              {isLoading ? "Removing..." : "Remove Entitlement"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 