"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { PlanCard } from "./plan-card"
import { PLAN_DETAILS } from "./plan-data"
import { useCustomerStore } from "@/lib/store/customer-store"
import { Loader2 } from "lucide-react"
import { EnterpriseContactDialog } from "../dialogs/enterprise-contact-dialog"

interface PricingPlansProps {
  pendingPlanId?: string | null
  onPendingPlanIdChange?: (planId: string | null) => void
  openRegistration: (callback?: () => void) => void
}

export function PricingPlans({ 
  pendingPlanId: externalPendingPlanId, 
  onPendingPlanIdChange,
  openRegistration 
}: PricingPlansProps) {
  const { 
    customer,
    setSubscription 
  } = useCustomerStore()

  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [isSubscribing, setIsSubscribing] = useState(false)
  const [isEnterpriseDialogOpen, setIsEnterpriseDialogOpen] = useState(false)
  const [internalPendingPlanId, setInternalPendingPlanId] = useState<string | null>(null)
  
  // Use either external or internal pendingPlanId
  const pendingPlanId = externalPendingPlanId !== undefined ? externalPendingPlanId : internalPendingPlanId
  
  // Function to set pendingPlanId that updates either external or internal state
  const setPendingPlanId = (planId: string | null) => {
    if (onPendingPlanIdChange) {
      onPendingPlanIdChange(planId)
    } else {
      setInternalPendingPlanId(planId)
    }
  }

  // Check if we need to show enterprise dialog after login
  useEffect(() => {
    if (customer && pendingPlanId === "plan_enterprise") {
      // Show the enterprise dialog with a small delay to allow any other dialogs to close first
      setTimeout(() => {
        setIsEnterpriseDialogOpen(true)
      }, 500);
    }
  }, [customer, pendingPlanId])

  const subscribeToPlan = async (planId: string) => {
    if (!customer) return;
    
    setSelectedPlan(planId)
    setIsSubscribing(true)

    try {
      const plan = PLAN_DETAILS.find((p) => p.id === planId)
      
      // Create a new subscription for the customer
      const newSubscription = {
        id: `sub_${Math.random().toString(36).substr(2, 9)}`, // Mock ID for now
        plan_id: planId,
        status: 'active' as const,
      }
      
      // Update the customer's subscription in the store
      setSubscription(newSubscription)
      
      toast.success(`Subscribed to ${plan?.name} Plan!`, {
        description: `Thank you, ${customer.name}! Your subscription has been activated successfully.`,
        duration: 5000,
      })
    } catch (error) {
      toast.error("Subscription Error", {
        description: error instanceof Error ? error.message : "An unknown error occurred",
        duration: 5000,
      })
    } finally {
      setIsSubscribing(false)
      setSelectedPlan(null)
    }
  }

  // Simple function to handle all plan selections
  const handlePlanSelection = (planId: string) => {
    // If user is not logged in, store plan and redirect to registration
    if (!customer) {
      setPendingPlanId(planId)
      openRegistration()
      return
    }
    
    // User is logged in, handle the plan action
    if (planId === "plan_enterprise") {
      setIsEnterpriseDialogOpen(true)
    } else {
      subscribeToPlan(planId)
    }
  }

  // Check if customer is already subscribed to this plan
  const isSubscribedToPlan = (planId: string) => {
    return customer?.subscription?.plan_id === planId &&
           customer?.subscription?.status === 'active';
  }

  return (
    <section className="container mx-auto py-8">
      <div className="relative">
        {/* Decorative elements */}
        <div className="absolute -z-10 top-1/2 left-1/4 h-[200px] w-[200px] rounded-full bg-primary/10 blur-[100px]"></div>
        <div className="absolute -z-10 top-1/3 right-1/4 h-[300px] w-[300px] rounded-full bg-primary/10 blur-[100px]"></div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto relative">
          {PLAN_DETAILS.map((plan) => {
            const isCurrentPlan = isSubscribedToPlan(plan.id);
            
            return (
              <PlanCard
                key={plan.id}
                name={plan.name}
                description={plan.description}
                price={plan.price}
                features={plan.features}
                cta={
                  isSubscribing && selectedPlan === plan.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : isCurrentPlan ? (
                    "Current Plan"
                  ) : (
                    plan.cta
                  )
                }
                popular={plan.popular}
                onSelect={() => handlePlanSelection(plan.id)}
                disabled={isSubscribing || isCurrentPlan}
                isCurrentPlan={isCurrentPlan}
              />
            );
          })}
        </div>
      </div>

      <div className="mt-8 text-center">
        <div className="inline-flex items-center justify-center gap-2 rounded-full border bg-background px-4 py-1.5 text-sm text-muted-foreground">
          <span>Need a custom plan?</span>
          <button 
            onClick={() => handlePlanSelection("plan_enterprise")}
            className="text-primary font-medium hover:underline"
          >
            Contact our sales team →
          </button>
        </div>
      </div>

      <EnterpriseContactDialog 
        open={isEnterpriseDialogOpen} 
        onOpenChange={setIsEnterpriseDialogOpen} 
      />
    </section>
  )
}













