"use client"

import { PlanCard } from "./plan-card"
import { PLAN_DETAILS } from "./plan-data"
import { useCustomerStore, type CustomerState } from "@/lib/store/customer-store"

export function PricingPlans() {
  // Update hook and type usage
  const setPendingPlanId = useCustomerStore((state: CustomerState) => state.setPendingPlanId);

  const handlePlanSelection = (planId: string) => {
    if (!planId) return;
    setPendingPlanId(planId); 
    // Logic to open dialogs is handled by parent (Home)
  }

  return (
    <section className="container mx-auto py-8">
      <div className="relative">
        {/* Decorative elements */}
        <div className="absolute -z-10 top-1/2 left-1/4 h-[200px] w-[200px] rounded-full bg-primary/10 blur-[100px]"></div>
        <div className="absolute -z-10 top-1/3 right-1/4 h-[300px] w-[300px] rounded-full bg-primary/10 blur-[100px]"></div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto relative">
          {PLAN_DETAILS.map((plan) => {
            const isCurrentPlan = false;
            
            return (
              <PlanCard
                key={plan.plan_id}
                name={plan.name}
                description={plan.description}
                price={plan.price}
                features={plan.features}
                cta={isCurrentPlan ? "Current Plan" : plan.cta}
                popular={plan.popular}
                onSelect={() => handlePlanSelection(plan.plan_id)}
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
            onClick={() => handlePlanSelection("nimbus_scale_enterprise")}
            className="text-primary font-medium hover:underline"
          >
            Contact our sales team →
          </button>
        </div>
      </div>
    </section>
  )
}













