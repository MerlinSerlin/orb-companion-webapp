"use client"

import { useState } from "react"
import { PlanCard } from "./plan-card"
import { PLAN_DETAILS } from "./plan-data"
import { CustomerFormDialog } from "./plan-select-dialog"

export function PricingPlans() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [selectedPlanName, setSelectedPlanName] = useState<string>("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId)

    const plan = PLAN_DETAILS.find((p) => p.id === planId)
    if (plan) {
      setSelectedPlanName(plan.name)
    }

    // Open the dialog to collect user information
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
  }

  return (
    <section className="container mx-auto py-8">
      <div className="relative">
        {/* Decorative elements */}
        <div className="absolute -z-10 top-1/2 left-1/4 h-[200px] w-[200px] rounded-full bg-primary/10 blur-[100px]"></div>
        <div className="absolute -z-10 top-1/3 right-1/4 h-[300px] w-[300px] rounded-full bg-primary/10 blur-[100px]"></div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto relative">
          {PLAN_DETAILS.map((plan) => (
            <PlanCard
              key={plan.id}
              name={plan.name}
              description={plan.description}
              price={plan.price}
              features={plan.features}
              cta={plan.cta}
              popular={plan.popular}
              onSelect={() => handleSelectPlan(plan.id)}
            />
          ))}
        </div>
      </div>

      <div className="mt-8 text-center">
        <div className="inline-flex items-center justify-center gap-2 rounded-full border bg-background px-4 py-1.5 text-sm text-muted-foreground">
          <span>Need a custom plan?</span>
          <a href="#" className="text-primary font-medium hover:underline">
            Contact our sales team →
          </a>
        </div>
      </div>

      {/* Customer Form Dialog */}
      <CustomerFormDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        planId={selectedPlan || ""}
        planName={selectedPlanName}
      />
    </section>
  )
}









