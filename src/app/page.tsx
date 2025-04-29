"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/ui/header"
import { PricingPlans } from "@/components/plans/pricing-plans"
import { CustomerRegistrationDialog } from "@/components/dialogs/customer-registration-dialog"
import { PlanSelectionDialog } from "@/components/dialogs/plan-selection-dialog"
import { EnterpriseContactDialog } from "@/components/dialogs/enterprise-contact-dialog"
import { useCustomerStore, type CustomerState } from "@/lib/store/customer-store"

// Define the possible dialog states
type DialogMode = 'NONE' | 'REGISTRATION' | 'PLAN_SELECTION' | 'ENTERPRISE';

export default function Home() {
  // --- Store State ---
  const pendingPlanId = useCustomerStore((state: CustomerState) => state.pendingPlanId);
  const setPendingPlanId = useCustomerStore((state: CustomerState) => state.setPendingPlanId);
  const customerId = useCustomerStore((state: CustomerState) => state.customerId);
  const setCustomerId = useCustomerStore((state: CustomerState) => state.setCustomerId);

  // --- Component State ---
  const [dialogMode, setDialogMode] = useState<DialogMode>('NONE');

  // New single effect to manage dialog mode
  useEffect(() => {
    console.log('[Dialog Effect] Checking:', { pendingPlanId, customerId });
    if (!pendingPlanId) {
      setDialogMode('NONE'); // No plan selected, no dialog
      return;
    }

    if (pendingPlanId === 'nimbus_scale_enterprise') {
      // Enterprise plan selected
      if (customerId) {
        console.log('[Dialog Effect] Setting mode: ENTERPRISE');
        setDialogMode('ENTERPRISE');
      } else {
        console.log('[Dialog Effect] Setting mode: REGISTRATION (for Enterprise)');
        setDialogMode('REGISTRATION');
      }
    } else {
      // Non-enterprise plan selected
      if (customerId) {
        console.log('[Dialog Effect] Setting mode: PLAN_SELECTION');
        setDialogMode('PLAN_SELECTION');
      } else {
        console.log('[Dialog Effect] Setting mode: REGISTRATION (for Non-Enterprise)');
        setDialogMode('REGISTRATION');
      }
    }
  }, [pendingPlanId, customerId]); // Effect runs when plan or auth status changes

  // --- Dialog Control --- 

  // closeRegistration: Just clear pendingPlanId if cancelled before customer creation
  const closeRegistration = () => {
    if (!customerId) { 
      console.log('Registration Dialog closed/cancelled before customer creation, clearing pending ID.');
      setPendingPlanId(null); // This will trigger effect to set mode to NONE
    }
    // If customerId exists, handleRegistrationSuccess will be called instead, 
    // which will also clear the dialog via the effect.
    // No need to call setDialogMode('NONE') here.
  }

  // handleRegistrationSuccess: Set customerId, the effect will handle the next dialog or closing
  const handleRegistrationSuccess = (createdCustomerId: string) => {
    console.log('Registration successful, setting customer ID.');
    setCustomerId(createdCustomerId);
    // Effect will determine next mode
  }

  // closePlanSelection: Clear pendingPlanId
  const closePlanSelection = () => {
    // setDialogMode('NONE'); // <-- Remove: Effect will handle closing
    setPendingPlanId(null); 
  }

  // Add handler to close enterprise dialog: Clear pendingPlanId
  const closeEnterpriseDialog = () => {
    // setDialogMode('NONE'); // <-- Remove: Effect will handle closing
    setPendingPlanId(null);
  }

  // handleSuccessfulSubscription: Clear pendingPlanId via closePlanSelection
  const handleSuccessfulSubscription = () => {
    // pendingPlanId is likely already cleared by the subscription action,
    // but calling closePlanSelection ensures the state is consistent.
    closePlanSelection();
  }

  return (
    <>
      <Header />
      <main>
        <PricingPlans />
      </main>
      <CustomerRegistrationDialog 
        onRegistrationSuccess={handleRegistrationSuccess}
        isOpen={dialogMode === 'REGISTRATION'}
        onClose={closeRegistration}
      />
      <PlanSelectionDialog 
        customerId={customerId || ""}
        isOpen={dialogMode === 'PLAN_SELECTION'}
        onClose={closePlanSelection}
        onSubscriptionSuccess={handleSuccessfulSubscription}
      />
      <EnterpriseContactDialog
        open={dialogMode === 'ENTERPRISE'}
        onOpenChange={(open) => {
          if (!open) {
            closeEnterpriseDialog();
          }
        }}
      />
    </>
  )
}







