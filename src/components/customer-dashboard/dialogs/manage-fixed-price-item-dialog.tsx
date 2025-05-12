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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { editPriceIntervalQuantity, removeFixedFeeTransition } from "@/app/actions/orb";
import { toast } from "sonner";
import { Loader2, Minus, Plus, Trash2 } from "lucide-react";
import { ApiPreviewDialog } from "../../dialogs/api-preview-dialog";
import type { Subscription, FixedFeeQuantityTransition } from "@/lib/types";
import { formatNumber, formatDate } from "@/lib/utils/formatters";

// Uncommented JsonValue type
type JsonValue = string | number | boolean | null | { [key: string]: JsonValue } | JsonValue[];

interface ManageFixedPriceItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string;
  currentQuantity: number;
  addOnPrice: number; // For cost calculation in schedule tab
  subscriptionId: string;
  priceIntervalId: string; // Made non-optional as it's key for all operations
  currentPeriodStartDate?: string | null;
  activeSubscription?: Subscription | null; // To get all current transitions
  // Callback for successful scheduling of a new/updated transition list
  onScheduleSuccess?: () => void; 
  // Callback for successful removal of a single transition
  onRemoveSuccess?: () => void; 
  dialogTitle?: string;
  dialogDescription?: string;
}

export function ManageFixedPriceItemDialog({
  open,
  onOpenChange,
  itemName,
  currentQuantity = 0,
  addOnPrice,
  subscriptionId,
  priceIntervalId,
  currentPeriodStartDate,
  activeSubscription,
  onScheduleSuccess,
  onRemoveSuccess,
  dialogTitle,
  dialogDescription
}: ManageFixedPriceItemDialogProps) {

  const [newQuantityState, setNewQuantityState] = React.useState<number>(currentQuantity);
  const [effectiveDateState, setEffectiveDateState] = React.useState<Date | null>(null);
  const [isScheduling, setIsScheduling] = React.useState<boolean>(false);
  const [isRemoving, setIsRemoving] = React.useState<string | null>(null); // Stores effective_date of item being removed

  // --- Helpers ---
  const getContextData = React.useCallback(() => {
    if (!activeSubscription?.price_intervals) return { existingTransitions: [] as FixedFeeQuantityTransition[], itemPriceId: undefined as (string | undefined) };
    const interval = activeSubscription.price_intervals.find(pi => pi.id === priceIntervalId);
    return {
        existingTransitions: interval?.fixed_fee_quantity_transitions?.sort((a,b) => new Date(a.effective_date).getTime() - new Date(b.effective_date).getTime()) ?? [] as FixedFeeQuantityTransition[],
        itemPriceId: interval?.price?.id
    };
  }, [activeSubscription, priceIntervalId]);

  const formatDateForInputInternal = React.useCallback((date: Date): string => {
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const { existingTransitions, itemPriceId } = getContextData();

  // --- "Schedule Change" Tab Logic ---
  const minDateForScheduleTab = React.useMemo(() => {
    if (!currentPeriodStartDate) return null;
    try {
      const startDate = new Date(currentPeriodStartDate);
      if (!isNaN(startDate.getTime())) {
        const nextDay = new Date(startDate);
        nextDay.setUTCDate(startDate.getUTCDate() + 1);
        return formatDateForInputInternal(nextDay);
      }
    } catch { /* Handle potential parsing error */ }
    return null;
  }, [currentPeriodStartDate, formatDateForInputInternal]);

  const currentPeriodStartDateStrForScheduleTab = React.useMemo(() => {
     if (!currentPeriodStartDate) return null;
     try {
       const startDate = new Date(currentPeriodStartDate);
       if (!isNaN(startDate.getTime())) {
         return formatDateForInputInternal(startDate);
       }
     } catch { /* Handle potential parsing error */ }
     return null;
  }, [currentPeriodStartDate, formatDateForInputInternal]);

  const quantityChangeDisplay = newQuantityState - currentQuantity;
  const calculateCost = (qty: number) => Math.max(0, qty - 1) * addOnPrice; // Assuming first unit might be free based on typical add-on pricing
  const currentCostDisplay = calculateCost(currentQuantity);
  const newCostDisplay = calculateCost(newQuantityState);
  const costChangeDisplay = newCostDisplay - currentCostDisplay;

  const handleDecrement = () => setNewQuantityState((prev: number) => Math.max(1, prev - 1));
  const handleIncrement = () => setNewQuantityState((prev: number) => prev + 1);

  const handleScheduleConfirm = async () => {
    if (!effectiveDateState || !currentPeriodStartDateStrForScheduleTab || formatDateForInputInternal(effectiveDateState) <= currentPeriodStartDateStrForScheduleTab) {
      toast.error("Invalid Date", { description: "Effective date must be after the current period start.", duration: 3000 });
      return;
    }
    if (newQuantityState === currentQuantity) {
      // This logic might need refinement: if the date is different, it's still a new schedule.
      // For now, assuming "no change" means quantity and date are effectively the same as an existing one or current.
      toast.info("No Change", { description: "The quantity has not been changed from current for the new date.", duration: 3000 });
      // onOpenChange(false); // Don't close, user might want to manage other tabs
      return;
    }

    setIsScheduling(true);
    const effectiveDateStr = formatDateForInputInternal(effectiveDateState);
    
    const newTransitionToAdd: FixedFeeQuantityTransition = {
      quantity: newQuantityState,
      effective_date: effectiveDateStr,
      price_id: itemPriceId
    };

    const updatedSchedule = [
      ...existingTransitions.filter(t => t.effective_date !== effectiveDateStr), // Remove any existing for this date
      newTransitionToAdd
    ].sort((a, b) => new Date(a.effective_date).getTime() - new Date(b.effective_date).getTime());

    try {
      const result = await editPriceIntervalQuantity(subscriptionId, priceIntervalId, updatedSchedule);
      if (result.success) {
        toast.success(`${itemName} Change Scheduled`, {
          description: `Set to ${newQuantityState} effective ${effectiveDateStr}.`,
          duration: 5000,
        });
        setNewQuantityState(currentQuantity); // Reset form
        setEffectiveDateState(null);
        if (onScheduleSuccess) onScheduleSuccess(); // This will trigger data re-fetch
      } else {
        throw new Error(result.error || `Failed to schedule ${itemName} change.`);
      }
    } catch (error) {
      console.error(`Error scheduling ${itemName} change:`, error);
      toast.error("Scheduling Failed", {
        description: error instanceof Error ? error.message : "An unknown error occurred",
        duration: 5000
       });
    } finally {
      setIsScheduling(false);
    }
  };
  
  // Uncommented scheduleApiPayload
  const scheduleApiPayload = React.useMemo((): Record<string, JsonValue> => {
    // Guard against effectiveDateState being null before calling formatDateForInputInternal
    if (!priceIntervalId || !effectiveDateState) return {} as Record<string, JsonValue>; 
    
    const newTransitionPreview: FixedFeeQuantityTransition = {
        quantity: newQuantityState,
        effective_date: formatDateForInputInternal(effectiveDateState), // Safe now due to guard
        price_id: itemPriceId
    };
    const scheduleForPreview: FixedFeeQuantityTransition[] = [
      ...existingTransitions.filter(t => t.effective_date !== newTransitionPreview.effective_date),
      newTransitionPreview
    ].sort((a,b) => new Date(a.effective_date).getTime() - new Date(b.effective_date).getTime());

    return {
      edit: [{ price_interval_id: priceIntervalId, fixed_fee_quantity_transitions: scheduleForPreview }]
    } as Record<string, JsonValue>; 
  }, [priceIntervalId, newQuantityState, effectiveDateState, existingTransitions, itemPriceId, formatDateForInputInternal]);

  // --- "Manage Scheduled" Tab Logic ---
  const futureTransitions = React.useMemo(() => {
    const today = formatDateForInputInternal(new Date());
    return (existingTransitions || []).filter(t => t.effective_date > today);
  }, [existingTransitions, formatDateForInputInternal]);

  const handleRemoveTransition = async (effectiveDateToRemove: string) => {
    setIsRemoving(effectiveDateToRemove);
    try {
      const result = await removeFixedFeeTransition(subscriptionId, priceIntervalId, effectiveDateToRemove);
      if (result.success) {
        toast.success("Scheduled Change Removed", {
          description: `The change scheduled for ${formatDate(effectiveDateToRemove)} has been removed.`,
        });
        if (onRemoveSuccess) onRemoveSuccess(); // This will trigger data re-fetch
      } else {
        throw new Error(result.error || "Failed to remove scheduled change.");
      }
    } catch (error) {
      console.error("Error removing scheduled transition:", error);
      toast.error("Removal Failed", {
        description: error instanceof Error ? error.message : "An unknown error occurred"
      });
    } finally {
      setIsRemoving(null);
    }
  };

  // Reset form state when dialog opens/closes or currentQuantity changes
  React.useEffect(() => {
    if (open) {
      setNewQuantityState(currentQuantity);
      setEffectiveDateState(null);
      setIsScheduling(false);
      setIsRemoving(null);
    }
  }, [open, currentQuantity]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={true}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {dialogTitle || `Adjust ${itemName} Quantity`}
          </DialogTitle>
          <DialogDescription>
            {dialogDescription || `Set the total number of ${itemName.toLowerCase()} effective from the chosen date.`}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="schedule" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="schedule">Schedule Change</TabsTrigger>
            <TabsTrigger value="manage">Manage Scheduled</TabsTrigger>
          </TabsList>

          {/* --- Schedule Change Tab --- */}
          <TabsContent value="schedule" className="pt-4">
            <div className="space-y-4">
              
              <div className="flex justify-between items-center text-sm">
                <Label>Current Quantity</Label>
                <span className="font-medium">{currentQuantity}</span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <Label>Price per Additional Unit</Label>
                <span className="font-medium">
                  {formatCurrency(addOnPrice)} (after first)
                </span>
              </div>

              <div className="flex justify-between items-center">
                <Label htmlFor="newQuantityInput" className="text-sm">New Total Quantity</Label>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="icon" onClick={handleDecrement} disabled={newQuantityState <= 1 || isScheduling} className="h-8 w-8">
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    id="newQuantityInput"
                    type="number"
                    value={newQuantityState}
                    onChange={(e) => setNewQuantityState(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-12 text-center h-8 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    min="1"
                    disabled={isScheduling}
                  />
                  <Button variant="outline" size="icon" onClick={handleIncrement} disabled={isScheduling} className="h-8 w-8">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex justify-between items-center text-sm">
                <Label>Change</Label>
                <span className={`font-medium ${quantityChangeDisplay >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {quantityChangeDisplay >= 0 ? '+' : ''}{quantityChangeDisplay}
                </span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <Label>Cost Change / month</Label>
                <span className={`font-medium ${costChangeDisplay >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {costChangeDisplay >= 0 ? '+' : ''}{formatCurrency(costChangeDisplay)}
                </span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <Label>New Total Cost / month</Label>
                <span className="font-medium">{formatCurrency(newCostDisplay)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <Label htmlFor="effectiveDate" className="text-sm">Effective Date</Label>
                <div className="w-48 flex justify-end">
                    <Input
                    id="effectiveDate"
                    type="date"
                    value={effectiveDateState ? formatDateForInputInternal(effectiveDateState) : ""}
                    onChange={(e) => e.target.value ? setEffectiveDateState(new Date(e.target.value + "T00:00:00")) : setEffectiveDateState(null) }
                    min={minDateForScheduleTab || undefined}
                    className="h-8 w-auto"
                    disabled={isScheduling || !minDateForScheduleTab}
                    />
                </div>
              </div>
               {currentPeriodStartDateStrForScheduleTab && (
                   <p className="text-xs text-muted-foreground text-right -mt-2 mr-1">
                       Changes post: {formatDate(currentPeriodStartDateStrForScheduleTab)}
                   </p>
               )}

            </div>
            <div className="mt-8 flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 sm:space-x-2">
                <ApiPreviewDialog
                  payload={scheduleApiPayload}
                  endpoint={`https://api.withorb.com/v1/subscriptions/${subscriptionId}/price_intervals`}
                  method="POST" 
                  title="Preview API Call: Schedule Change"
                  description="This shows the data that will be sent to update the scheduled quantity for Concurrent Builds."
                  buttonText="Preview API Call"
                  buttonVariant="outline"
                  disabled={isScheduling || !effectiveDateState || (newQuantityState === currentQuantity && !Object.keys(scheduleApiPayload).length) }
                />
                <Button 
                  onClick={handleScheduleConfirm} 
                  disabled={isScheduling || !effectiveDateState || (newQuantityState === currentQuantity)}
                >
                  {isScheduling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Schedule Change
                </Button>
            </div>
          </TabsContent>

          {/* --- Manage Scheduled Tab --- */}
          <TabsContent value="manage" className="pt-4">
            {futureTransitions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No future changes scheduled for {itemName.toLowerCase()}.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {futureTransitions.map((transition) => {
                  const lineItemRemovePayload = {
                    edit: [{
                      price_interval_id: priceIntervalId,
                      fixed_fee_quantity_transitions: (existingTransitions || []).filter(
                        t => t.effective_date !== transition.effective_date
                      )
                    }]
                  } as Record<string, JsonValue>;

                  return (
                    <div key={transition.effective_date} className="flex items-center justify-between p-2 border rounded-md text-sm">
                      <div>
                        Change to <span className="font-semibold">{formatNumber(transition.quantity)}</span> on <span className="font-semibold">{formatDate(transition.effective_date)}</span>
                      </div>
                      <div className="flex items-center space-x-1"> 
                        <ApiPreviewDialog
                          payload={lineItemRemovePayload}
                          endpoint={`https://api.withorb.com/v1/subscriptions/${subscriptionId}/price_intervals`}
                          method="POST"
                          title={`Preview Removing Change for: ${formatDate(transition.effective_date)}`}
                          description={`This shows the API call to remove the scheduled change effective ${formatDate(transition.effective_date)}.`}
                          buttonVariant="ghost" 
                          buttonSize="icon" 
                          buttonText="" // No text, rely on Info icon rendered by ApiPreviewDialog
                          className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700" // Styling for the button
                          disabled={isRemoving === transition.effective_date} 
                          // No children needed here, ApiPreviewDialog renders its own trigger button with Info icon
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          onClick={() => handleRemoveTransition(transition.effective_date)}
                          disabled={isRemoving === transition.effective_date}
                          title="Remove this scheduled change"
                        >
                          {isRemoving === transition.effective_date ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
} 