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
import { Loader2, CheckCircle2 } from "lucide-react"
import { useCustomerStore } from "@/lib/store/customer-store"
import { useCreateSubscription } from "@/lib/query/orb-hooks"

export function PlanSelectionDialog() {
  const { 
    customer,
    isPlanSelectionOpen,
    closePlanSelection,
    pendingPlanId,
    setSubscription,
  } = useCustomerStore()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const createSubscription = useCreateSubscription()

  const handleSubscribe = async () => {
    if (!customer || !pendingPlanId) return

    setIsSubmitting(true)

    try {
      const result = await createSubscription.mutateAsync({
        customerId: customer.id,
        planId: pendingPlanId,
      })

      // Set subscription in store
      setSubscription({
        id: result.id,
        plan_id: pendingPlanId,
        status: result.status === 'upcoming' ? 'pending' : result.status,
      })

      // Show success toast
      toast.success("Successfully subscribed!", {
        description: `You're all set to start using our service.`,
        icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
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