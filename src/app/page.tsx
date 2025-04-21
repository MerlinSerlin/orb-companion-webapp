"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/ui/header"
import { PricingPlans } from "@/components/plans/pricing-plans"
import { CustomerRegistrationDialog } from "@/components/dialogs/customer-registration-dialog"
import { PlanSelectionDialog } from "@/components/dialogs/plan-selection-dialog"
import { useCustomerStore } from "@/lib/store/customer-store"

export default function Home() {
  const { customer, pendingPlanId, setPendingPlanId } = useCustomerStore()
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false)
  const [isPlanSelectionOpen, setIsPlanSelectionOpen] = useState(false)
  const [registrationWasSuccessful, setRegistrationWasSuccessful] = useState(false)

  // Effect to properly manage dialog opening states
  useEffect(() => {
    if (pendingPlanId && pendingPlanId !== "nimbus_scale_enterprise" && 
        (customer || registrationWasSuccessful)) {
      setIsRegistrationOpen(false);
      setIsPlanSelectionOpen(true);
    }
    // Note: Enterprise dialog opening is handled within PricingPlans component
  }, [customer, pendingPlanId, registrationWasSuccessful]);

  // Handle edge case where plan selection dialog is open but no plan is selected
  useEffect(() => {
    if (isPlanSelectionOpen && !pendingPlanId) {
      setIsPlanSelectionOpen(false);
    }
  }, [isPlanSelectionOpen, pendingPlanId]);

  // --- Dialog Control --- 

  const openRegistration = () => {
    setIsPlanSelectionOpen(false);
    setRegistrationWasSuccessful(false); // Reset flag when opening registration
    setIsRegistrationOpen(true)
  }
  
  const closeRegistration = () => {
    // Only clear the pending plan ID if registration was NOT successful
    if (pendingPlanId && !registrationWasSuccessful) {
      console.log('Registration closed/cancelled, clearing pending plan ID:', pendingPlanId);
      setPendingPlanId(null)
    }
    
    setIsRegistrationOpen(false)
    // Reset flag *after* check, ready for next open
    setRegistrationWasSuccessful(false); 
  }

  // Handler to be called on successful registration
  const handleRegistrationSuccess = () => {
    console.log('Registration successful, setting flag.');
    setRegistrationWasSuccessful(true);
  }

  // Create a function to force a specific plan ID when opening the plan selection dialog
  const forcePlanSelection = (planId: string | null) => {
    if (!planId) return;
    setPendingPlanId(planId);
    setIsRegistrationOpen(false);
    setIsPlanSelectionOpen(true);
  }
  
  // This function is triggered *after* registration was successful (for non-enterprise)
  // It now mainly just calls forcePlanSelection if needed
  const openPlanSelection = () => {
    // Flag is already set by handleRegistrationSuccess
    if (pendingPlanId && pendingPlanId !== "nimbus_scale_enterprise") {
      forcePlanSelection(pendingPlanId);
    }
    // If it *is* enterprise, do nothing here; PricingPlans effect handles it
  }

  const closePlanSelection = () => {
    setIsPlanSelectionOpen(false)
  }

  // Function to handle successful subscription (from PlanSelectionDialog)
  const handleSuccessfulSubscription = () => {
    // pendingPlanId is already cleared by addSubscription in the store
    closePlanSelection();
  }

  return (
    <>
      <Header />
      <main>
        <PricingPlans openRegistration={openRegistration} />
      </main>
      <CustomerRegistrationDialog 
        onOpenPlanSelection={openPlanSelection} // Still needed for non-enterprise flow
        onRegistrationSuccess={handleRegistrationSuccess} // Pass the success handler
        isOpen={isRegistrationOpen}
        onClose={closeRegistration}
      />
      <PlanSelectionDialog 
        isOpen={isPlanSelectionOpen}
        onClose={closePlanSelection}
        onSubscriptionSuccess={handleSuccessfulSubscription}
      />
    </>
  )
}







