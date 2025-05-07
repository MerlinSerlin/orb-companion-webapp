'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { addPriceInterval, getPriceDetails } from "@/app/actions"; // Import actions
import { ApiPreviewDialog } from "@/components/dialogs/api-preview-dialog"; // Reuse API preview
import type { Price } from "@/lib/types"; // Import Price type
// Import UI components needed for date input
import { Input } from "@/components/ui/input"; 
import { Label } from "@/components/ui/label"; 
import { cn } from "@/lib/utils";

// Define JsonValue type for ApiPreviewDialog
type JsonValue = string | number | boolean | null | { [key: string]: JsonValue } | JsonValue[];

interface AddNewFeatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string; 
  priceIdToAdd: string;
  subscriptionId: string;
  onSuccess?: () => void;
}

// Helper function to display price info (basic example)
function displayPriceInfo(price: Price | null): string {
  if (!price) return "Price details not available.";

  if (price.model_type === 'package' && price.package_config) {
    const { package_amount, package_size } = price.package_config;
    const currencySymbol = price.currency === 'USD' ? '$' : ''; // Basic currency handling
    return `${currencySymbol}${package_amount} / ${package_size.toLocaleString()} ${price.item?.name || 'units'}`;
  }
  
  // Add more formatting logic for other model_types if needed (tiered, unit, etc.)
  // Example for unit pricing:
  if (price.model_type === 'unit' && price.unit_config?.unit_amount) {
      const currencySymbol = price.currency === 'USD' ? '$' : '';
      return `${currencySymbol}${price.unit_config.unit_amount} / ${price.item?.name || 'unit'}`;
  }

  return `Price: ${price.name} (Type: ${price.model_type})`; // Fallback
}

// Copied from AddOnDialog
const formatDateForInput = (date: Date): string => {
  const year = date.getUTCFullYear();
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = date.getUTCDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function AddNewFeatureDialog({ 
  open, 
  onOpenChange, 
  itemName, 
  priceIdToAdd,
  subscriptionId,
  onSuccess 
}: AddNewFeatureDialogProps) {
  
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [priceDetails, setPriceDetails] = React.useState<Price | null>(null);
  const [isLoadingPrice, setIsLoadingPrice] = React.useState<boolean>(false);
  const [errorLoadingPrice, setErrorLoadingPrice] = React.useState<string | null>(null);
  // Add state for the selected start date
  const [startDate, setStartDate] = React.useState<Date | null>(null);

  // --- Calculate today's date for default/min --- 
  const todayFormatted = React.useMemo(() => formatDateForInput(new Date()), []);

  // Fetch price details when the dialog opens or priceId changes
  React.useEffect(() => {
    if (open && priceIdToAdd) {
      const fetchDetails = async () => {
        setIsLoadingPrice(true);
        setErrorLoadingPrice(null);
        setPriceDetails(null); // Clear previous details
        try {
          const result = await getPriceDetails(priceIdToAdd);
          if (result.success && result.price) {
            setPriceDetails(result.price);
          } else {
            setErrorLoadingPrice(result.error || "Failed to fetch price details.");
          }
        } catch (error) {
          setErrorLoadingPrice(error instanceof Error ? error.message : "An unknown error occurred.");
        } finally {
          setIsLoadingPrice(false);
        }
      };
      fetchDetails();
    } else {
      // Clear details if dialog is closed or priceId is missing
      setPriceDetails(null);
      setIsLoadingPrice(false);
      setErrorLoadingPrice(null);
    }
  }, [open, priceIdToAdd]);

  // Reset state when dialog opens, including the date
  React.useEffect(() => {
    if (open) {
      setIsSubmitting(false);
      setPriceDetails(null);
      setIsLoadingPrice(false);
      setErrorLoadingPrice(null);
      setStartDate(null); // Reset date on open
    } 
    // Fetch logic moved to separate effect
  }, [open]);

  // Handler for the confirmation button
  const handleConfirm = async () => { 
    setIsSubmitting(true);
    // Determine the start date to use: selected date or default to today
    const effectiveStartDate = startDate ? formatDateForInput(startDate) : todayFormatted;
    
    console.log(`[AddNewFeatureDialog] Confirming add with start date: ${effectiveStartDate}`);

    try {
      // Pass the chosen start date to the action
      const result = await addPriceInterval(subscriptionId, priceIdToAdd, effectiveStartDate);
      if (result.success) {
        toast.success(`${itemName} Added`, {
          description: `Successfully added ${itemName} starting ${effectiveStartDate}.`, // Include date in message 
          duration: 5000,
        });
        if (onSuccess) onSuccess(); 
        onOpenChange(false); 
      } else {
        throw new Error(result.error || `Failed to add ${itemName}.`);
      }
    } catch (error) {
      console.error(`Error adding ${itemName}:`, error);
      toast.error("Failed to Add Feature", { 
        description: error instanceof Error ? error.message : "An unknown error occurred",
        duration: 5000
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Construct API Preview Data --- 
  const apiEndpoint = `https://api.withorb.com/v1/subscriptions/${subscriptionId}/price_intervals`;
  const apiPayload = React.useMemo(() => {
      // Use selected date or today for preview
      const effectiveStartDate = startDate ? formatDateForInput(startDate) : todayFormatted;
      
      return {
        add: [
          {
            price_id: priceIdToAdd,
            start_date: effectiveStartDate,
          },
        ],
      } as Record<string, JsonValue>; 
  }, [priceIdToAdd, startDate, todayFormatted]); // Add dependencies

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={true}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add {itemName}</DialogTitle>
          <DialogDescription>
            Review the details and confirm to add this feature to your subscription.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4"> {/* Added space-y for spacing */}
          {/* Price Info Section */}
          <div> 
            {isLoadingPrice && <p>Loading price details...</p>}
            {errorLoadingPrice && <p className="text-red-600">Error: {errorLoadingPrice}</p>}
            {priceDetails && !isLoadingPrice && (
              <div className="text-sm space-y-2">
                <p>You are about to add:</p>
                <p className="font-semibold">{itemName}</p>
                <p><span className="text-muted-foreground">Pricing:</span> {displayPriceInfo(priceDetails)}</p>
              </div>
            )}
          </div>

          {/* Date Selection Section */}
          <div className="grid grid-cols-2 items-center gap-x-4"> 
             <Label htmlFor="start-date" className="font-medium text-muted-foreground text-sm self-center">
                Start Date
             </Label>
             <Input
                id="start-date"
                type="date"
                value={startDate ? formatDateForInput(startDate) : ""} // Display selected date or empty
                onChange={(e) => {
                  const selectedValue = e.target.value; // YYYY-MM-DD string
                  if (!selectedValue) {
                      setStartDate(null);
                      return;
                  }
                  try {
                    // Parse selected date as UTC
                    const [year, month, day] = selectedValue.split('-').map(Number);
                    const parsedDate = new Date(Date.UTC(year, month - 1, day));
                    // Basic validation: must be today or later
                    if (!isNaN(parsedDate.getTime()) && selectedValue >= todayFormatted) {
                        setStartDate(parsedDate);
                    } else {
                        setStartDate(null); // Invalid selection
                        toast.error("Invalid Date", { 
                          description: "Start date must be today or a future date.", 
                          duration: 3000 
                        });
                    }
                  } catch { 
                    setStartDate(null); // Parsing error
                  }
                }}
                min={todayFormatted} // Set min date to today
                className={cn(
                  "flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                  "text-sm"
                )}
                disabled={isSubmitting || isLoadingPrice}
              />
           </div>

           {/* Clarification Text */}
           <p className="text-xs text-muted-foreground pt-2">
              The feature will be added starting from the selected date (defaults to today) and billed based on usage.
           </p>
        </div>

        <DialogFooter className="flex flex-row justify-between items-center sm:justify-between">
          {/* API Preview Button */}
          <ApiPreviewDialog 
            endpoint={apiEndpoint}
            method="POST"
            payload={apiPayload}
            title={`Add ${itemName} Feature`}
            description={`Adds the ${itemName.toLowerCase()} price to the subscription.`}
            buttonVariant="outline"
            buttonText="Preview API Call"
            className="mr-auto" 
            disabled={isSubmitting || isLoadingPrice || !!errorLoadingPrice} // Disable if loading/error
          />
          {/* Add Feature Button */}
          <Button 
            type="button" 
            onClick={handleConfirm} 
            disabled={isSubmitting || isLoadingPrice || !!errorLoadingPrice || !priceDetails}
          >
            {isSubmitting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...</>
            ) : (
              "Add Feature"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 