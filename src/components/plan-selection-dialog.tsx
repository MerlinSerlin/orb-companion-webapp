"use client"

import { useState } from "react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useCustomerStore } from "@/lib/store/customer-store"

export function PlanSelectionDialog() {
  const { 
    isPlanSelectionOpen,
    closePlanSelection,
    pendingPlanId,
  } = useCustomerStore()

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubscribe = async () => {
    if (!pendingPlanId) return

    setIsSubmitting(true)

    try {
      // TODO: Implement subscription logic when ready
      toast.success("Successfully subscribed!", {
        description: `You're all set to start using our service.`,
        duration: 5000,
      })

      // Close the dialog
      closePlanSelection()
    } catch (error) {
      toast.error("Error creating subscription", {
        description: error instanceof Error ? error.message : "An unknown error occurred",
        duration: 5000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isPlanSelectionOpen} onOpenChange={(open) => !open && closePlanSelection()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Subscribe to Plan</DialogTitle>
          <DialogDescription>
            You&apos;re about to subscribe to our service. Review the details below.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-gray-500">
            Selected Plan ID: <code className="text-sm">{pendingPlanId}</code>
          </p>
          {/* We can add more plan details here once we have them */}
        </div>
        <DialogFooter>
          <Button onClick={handleSubscribe} disabled={isSubmitting || !pendingPlanId}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Subscribing...
              </>
            ) : (
              "Subscribe Now"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 