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
import { EnterpriseContactDialog as AliasedEnterpriseContactDialog } from "@/components/dialogs/enterprise-contact-dialog"

interface PricingPlansProps {
  instance: OrbInstance 
}

export function PricingPlans({ instance }: PricingPlansProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false)
  const [isContactSalesInfoOpen, setIsContactSalesInfoOpen] = useState(false)
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
    // window.open('mailto:sales@orb.com?subject=Enterprise Plan Inquiry', '_blank'); // Old behavior
    setIsContactSalesInfoOpen(true); // New behavior: open info dialog
  }

  return (
    <div className="py-24 bg-gray-50 min-h-screen">
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
              onSubscribe={() => handlePlanSelect(plan.plan_id)}
              onContactSales={handleContactSales} // Pass the general contact sales handler
              cta={plan.cta} // Pass the cta from the plan object
            />
          ))}
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

      <AliasedEnterpriseContactDialog
        isOpen={isContactSalesInfoOpen}
        onClose={() => setIsContactSalesInfoOpen(false)}
        title="Inquiry Received"
        description="Thank you for your interest! A sales representative will be in touch with you soon."
        buttonText="Got it!"
      />
    </div>
  )
} 