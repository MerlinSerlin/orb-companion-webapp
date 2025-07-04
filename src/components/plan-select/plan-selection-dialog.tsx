"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { format, subDays } from "date-fns"
import { Button } from "@/components/ui/button"
import { useCustomerStore, type CustomerState } from "@/lib/store/customer-store"
import { createSubscription } from "@/app/actions/orb"
import { type OrbInstance, ORB_INSTANCES } from "@/lib/orb-config"
import { getCurrentCompanyConfig, type PlanUIDetail } from "@/lib/plans"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { ApiPreviewDialog } from "@/components/dialogs/api-preview-dialog"

interface PlanSelectionDialogProps {
  onPlanSelected?: () => void
  isOpen: boolean
  onClose: () => void
  onSubscriptionSuccess?: () => void
  instance?: OrbInstance
}

export function PlanSelectionDialog({ 
  onPlanSelected,
  isOpen,
  onClose,
  onSubscriptionSuccess,
  instance = 'cloud-infra'
}: PlanSelectionDialogProps) {
  const router = useRouter()
  
  // Get customer data directly from store (no validation needed)
  const customerId = useCustomerStore((state: CustomerState) => state.customerId)
  const pendingPlanId = useCustomerStore((state: CustomerState) => state.pendingPlanId)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<PlanUIDetail | null>(null)
  const [startDateString, setStartDateString] = useState<string>(format(new Date(), 'yyyy-MM-dd'))

  const minDateString = format(subDays(new Date(), 90), 'yyyy-MM-dd');

  // Get the appropriate plan data based on instance
  const instanceConfig = ORB_INSTANCES[instance];
  const companyConfig = getCurrentCompanyConfig(instanceConfig.companyKey);
  const planDetails = companyConfig.uiPlans;

  useEffect(() => {
    setSelectedPlan(pendingPlanId ? planDetails.find(plan => plan.plan_id === pendingPlanId) || null : null)
  }, [pendingPlanId, planDetails])

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!pendingPlanId || !customerId || !selectedPlan || !startDateString) return

    setIsSubmitting(true)

    try {
      const result = await createSubscription(customerId, pendingPlanId, startDateString, instance)
      
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
        if (customerId) {
          router.push(`/customers/${customerId}`)
        } else {
          console.warn("Customer ID not found in store after subscription, redirecting to homepage.")
          router.push("/")
        }
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
    customer_id: customerId || "cust_12345abcdef",
    plan_id: pendingPlanId || "plan_basic",
    start_date: startDateString || null,
  }

  const sampleResponse = {
    id: "sub_12345abcdef",
    customer_id: customerId || "cust_12345abcdef",
    plan_id: pendingPlanId || "plan_basic",
    status: "active",
    created_at: new Date().toISOString(),
    start_date: startDateString || new Date().toISOString().split('T')[0],
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
                    <div className="text-lg font-bold">
                      {selectedPlan.price}
                      {selectedPlan.billingInterval && (
                        <span className="text-sm text-muted-foreground">/{selectedPlan.billingInterval}</span>
                      )}
                    </div>
                  )}
                </div>
                
                <p className="text-muted-foreground">{selectedPlan.description}</p>
                
                <div className="grid gap-2 pt-4">
                  <Label htmlFor="start-date">Subscription Start Date</Label>
                  <input
                    id="start-date"
                    type="date"
                    value={startDateString}
                    onChange={(e) => setStartDateString(e.target.value)}
                    min={minDateString}
                    className="w-full"
                  />
                </div>
                
                <div className="pt-2">
                  <h4 className="text-sm font-medium mb-2">Plan Features:</h4>
                  <ul className="space-y-1 text-sm">
                    {selectedPlan.features.map((feature: { name: string; value: string }, index: number) => (
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
            <Button type="submit" disabled={isSubmitting || !pendingPlanId || !customerId || !selectedPlan || !startDateString}>
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