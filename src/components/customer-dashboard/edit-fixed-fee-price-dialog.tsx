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
import { ApiPreviewDialog } from "../dialogs/api-preview-dialog";
// Import Subscription and related types (Removed PriceInterval)
import type { Subscription, FixedFeeQuantityTransition } from "@/lib/types"; 

// Define JsonValue type based on ApiPreviewDialog props
type JsonValue = string | number | boolean | null | { [key: string]: JsonValue } | JsonValue[];

// Rename interface
interface EditFixedFeePriceDialogProps { 
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName?: string; 
  currentQuantity?: number;
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
  
  // State for the *new target quantity*
  const [newQuantity, setNewQuantity] = React.useState<number>(currentQuantity);
  const [effectiveDate, setEffectiveDate] = React.useState<Date | null>(null); 
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false); 
  
  // --- Helper to get existing transitions --- 
  const getExistingTransitions = React.useCallback((): FixedFeeQuantityTransition[] => {
    if (!activeSubscription?.price_intervals || !priceIntervalId) return [];
    const interval = activeSubscription.price_intervals.find(pi => pi.id === priceIntervalId);
    return interval?.fixed_fee_quantity_transitions ?? [];
  }, [activeSubscription, priceIntervalId]);

  const formatDateForInput = (date: Date): string => {
    // Ensure formatting uses UTC to avoid timezone shifts when comparing/setting min
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  // Derive minimum selectable date (day after current period start)
  const minDateForInput = React.useMemo(() => {
    if (!currentPeriodStartDate) return null;
    try {
      const startDate = new Date(currentPeriodStartDate);
      // Ensure parsing didn't fail and add one day (using UTC methods)
      if (!isNaN(startDate.getTime())) {
        const nextDay = new Date(startDate);
        nextDay.setUTCDate(startDate.getUTCDate() + 1);
        return formatDateForInput(nextDay);
      }
    } catch { /* Handle potential parsing error */ }
    return null; // Return null if parsing fails or prop is absent
  }, [currentPeriodStartDate]);

  // Derive current period start date formatted string for comparison
  const currentPeriodStartDateStr = React.useMemo(() => {
     if (!currentPeriodStartDate) return null;
     try {
       const startDate = new Date(currentPeriodStartDate);
       if (!isNaN(startDate.getTime())) {
         return formatDateForInput(startDate);
       }
     } catch { /* Handle potential parsing error */ }
     return null;
  }, [currentPeriodStartDate]);

  // --- Calculations for Display --- 
  const quantityChange = newQuantity - currentQuantity;
  
  // Calculate cost based on tiered model (assume 1 free, then addOnPrice for others)
  const calculateCost = (qty: number) => Math.max(0, qty - 1) * addOnPrice;
  
  const currentCost = calculateCost(currentQuantity);
  const newCost = calculateCost(newQuantity);
  const costChange = newCost - currentCost;

  // --- Event Handlers --- 
  const handleDecrement = () => {
    setNewQuantity((prev) => Math.max(1, prev - 1)); // Ensure quantity >= 1
  };
  const handleIncrement = () => {
    setNewQuantity((prev) => prev + 1);
  };
  
  const handleConfirm = async () => { 
    if (!priceIntervalId) {
      toast.error("Error", { description: "Price interval ID is missing.", duration: 3000 });
      return;
    }
    if (!effectiveDate || !currentPeriodStartDateStr || formatDateForInput(effectiveDate) <= currentPeriodStartDateStr) {
      toast.error("Invalid Date", { description: "Effective date must be after the current period start.", duration: 3000 });
      return;
    }
    // No change check
    if (newQuantity === currentQuantity) {
      toast.info("No Change", { description: "The quantity has not been changed.", duration: 3000 });
      onOpenChange(false); // Close dialog if no change
      return;
    }

    setIsSubmitting(true); 
    const effectiveDateStr = formatDateForInput(effectiveDate);

    // --- Get existing transitions and combine with the new one --- 
    const existingTransitions = getExistingTransitions();
    const newTransition: FixedFeeQuantityTransition = {
      quantity: newQuantity, 
      effective_date: effectiveDateStr 
    };

    // Combine, removing any potential duplicate effective dates (keep the latest new one)
    const allTransitions = [
      ...existingTransitions.filter(t => t.effective_date !== effectiveDateStr), 
      newTransition
    ].sort((a, b) => a.effective_date.localeCompare(b.effective_date)); // Sort chronologically
    
    console.log("[EditFixedFeePriceDialog] Sending Transitions:", allTransitions);

    try {
      // Pass the full list of transitions to the action
      const result = await editPriceIntervalQuantity(
        subscriptionId,
        priceIntervalId, 
        allTransitions // Pass the combined list
        // Remove newQuantity and effectiveDateStr as separate args
        // newQuantity, 
        // effectiveDateStr
      );

      if (result.success) {
        toast.success(`${itemName} Quantity Update Scheduled`, {
          description: `Set to ${newQuantity} effective ${effectiveDateStr}. Existing schedules preserved.`, // Update description
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
      // Only close if successful?
      // onOpenChange(false); // Consider moving this inside success block or relying on onSuccess
    }
  };

  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      setNewQuantity(currentQuantity); // Initialize with current quantity
      setEffectiveDate(null); 
      setIsSubmitting(false); 
    }
  }, [open, currentQuantity]); // Add currentQuantity dependency

  // Format price helper (simple example)
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  // --- Construct API Preview Data ---
  const apiEndpoint = `https://api.withorb.com/v1/subscriptions/${subscriptionId}/price_intervals`;
  // Update payload preview to show the full transition list
  const apiPayload = React.useMemo(() => {
    if (!priceIntervalId || !effectiveDate) {
      return {} as Record<string, JsonValue>; 
    }
    const existingTransitions = getExistingTransitions();
    const newTransition = { quantity: newQuantity, effective_date: formatDateForInput(effectiveDate) };
    const allTransitions = [
      ...existingTransitions.filter(t => t.effective_date !== newTransition.effective_date),
      newTransition
    ].sort((a, b) => a.effective_date.localeCompare(b.effective_date));
    
    return {
      edit: [
        {
          price_interval_id: priceIntervalId,
          fixed_fee_quantity_transitions: allTransitions, // Show the full list
        },
      ],
    };
  }, [priceIntervalId, newQuantity, effectiveDate, getExistingTransitions]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={true}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adjust {itemName} Quantity</DialogTitle> {/* Updated Title */}
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
          <div className={`text-right font-medium ${quantityChange > 0 ? 'text-green-600' : quantityChange < 0 ? 'text-red-600' : ''}`}>
            {quantityChange > 0 ? '+' : ''}{quantityChange}
          </div>

          <div className="font-medium text-muted-foreground">Cost Change / month</div>
          <div className={`text-right font-medium ${costChange > 0 ? 'text-green-600' : costChange < 0 ? 'text-red-600' : ''}`}>
            {costChange > 0 ? '+' : ''}{formatCurrency(costChange)}
          </div>

          <div className="font-medium text-muted-foreground">New Total Cost / month</div>
          <div className="text-right font-semibold">{formatCurrency(newCost)}</div>
          
          <Label htmlFor="effective-date" className="font-medium text-muted-foreground self-center">
            Effective Date
          </Label>
          <Input
            id="effective-date"
            type="date"
            value={effectiveDate ? formatDateForInput(effectiveDate) : ""}
            onChange={(e) => {
              const selectedValue = e.target.value; // YYYY-MM-DD string
              if (!selectedValue || !currentPeriodStartDateStr) {
                  setEffectiveDate(null);
                  return;
              }
              try {
                // Parse selected date as UTC to avoid timezone issues
                const [year, month, day] = selectedValue.split('-').map(Number);
                const parsedDate = new Date(Date.UTC(year, month - 1, day));

                // Check if valid and strictly after current period start date
                if (!isNaN(parsedDate.getTime()) && selectedValue > currentPeriodStartDateStr) {
                    setEffectiveDate(parsedDate);
                } else {
                    setEffectiveDate(null); // Invalid selection
                    toast.error("Invalid Date", { 
                       description: "Date must be after the current billing period start.", 
                       duration: 3000 
                    });
                }
              } catch { 
                 setEffectiveDate(null); // Parsing error
              }
            }}
            min={minDateForInput ?? undefined} // Set min date (day after start)
            className={cn(
              "flex justify-end h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
              "text-sm" 
            )}
            disabled={isSubmitting || !minDateForInput} // Disable if min date couldn't be calculated
          />
        </div>
        <DialogFooter className="flex flex-row justify-between items-center sm:justify-between"> {/* Use flex row and justify-between */}
          {/* API Preview Button (aligned left) */}
          <ApiPreviewDialog 
            endpoint={apiEndpoint}
            method="POST"
            payload={apiPayload}
            title={`Update ${itemName} Quantity`}
            description={`Schedules a transition for the ${itemName.toLowerCase()} quantity.`}
            buttonVariant="outline" // Changed from ghost to outline
            buttonText="Preview API Call" // Changed text
            className="mr-auto" 
            disabled={!priceIntervalId || !effectiveDate} 
          />
          {/* Schedule Change Button (aligned right) */}
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