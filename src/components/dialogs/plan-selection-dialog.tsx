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

interface PlanSelectionDialogProps {
  pendingPlanId: string | null
  onPlanSelected?: () => void
  isOpen: boolean
  onClose: () => void
}

export function PlanSelectionDialog({ 
  pendingPlanId, 
  onPlanSelected,
  isOpen,
  onClose
}: PlanSelectionDialogProps) {
  const { 
    customer,
    setSubscription
  } = useCustomerStore()

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!pendingPlanId || !customer) return

    setIsSubmitting(true)

    try {
      // Create a new subscription object
      const newSubscription = {
        id: `sub_${Math.random().toString(36).substr(2, 9)}`, // Mock ID for now
        plan_id: pendingPlanId,
        status: 'active' as const,
      }
      
      // Update the customer's subscription in the store
      setSubscription(newSubscription)

      // TODO: Implement actual subscription creation with Orb API when ready
      
      toast.success("Successfully subscribed!", {
        description: `You're all set to start using our service with the ${pendingPlanId.replace('plan_', '').toUpperCase()} plan.`,
        duration: 5000,
      })

      // Call the callback if provided
      if (onPlanSelected) {
        onPlanSelected()
      }

      // Close the dialog
      onClose()
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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
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
            <Button type="submit" disabled={isSubmitting || !pendingPlanId || !customer}>
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