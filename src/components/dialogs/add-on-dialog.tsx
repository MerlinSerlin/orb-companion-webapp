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
import { Calendar } from "@/components/ui/calendar"; // Add Calendar
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"; // Add Popover components
import { cn } from "@/lib/utils"; // Add cn utility
import { format } from "date-fns"; // Add date-fns format
import { Calendar as CalendarIcon } from "lucide-react"; // Add CalendarIcon

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
  const [effectiveDate, setEffectiveDate] = React.useState<Date | undefined>(new Date());
  
  const handleConfirm = () => {
    if (onConfirm && effectiveDate) { // Ensure date is selected
      onConfirm({ quantityToAdd, effectiveDate }); // Pass the quantity *to add* and the selected date
    }
    onOpenChange(false); // Close the dialog
  };

  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      setQuantityToAdd(1); // Reset to adding 1
      setEffectiveDate(new Date()); // Reset date to today
    }
  }, [open]);

  // Calculate total price for the add-on quantity
  const totalPrice = addOnPrice * quantityToAdd;

  // Format price helper (simple example)
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
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
            onChange={(e) => setQuantityToAdd(parseInt(e.target.value, 10) || 1)} 
            min="1" 
            className="h-8"
          />

          <div className="font-medium text-muted-foreground">Total Add-on Cost</div>
          <div className="text-right font-semibold">{formatCurrency(totalPrice)}</div>

          {/* Effective Date Picker */} 
          <Label htmlFor="effective-date" className="font-medium text-muted-foreground self-center">
            Effective Date
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="effective-date"
                variant={"outline"}
                className={cn(
                  "h-8 justify-start text-left font-normal", // Match input height
                  !effectiveDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {effectiveDate ? format(effectiveDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start"> 
              <Calendar
                mode="single"
                selected={effectiveDate}
                onSelect={setEffectiveDate}
                disabled={(date: Date) => date < new Date(new Date().setDate(new Date().getDate() - 1))} 
              />
            </PopoverContent>
          </Popover>
        </div>
        <DialogFooter>
          <Button 
            type="button" 
            onClick={handleConfirm} 
            // Disable confirm if date is not selected
            disabled={quantityToAdd <= 0 || !effectiveDate} 
          >
            Confirm Change
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 