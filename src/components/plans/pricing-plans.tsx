"use client"

import { useState } from "react"
import { PlanCard } from "./plan-card"
import { PLAN_DETAILS, getCurrentCompanyConfig } from "./plan-data"
import { useCustomerStore, type CustomerState } from "@/lib/store/customer-store"
import { ORB_INSTANCES, type OrbInstance } from "@/lib/orb-config"
import { PlanSelectionDialog } from "@/components/homepage/plan-selection-dialog"
import { CustomerRegistrationDialog } from "@/components/homepage/customer-registration-dialog"

interface PricingPlansProps {
  instance: OrbInstance; // Now required
}

export function PricingPlans({ instance }: PricingPlansProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false)
  
  // Update hook and type usage
  const setPendingPlanId = useCustomerStore((state: CustomerState) => state.setPendingPlanId);
  
  // Get customer data directly from store
  const customerId = useCustomerStore((state: CustomerState) => state.customerId);

  // Get the appropriate plan data based on instance
  const getPlanData = () => {
    if (instance && instance in ORB_INSTANCES) {
      // Use the companyKey from the instance configuration
      const instanceConfig = ORB_INSTANCES[instance as keyof typeof ORB_INSTANCES];
      return getCurrentCompanyConfig(instanceConfig.companyKey).uiPlans;
    }
    
    // Fallback to default behavior
    return PLAN_DETAILS;
  };

  const planData = getPlanData();

  const handlePlanSelection = (planId: string) => {
    console.log(`[Plans] Plan selected: ${planId}, Customer ID: ${customerId}, Instance: ${instance}`);
    
    if (!planId) return;
    
    // Check if customer exists before allowing subscription
    if (!customerId) {
      console.log(`[Plans] No customer ID, showing registration dialog`);
      // Store the plan they want to subscribe to
      setPendingPlanId(planId)
      // Show registration dialog first
      setIsRegistrationOpen(true)
      return
    }

    console.log(`[Plans] Customer exists, proceeding with subscription dialog`);
    // Customer exists, proceed with subscription
    setPendingPlanId(planId);
    setIsDialogOpen(true);
  }

  const handleRegistrationSuccess = () => {
    // After successful registration, open the subscription dialog
    setIsRegistrationOpen(false)
    setIsDialogOpen(true)
  }

  return (
    <section className="container mx-auto py-12">
      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {planData.map((plan) => {
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

      {/* Customer Registration Dialog */}
      <CustomerRegistrationDialog
        isOpen={isRegistrationOpen}
        onClose={() => setIsRegistrationOpen(false)}
        onRegistrationSuccess={() => handleRegistrationSuccess()}
        instance={instance}
      />

      {/* Plan Subscription Dialog */}
      <PlanSelectionDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        instance={instance}
      />
    </section>
  )
}













