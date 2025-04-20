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
import { ApiPreviewDialog } from "@/components/dialogs/api-preview-dialog"

export function PlanSelectionDialog() {
  const { 
    isPlanSelectionOpen,
    closePlanSelection,
    pendingPlanId,
    customer
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

  // Prepare API schema data based on Orb API for creating a subscription
  const apiRequestBody = {
    customer_id: customer?.id || "cust_12345abcdef",
    plan_id: pendingPlanId || "plan_basic",
    auto_collection: true,
    net_terms: 0,
    // Optional fields:
    // billing_cycle_day: 1,
    // coupon_redemption_code: "DISCOUNT50",
    // default_invoice_memo: "Thanks for subscribing!",
    // invoicing_threshold: 0,
    // metadata: { "signup_source": "website" },
    // minimum_commitment: { amount: "1000", currency: "USD" },
    // price_overrides: [],
  }

  const sampleResponse = {
    id: "sub_12345abcdef",
    customer_id: customer?.id || "cust_12345abcdef",
    plan_id: pendingPlanId || "plan_basic",
    status: "active",
    created_at: new Date().toISOString(),
    start_date: new Date().toISOString(),
    auto_collection: true,
    net_terms: 0
  }

  return (
    <Dialog open={isPlanSelectionOpen} onOpenChange={(open) => !open && closePlanSelection()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Subscribe to Plan</DialogTitle>
          <DialogDescription>You&apos;re about to subscribe to our service. Review the details below.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubscribe}>
          <div className="grid gap-4 py-4">
            <div className="py-2">
              <div className="text-sm text-gray-500">
                Selected Plan ID: <code className="text-sm">{pendingPlanId}</code>
              </div>
              {/* We can add more plan details here once we have them */}
            </div>

            <div className="flex items-center justify-between mt-2">
              <ApiPreviewDialog
                payload={apiRequestBody}
                response={sampleResponse}
                endpoint="https://api.withorb.com/v1/subscriptions"
                method="POST"
                title="Create Subscription"
                description="This API call will create a new subscription in Orb for the selected plan."
                buttonText="Preview API Call"
              />
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