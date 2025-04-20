"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/ui/header"
import { PricingPlans } from "@/components/plans/pricing-plans"
import { CustomerRegistrationDialog } from "@/components/dialogs/customer-registration-dialog"
import { PlanSelectionDialog } from "@/components/dialogs/plan-selection-dialog"
import { useCustomerStore } from "@/lib/store/customer-store"

export default function Home() {
  const { customer } = useCustomerStore()
  const [pendingPlanId, setPendingPlanId] = useState<string | null>(null)
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false)
  const [isPlanSelectionOpen, setIsPlanSelectionOpen] = useState(false)
  const [registrationSuccessCallback, setRegistrationSuccessCallback] = useState<(() => void) | null>(null)

  // Effect to properly manage dialog opening states
  useEffect(() => {
    // If customer exists and we have a pendingPlanId that's not enterprise,
    // open the plan selection dialog (and ensure registration is closed)
    if (customer && pendingPlanId && pendingPlanId !== "plan_enterprise") {
      setIsRegistrationOpen(false);
      setIsPlanSelectionOpen(true);
    }
  }, [customer, pendingPlanId]);

  // Dialog control functions
  const openRegistration = (callback?: () => void) => {
    // Close any other open dialogs
    setIsPlanSelectionOpen(false);
    
    // Open registration
    setIsRegistrationOpen(true)
    if (callback) setRegistrationSuccessCallback(callback)
  }
  
  const closeRegistration = () => {
    setIsRegistrationOpen(false)
    setRegistrationSuccessCallback(null)
  }

  const openPlanSelection = () => {
    // Only open if not an enterprise plan
    if (pendingPlanId !== "plan_enterprise") {
      // Close any other open dialogs
      setIsRegistrationOpen(false);
      setIsPlanSelectionOpen(true);
    }
  }

  const closePlanSelection = () => {
    setIsPlanSelectionOpen(false)
  }

  return (
    <>
      <Header />
      <main>
        <PricingPlans 
          pendingPlanId={pendingPlanId}
          onPendingPlanIdChange={setPendingPlanId}
          openRegistration={openRegistration}
        />
      </main>
      <CustomerRegistrationDialog 
        pendingPlanId={pendingPlanId} 
        onOpenPlanSelection={openPlanSelection} 
        isOpen={isRegistrationOpen}
        onClose={closeRegistration}
        registrationSuccessCallback={registrationSuccessCallback}
      />
      <PlanSelectionDialog 
        pendingPlanId={pendingPlanId}
        isOpen={isPlanSelectionOpen}
        onClose={closePlanSelection}
      />
    </>
  )
}







