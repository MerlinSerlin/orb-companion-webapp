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
// import { Calendar } from "@/components/ui/calendar"; // Add Calendar
import {
  // Popover,
  // PopoverContent,
  // PopoverTrigger,
} from "@/components/ui/popover"; // Add Popover components
import { cn } from "@/lib/utils"; // Add cn utility
import { format, parse } from "date-fns"; // Add date-fns format
// import { Calendar as CalendarIcon } from "lucide-react"; // Add CalendarIcon

interface AddOnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Add other props as needed, e.g., current quantity, item name, onConfirm callback
  itemName?: string; 
  currentQuantity?: number;
  addOnPrice: number; // Add prop for price per add-on unit
  // Remove effectiveDate string prop, date will be selected
  // effectiveDate: string; 
  // Update onConfirm signature to include the selected date
  onConfirm?: (details: { quantityToAdd: number; effectiveDate: Date }) => void; 
}

export function AddOnDialog({ 
  open, 
  onOpenChange, 
  itemName = "Add-on", // Default item name
  currentQuantity = 0, 
  addOnPrice, // Accept addOnPrice
  // Remove effectiveDate string prop, date will be selected
  // effectiveDate: string; 
  onConfirm 
}: AddOnDialogProps) {
  
  // State for the *number of units to add*
  const [quantityToAdd, setQuantityToAdd] = React.useState<number>(1);
  // State for the effective date
  const [effectiveDate, setEffectiveDate] = React.useState<Date>(new Date()); // Default to today
  
  const handleConfirm = () => {
    if (onConfirm && effectiveDate) {
      onConfirm({ quantityToAdd, effectiveDate });
    }
    onOpenChange(false);
  };

  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      setQuantityToAdd(1);
      setEffectiveDate(new Date());
    }
  }, [open]);

  // Calculate total price for the add-on quantity
  const totalPrice = addOnPrice * quantityToAdd;

  // Format price helper (simple example)
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  // Helper to format date to YYYY-MM-DD for input value/min
  const formatDateForInput = (date: Date): string => {
    return format(date, 'yyyy-MM-dd');
  };
  
  // Get today's date in YYYY-MM-DD format for the min attribute
  const todayStr = formatDateForInput(new Date());

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={true}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add {itemName}</DialogTitle>
          <DialogDescription>
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 py-4 text-sm"> 
          <div className="font-medium text-muted-foreground">Current Quantity</div>
          <div className="text-right font-medium">{currentQuantity}</div>

          <div className="font-medium text-muted-foreground">Price per Add-on</div>
          <div className="text-right font-medium">{formatCurrency(addOnPrice)}</div>

          <Label htmlFor="quantity-to-add" className="font-medium text-muted-foreground self-center">
            Quantity to Add
          </Label>
          <Input
            id="quantity-to-add"
            type="number"
            value={quantityToAdd}
            onChange={(e) => setQuantityToAdd(Math.max(1, parseInt(e.target.value, 10) || 1))} 
            min="1" 
            className="h-8 text-center"
          />

          <div className="font-medium text-muted-foreground">Total Add-on Cost</div>
          <div className="text-right font-semibold">{formatCurrency(totalPrice)}</div>

          <div className="font-medium text-muted-foreground">New Total Quantity</div>
          <div className="text-right font-semibold">{currentQuantity + quantityToAdd}</div>

          <Label htmlFor="effective-date" className="font-medium text-muted-foreground self-center">
            Effective Date
          </Label>
          <Input
            id="effective-date"
            type="date"
            value={effectiveDate ? formatDateForInput(effectiveDate) : ""}
            onChange={(e) => {
              // Parse the YYYY-MM-DD string safely
              try {
                const parsedDate = parse(e.target.value, 'yyyy-MM-dd', new Date());
                 // Check if the date is valid and not in the past (relative to today's date part only)
                if (!isNaN(parsedDate.getTime()) && formatDateForInput(parsedDate) >= todayStr) {
                    setEffectiveDate(parsedDate);
                } else if (e.target.value === "") {
                    // Allow clearing the date maybe? Or reset to today? Let's reset.
                    setEffectiveDate(new Date()); 
                }
              } catch { // Removed the unused error variable binding
                 // Handle potential parsing errors if needed, maybe reset to today
                 setEffectiveDate(new Date());
              }
            }}
            min={todayStr} // Prevent selecting past dates
            className={cn(
              // Standard input styles from shadcn/ui, added justify-end (removed cursor-pointer)
              "flex justify-end h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
              // Keep existing text-sm class
              "text-sm" 
            )}
          />
        </div>
        <DialogFooter>
          <Button 
            type="button" 
            onClick={handleConfirm} 
            disabled={quantityToAdd <= 0 || !effectiveDate} 
          >
            Confirm Change
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 