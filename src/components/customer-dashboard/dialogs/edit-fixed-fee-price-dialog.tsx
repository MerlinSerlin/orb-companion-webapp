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
  // DialogTrigger, // Trigger will be handled externally
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input"; // Example input
import { Label } from "@/components/ui/label"; // Example label
import { cn } from "@/lib/utils"; // Add cn utility
import { editPriceIntervalQuantity } from "@/app/actions"; // Updated import name
import { toast } from "sonner"; // Import toast
import { Loader2, Minus, Plus } from "lucide-react"; // Added Minus, Plus
import { ApiPreviewDialog } from "../../dialogs/api-preview-dialog";
// Import Subscription and related types (Removed PriceInterval)
import type { Subscription, FixedFeeQuantityTransition } from "@/lib/types"; 

// Re-define JsonValue locally to match ApiPreviewDialog's expected prop type structure
type JsonValue = string | number | boolean | null | { [key: string]: JsonValue } | JsonValue[];

// Rename interface
interface EditFixedFeePriceDialogProps { 
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName?: string; 
  currentQuantity: number;
  addOnPrice: number; 
  subscriptionId: string; 
  priceIntervalId?: string; 
  currentPeriodStartDate?: string | null; 
  onSuccess?: () => void; 
  activeSubscription?: Subscription | null; 
}

// Rename component export
export function EditFixedFeePriceDialog({ 
  open, 
  onOpenChange, 
  itemName = "Add-on", 
  currentQuantity = 0, 
  addOnPrice, 
  subscriptionId, 
  priceIntervalId, 
  currentPeriodStartDate, 
  onSuccess, 
  activeSubscription, 
}: EditFixedFeePriceDialogProps) {
  
  const [newQuantity, setNewQuantity] = React.useState<number>(currentQuantity);
  const [effectiveDate, setEffectiveDate] = React.useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false); 
  
  const getContextData = React.useCallback(() => {
    if (!activeSubscription?.price_intervals || !priceIntervalId) return { existingTransitions: [], itemPriceId: undefined };
    const interval = activeSubscription.price_intervals.find(pi => pi.id === priceIntervalId);
    return {
        existingTransitions: interval?.fixed_fee_quantity_transitions ?? [],
        itemPriceId: interval?.price?.id 
    };
  }, [activeSubscription, priceIntervalId]);

  const formatDateForInput = React.useCallback((date: Date): string => {
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);
  
  const minDateForInput = React.useMemo(() => {
    if (!currentPeriodStartDate) return null;
    try {
      const startDate = new Date(currentPeriodStartDate);
      if (!isNaN(startDate.getTime())) {
        const nextDay = new Date(startDate);
        nextDay.setUTCDate(startDate.getUTCDate() + 1);
        return formatDateForInput(nextDay);
      }
    } catch { /* Handle potential parsing error */ }
    return null; 
  }, [currentPeriodStartDate, formatDateForInput]);

  const currentPeriodStartDateStr = React.useMemo(() => {
     if (!currentPeriodStartDate) return null;
     try {
       const startDate = new Date(currentPeriodStartDate);
       if (!isNaN(startDate.getTime())) {
         return formatDateForInput(startDate);
       }
     } catch { /* Handle potential parsing error */ }
     return null;
  }, [currentPeriodStartDate, formatDateForInput]);

  const quantityChangeDisplay = newQuantity - currentQuantity;
  const calculateCost = (qty: number) => Math.max(0, qty - 1) * addOnPrice;
  const currentCostDisplay = calculateCost(currentQuantity);
  const newCostDisplay = calculateCost(newQuantity);
  const costChangeDisplay = newCostDisplay - currentCostDisplay;

  const handleDecrement = () => setNewQuantity((prev) => Math.max(1, prev - 1));
  const handleIncrement = () => setNewQuantity((prev) => prev + 1);
  
  const handleConfirm = async () => { 
    if (!priceIntervalId) {
      toast.error("Error", { description: "Price interval ID is missing.", duration: 3000 });
      return;
    }
    if (!effectiveDate || !currentPeriodStartDateStr || formatDateForInput(effectiveDate) <= currentPeriodStartDateStr) {
      toast.error("Invalid Date", { description: "Effective date must be after the current period start.", duration: 3000 });
      return;
    }
    if (newQuantity === currentQuantity) {
      toast.info("No Change", { description: "The quantity has not been changed.", duration: 3000 });
      onOpenChange(false);
      return;
    }

    setIsSubmitting(true); 
    const effectiveDateStr = formatDateForInput(effectiveDate);
    const { existingTransitions, itemPriceId } = getContextData();

    const newTransition: FixedFeeQuantityTransition = {
      quantity: newQuantity, 
      effective_date: effectiveDateStr,
      price_id: itemPriceId 
    };

    const allTransitions = [
      ...existingTransitions.filter(t => t.effective_date !== effectiveDateStr), 
      newTransition
    ].sort((a, b) => a.effective_date.localeCompare(b.effective_date));
        
    try {
      const result = await editPriceIntervalQuantity(subscriptionId, priceIntervalId, allTransitions);
      if (result.success) {
        toast.success(`${itemName} Quantity Update Scheduled`, {
          description: `Set to ${newQuantity} effective ${effectiveDateStr}. Existing schedules preserved.`, 
          duration: 5000,
        });
        if (onSuccess) onSuccess();
      } else {
        throw new Error(result.error || `Failed to update ${itemName} quantity.`);
      }
    } catch (error) {
      console.error(`Error updating ${itemName} quantity:`, error);
      toast.error("Update Failed", { 
        description: error instanceof Error ? error.message : "An unknown error occurred",
        duration: 5000
       });
    } finally {
      setIsSubmitting(false); 
    }
  };

  React.useEffect(() => {
    if (open) {
      setNewQuantity(currentQuantity);
      setEffectiveDate(null); 
      setIsSubmitting(false); 
    }
  }, [open, currentQuantity]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const apiEndpoint = `https://api.withorb.com/v1/subscriptions/${subscriptionId}/price_intervals`;
  const apiPayload = React.useMemo(() => {
    if (!priceIntervalId || !effectiveDate) {
      return {} as Record<string, JsonValue>; // Return empty object typed as Record<string, JsonValue>
    }
    const { existingTransitions, itemPriceId } = getContextData();
    const newTransitionForPayload: FixedFeeQuantityTransition = {
        quantity: newQuantity, 
        effective_date: formatDateForInput(effectiveDate),
        price_id: itemPriceId
    };
    const allTransitionsForPayload = [
      ...existingTransitions.filter(t => t.effective_date !== newTransitionForPayload.effective_date),
      newTransitionForPayload
    ].sort((a, b) => a.effective_date.localeCompare(b.effective_date));
    
    return {
      edit: [
        {
          price_interval_id: priceIntervalId,
          fixed_fee_quantity_transitions: allTransitionsForPayload,
        },
      ],
    } as Record<string, JsonValue>; // Cast the final structure for ApiPreviewDialog
  }, [priceIntervalId, newQuantity, effectiveDate, getContextData, formatDateForInput]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={true}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adjust {itemName} Quantity</DialogTitle>
          <DialogDescription>
            Set the total number of {itemName.toLowerCase()}s effective from the chosen date.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 py-4 text-sm"> 
          <div className="font-medium text-muted-foreground">Current Quantity</div>
          <div className="text-right font-medium">{currentQuantity}</div>

          <div className="font-medium text-muted-foreground">Price per Additional Unit</div>
          <div className="text-right font-medium">{formatCurrency(addOnPrice)} (after first)</div>

          <Label htmlFor="quantity-adjust" className="font-medium text-muted-foreground self-center">
            New Total Quantity
          </Label>
          <div id="quantity-adjust" className="flex items-center justify-end space-x-2">
            <Button 
              variant="outline" 
              size="icon" 
              className="h-7 w-7" 
              onClick={handleDecrement}
              disabled={newQuantity <= 1 || isSubmitting}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="font-medium w-8 text-center">{newQuantity}</span>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-7 w-7" 
              onClick={handleIncrement}
              disabled={isSubmitting}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="font-medium text-muted-foreground">Change</div>
          <div className={`text-right font-medium ${quantityChangeDisplay > 0 ? 'text-green-600' : quantityChangeDisplay < 0 ? 'text-red-600' : ''}`}>
            {quantityChangeDisplay > 0 ? '+' : ''}{quantityChangeDisplay}
          </div>

          <div className="font-medium text-muted-foreground">Cost Change / month</div>
          <div className={`text-right font-medium ${costChangeDisplay > 0 ? 'text-green-600' : costChangeDisplay < 0 ? 'text-red-600' : ''}`}>
            {costChangeDisplay > 0 ? '+' : ''}{formatCurrency(costChangeDisplay)}
          </div>

          <div className="font-medium text-muted-foreground">New Total Cost / month</div>
          <div className="text-right font-semibold">{formatCurrency(newCostDisplay)}</div>
          
          <Label htmlFor="effective-date" className="font-medium text-muted-foreground self-center">
            Effective Date
          </Label>
          <Input
            id="effective-date"
            type="date"
            value={effectiveDate ? formatDateForInput(effectiveDate) : ""}
            onChange={(e) => {
              const selectedValue = e.target.value; 
              if (!selectedValue || !currentPeriodStartDateStr) {
                  setEffectiveDate(null);
                  return;
              }
              try {
                const [year, month, day] = selectedValue.split('-').map(Number);
                const parsedDate = new Date(Date.UTC(year, month - 1, day));
                if (!isNaN(parsedDate.getTime()) && selectedValue > currentPeriodStartDateStr) {
                    setEffectiveDate(parsedDate);
                } else {
                    setEffectiveDate(null); 
                    toast.error("Invalid Date", { 
                       description: "Date must be after the current billing period start.", 
                       duration: 3000 
                    });
                }
              } catch { 
                 setEffectiveDate(null); 
              }
            }}
            min={minDateForInput ?? undefined} 
            className={cn(
              "flex justify-end h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
              "text-sm" 
            )}
            disabled={isSubmitting || !minDateForInput}
          />
        </div>
        <DialogFooter className="flex flex-row justify-between items-center sm:justify-between">
          <ApiPreviewDialog 
            endpoint={apiEndpoint}
            method="POST"
            payload={apiPayload} 
            title={`Update ${itemName} Quantity`}
            description={`Schedules a transition for the ${itemName.toLowerCase()} quantity.`}
            buttonVariant="outline"
            buttonText="Preview API Call"
            className="mr-auto" 
            disabled={!priceIntervalId || !effectiveDate} 
          />
          <Button 
            type="button" 
            onClick={handleConfirm} 
            disabled={isSubmitting || newQuantity === currentQuantity || !effectiveDate || !currentPeriodStartDateStr || formatDateForInput(effectiveDate) <= currentPeriodStartDateStr}
          >
            {isSubmitting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Scheduling...</>
            ) : (
              "Schedule Change"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 