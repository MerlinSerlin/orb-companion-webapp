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

interface CancelFuturePriceIntervalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  subscriptionId: string;
  priceIntervalId: string;
  priceIntervalName: string; // For display in the dialog
  currentStartDate: string; // YYYY-MM-DD, used to set the end_date for cancellation
  currentInstance: OrbInstance;
  onSuccess: () => void; // To trigger data refresh or other actions
}

export function CancelFuturePriceIntervalDialog({
  isOpen,
  onClose,
  subscriptionId,
  priceIntervalId,
  priceIntervalName,
  currentStartDate,
  currentInstance,
  onSuccess,
}: CancelFuturePriceIntervalDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Prepare the API payload for preview
  const apiPayload = {
    edit: [
      {
        price_interval_id: priceIntervalId,
        end_date: currentStartDate, // Setting end_date to start_date cancels the interval
      },
    ],
  };

  const handleConfirmCancellation = useCallback(async () => {
    if (!subscriptionId || !priceIntervalId || !currentStartDate) {
      toast.error("Missing necessary information to cancel the schedule.");
      return;
    }
    setIsLoading(true);
    try {
      const result = await editPriceIntervalSchedule(
        subscriptionId,
        [{
          price_interval_id: priceIntervalId,
          end_date: currentStartDate, // Setting end_date to start_date cancels the interval
        }],
        currentInstance
      );

      if (result.success) {
        toast.success(`The add-on "${priceIntervalName}" is no longer scheduled.`);
        onSuccess();
        onClose();
      } else {
        throw new Error(result.error || "Failed to cancel scheduled price.");
      }
    } catch (error) {
      console.error("Error cancelling price interval schedule:", error);
      toast.error(error instanceof Error ? error.message : "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  }, [
    subscriptionId,
    priceIntervalId,
    priceIntervalName,
    currentStartDate,
    currentInstance,
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
          <DialogTitle>Cancel Scheduled Add-on</DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel the scheduled add-on: <strong>{priceIntervalName}</strong>?
            It is currently scheduled to start on <strong>{currentStartDate}</strong>. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex justify-between items-center">
          <div className="flex-1">
            <ApiPreviewDialog
              payload={apiPayload}
              endpoint={`https://api.withorb.com/v1/subscriptions/${subscriptionId}/price_intervals`}
              method="POST"
              title="Preview API Call: Cancel Schedule"
              description="This shows the data that will be sent to cancel the scheduled add-on."
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
              onClick={handleConfirmCancellation}
              disabled={isLoading}
            >
              {isLoading ? "Cancelling..." : "Confirm Cancellation"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 