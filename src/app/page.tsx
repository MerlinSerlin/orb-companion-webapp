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
  const [registrationWasSuccessful, setRegistrationWasSuccessful] = useState(false)

  // Effect to properly manage dialog opening states
  useEffect(() => {
    // If we have a pendingPlanId that's not enterprise, and either:
    // 1. The user is logged in, OR
    // 2. The registration was just successful (user just registered)
    // Then open the plan selection dialog
    if (pendingPlanId && pendingPlanId !== "plan_enterprise" && 
        (customer || registrationWasSuccessful)) {
      setIsRegistrationOpen(false);
      setIsPlanSelectionOpen(true);
    }
  }, [customer, pendingPlanId, registrationWasSuccessful]);

  // We need to debug pendingPlanId problems
  useEffect(() => {
    if (isPlanSelectionOpen && !pendingPlanId) {
      // Immediately close the dialog since we don't have a valid plan
      setIsPlanSelectionOpen(false);
    }
  }, [isPlanSelectionOpen, pendingPlanId]);

  // Dialog control functions
  const openRegistration = (callback?: () => void) => {
    // Close any other open dialogs
    setIsPlanSelectionOpen(false);
    
    // Open registration
    setIsRegistrationOpen(true)
    if (callback) setRegistrationSuccessCallback(callback)
  }
  
  const closeRegistration = () => {
    // Only clear the pending plan ID when registration is cancelled by the user,
    // NOT when it's closed after successful registration (which uses onClose directly)
    // We'll set a flag in openPlanSelection to handle the transition properly
    if (pendingPlanId && !registrationWasSuccessful) {
      setPendingPlanId(null)
    }
    
    setRegistrationWasSuccessful(false); // Reset for next time
    setIsRegistrationOpen(false)
    setRegistrationSuccessCallback(null)
  }

  // Create a function to force a specific plan ID when opening the plan selection dialog
  const forcePlanSelection = (planId: string | null) => {
    // Make sure we have a valid plan ID
    if (!planId) {
      return;
    }
    
    // Set the pending plan ID
    setPendingPlanId(planId);
    
    // Close the registration dialog if it's open
    setIsRegistrationOpen(false);
    
    // Open the dialog immediately - no need for setTimeout
    setIsPlanSelectionOpen(true);
  }
  
  const openPlanSelection = () => {
    // Mark registration as successful to prevent clearing pendingPlanId
    setRegistrationWasSuccessful(true);
    
    // Only open if we have a valid plan ID and it's not the enterprise plan
    if (pendingPlanId && pendingPlanId !== "plan_enterprise") {
      // Force the plan selection with the current pendingPlanId
      forcePlanSelection(pendingPlanId);
    }
  }

  const closePlanSelection = () => {
    // Don't clear the pending plan ID when plan selection is closed manually
    // We only clear it when a subscription is completed, which is handled elsewhere
    setIsPlanSelectionOpen(false)
  }

  // Function to handle successful subscription 
  const handleSuccessfulSubscription = () => {
    setPendingPlanId(null);
    closePlanSelection();
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
        onSubscriptionSuccess={handleSuccessfulSubscription}
      />
    </>
  )
}







