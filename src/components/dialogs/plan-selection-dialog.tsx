"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCustomerStore } from "@/lib/store/customer-store"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function PlanSelectionDialog() {
  const { 
    isPlanSelectionOpen,
    closePlanSelection,
    pendingPlanId,
  } = useCustomerStore()

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    
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
          <DialogDescription>You're about to subscribe to our service. Review the details below.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubscribe}>
          <div className="grid gap-4 py-4">
            <div className="py-2">
              <p className="text-sm text-gray-500">
                Selected Plan ID: <code className="text-sm">{pendingPlanId}</code>
              </p>
              {/* We can add more plan details here once we have them */}
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting || !pendingPlanId}>
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
        </form>
      </DialogContent>
    </Dialog>
  )
} 