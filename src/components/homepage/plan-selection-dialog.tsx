"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCustomerStore, type CustomerState } from "@/lib/store/customer-store"
import { createSubscription } from "@/app/actions"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ApiPreviewDialog } from "@/components/dialogs/api-preview-dialog"
import { PLAN_DETAILS } from "../plans/plan-data"

interface PlanSelectionDialogProps {
  onPlanSelected?: () => void
  isOpen: boolean
  onClose: () => void
  onSubscriptionSuccess?: () => void
}

export function PlanSelectionDialog({ 
  onPlanSelected,
  isOpen,
  onClose,
  onSubscriptionSuccess
}: PlanSelectionDialogProps) {
  const router = useRouter()
  const storeCustomerId = useCustomerStore((state: CustomerState) => state.customerId)
  const pendingPlanId = useCustomerStore((state: CustomerState) => state.pendingPlanId)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<typeof PLAN_DETAILS[0] | null>(null)

  useEffect(() => {
    setSelectedPlan(pendingPlanId ? PLAN_DETAILS.find(plan => plan.plan_id === pendingPlanId) || null : null)
  }, [pendingPlanId])

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!pendingPlanId || !storeCustomerId || !selectedPlan) return

    setIsSubmitting(true)

    try {
      const result = await createSubscription(storeCustomerId, pendingPlanId)
      
      if (!result.success || !result.subscription) {
        throw new Error(result.error || "Failed to create subscription")
      }
      
      toast.success("Successfully subscribed!", {
        description: `You're all set to start using our service with the ${selectedPlan.name} plan.`,
        duration: 5000,
      })

      if (onPlanSelected) {
        onPlanSelected()
      }
      
      if (onSubscriptionSuccess) {
        onSubscriptionSuccess()
      }

      onClose()
      
      setTimeout(() => {
        router.push(`/customer/${storeCustomerId}`)
      }, 500)
    } catch (error) {
      toast.error("Error creating subscription", {
        description: error instanceof Error ? error.message : "An unknown error occurred",
        duration: 5000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const apiRequestBody = {
    customer_id: storeCustomerId || "cust_12345abcdef",
    plan_id: pendingPlanId || "plan_basic",
  }

  const sampleResponse = {
    id: "sub_12345abcdef",
    customer_id: storeCustomerId || "cust_12345abcdef",
    plan_id: pendingPlanId || "plan_basic",
    status: "active",
    created_at: new Date().toISOString(),
    start_date: new Date().toISOString(),
    auto_collection: true,
    net_terms: 0
  }

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open) {
          onClose()
        }
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Subscribe to Plan</DialogTitle>
          <DialogDescription>You&apos;re about to subscribe to our service. Review the details below.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubscribe}>
          <div className="grid gap-4 py-4">
            {selectedPlan ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{selectedPlan.name}</h3>
                  {selectedPlan.price && (
                    <div className="text-lg font-bold">{selectedPlan.price}<span className="text-sm text-muted-foreground">/month</span></div>
                  )}
                </div>
                
                <p className="text-muted-foreground">{selectedPlan.description}</p>
                
                <div className="pt-2">
                  <h4 className="text-sm font-medium mb-2">Plan Features:</h4>
                  <ul className="space-y-1 text-sm">
                    {selectedPlan.features.map((feature, index) => (
                      <li key={index} className="flex items-center justify-between">
                        <span>{feature.name}:</span>
                        <span className="font-medium">{feature.value}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                No plan selected. Please select a plan first.
              </div>
            )}

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
            <Button type="submit" disabled={isSubmitting || !pendingPlanId || !storeCustomerId || !selectedPlan}>
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