"use client"

import { useState, useEffect } from "react"
import { PlanCard } from "./plan-card"
import { PLAN_DETAILS } from "./plan-data"
import { useCustomerStore } from "@/lib/store/customer-store"
import { EnterpriseContactDialog } from "../dialogs/enterprise-contact-dialog"

interface PricingPlansProps {
  openRegistration: (callback?: () => void) => void
}

export function PricingPlans({ 
  openRegistration 
}: PricingPlansProps) {
  const { 
    customer,
    pendingPlanId,
    setPendingPlanId
  } = useCustomerStore()

  const [isEnterpriseDialogOpen, setIsEnterpriseDialogOpen] = useState(false)
  
  // Check if we need to show enterprise dialog after login
  useEffect(() => {
    if (customer && pendingPlanId === "plan_enterprise") {
      // Show the enterprise dialog with a small delay to allow any other dialogs to close first
      setTimeout(() => {
        setIsEnterpriseDialogOpen(true)
      }, 500);
    }
  }, [customer, pendingPlanId])

  // Handle enterprise dialog state changes
  const handleEnterpriseDialogChange = (isOpen: boolean) => {
    setIsEnterpriseDialogOpen(isOpen);
    
    // When dialog closes, clear the enterprise plan from pendingPlanId
    if (!isOpen && pendingPlanId === "plan_enterprise") {
      // Reset pendingPlanId to prevent dialog from reopening
      setPendingPlanId(null);
    }
  }

  // Function to handle when a user selects a plan
  const handlePlanSelection = (planId: string) => {
    // Validate planId (basic check only)
    if (!planId) {
      return;
    }
    
    // Update the store with the selected plan ID
    setPendingPlanId(planId);

    if (!customer) {
      // If user is not logged in, redirect to registration
      openRegistration();
    } else if (planId === "plan_enterprise") {
      // For enterprise plan, show the enterprise dialog
      setIsEnterpriseDialogOpen(true);
    }
    // No else needed - parent component will handle opening plan selection dialog
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
                cta={isCurrentPlan ? "Current Plan" : plan.cta}
                popular={plan.popular}
                onSelect={() => handlePlanSelection(plan.id)}
                disabled={isCurrentPlan}
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
        onOpenChange={handleEnterpriseDialogChange} 
      />
    </section>
  )
}













