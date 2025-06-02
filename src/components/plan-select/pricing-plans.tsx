"use client"

import { useState } from "react"
// Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Badge are no longer directly used here
// import { Button } from "@/components/ui/button"
// import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
// import { Badge } from "@/components/ui/badge"
// import { Check } from "lucide-react"
import { getCurrentCompanyConfig } from "@/lib/plans"
import { useCustomerStore } from "@/lib/store/customer-store"
import { ORB_INSTANCES, type OrbInstance } from "@/lib/orb-config"
import { PlanSelectionDialog } from "./plan-selection-dialog"
import { CustomerRegistrationDialog } from "./customer-registration-dialog"
import { PlanCard } from "./plan-card"

interface PricingPlansProps {
  instance: OrbInstance 
}

export function PricingPlans({ instance }: PricingPlansProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false)
  const setPendingPlanId = useCustomerStore((state) => state.setPendingPlanId)
  const customerId = useCustomerStore((state) => state.customerId)

  const instanceConfig = ORB_INSTANCES[instance];
  const companyConfig = getCurrentCompanyConfig(instanceConfig.companyKey);
  const plans = companyConfig.uiPlans;

  const handlePlanSelect = (planId: string) => {
    // console.log(`[Pricing Plans] Plan selected: ${planId}, Customer ID: ${customerId}, Instance: ${instance}`);
    if (!customerId) {
      // console.log(`[Pricing Plans] No customer ID, showing registration dialog`);
      setPendingPlanId(planId)
      setIsRegistrationOpen(true)
      return
    }
    // console.log(`[Pricing Plans] Customer exists, proceeding with subscription dialog`);
    setPendingPlanId(planId)
    setIsDialogOpen(true)
  }

  const handleRegistrationSuccess = () => {
    setIsRegistrationOpen(false)
    setIsDialogOpen(true)
  }

  const handleContactSales = () => {
    // For enterprise plans, directly open mailto or a contact form/modal
    // This specific action is now handled by the PlanCard based on plan_id, 
    // but if a general contact sales button is needed elsewhere, this function can be used.
    window.open('mailto:sales@orb.com?subject=Enterprise Plan Inquiry', '_blank')
  }

  return (
    <div className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Choose Your Plan
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Select the perfect plan for your needs
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Replace inlined card with PlanCard component */} 
          {plans.map((plan) => (
            <PlanCard
              key={plan.plan_id}
              plan_id={plan.plan_id}
              name={plan.name}
              description={plan.description}
              price={plan.price}
              billingInterval={plan.billingInterval}
              features={plan.features}
              popular={plan.popular}
              onSubscribe={() => handlePlanSelect(plan.plan_id)}
              onContactSales={handleContactSales} // Pass the general contact sales handler
            />
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600">
            Need a custom plan?{" "}
            <button 
              onClick={handleContactSales} // Re-use handleContactSales for this button too
              className="text-blue-600 hover:text-blue-500 font-medium"
            >
              Contact our sales team →
            </button>
          </p>
        </div>
      </div>

      <CustomerRegistrationDialog
        isOpen={isRegistrationOpen}
        onClose={() => setIsRegistrationOpen(false)}
        onRegistrationSuccess={handleRegistrationSuccess}
        instance={instance}
      />

      <PlanSelectionDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        instance={instance}
      />
    </div>
  )
} 