import { Header } from "@/components/ui/header"
import { PricingPlans } from "@/components/plans/pricing-plans"
import { CustomerRegistrationDialog } from "@/components/customer-registration-dialog"
import { PlanSelectionDialog } from "@/components/plan-selection-dialog"

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <PricingPlans />
      </main>
      <CustomerRegistrationDialog />
      <PlanSelectionDialog />
    </>
  )
}







