"use client"

import { useState } from "react"
import { toast } from "sonner"
import { PlanCard } from "./plan-card"
import { PLAN_DETAILS } from "./plan-data"
import { useCustomerStore } from "@/lib/store/customer-store"
import { Loader2 } from "lucide-react"

export function PricingPlans() {
  const { 
    customer, 
    openRegistration, 
    setPendingPlanId,
  } = useCustomerStore()

  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [isSubscribing, setIsSubscribing] = useState(false)

  const subscribeToPlan = async (planId: string) => {
    if (!customer) {
      return
    }

    setSelectedPlan(planId)
    setIsSubscribing(true)

    try {
      const plan = PLAN_DETAILS.find((p) => p.id === planId)
      
      // TODO: Implement subscription logic when ready
      toast.success(`Subscribed to ${plan?.name} Plan!`, {
        description: `Thank you, ${customer?.name}! Your subscription has been activated successfully.`,
        duration: 5000,
      })
    } catch (error) {
      toast.error("Subscription Error", {
        description: error instanceof Error ? error.message : "An unknown error occurred",
        duration: 5000,
      })
    } finally {
      setIsSubscribing(false)
      setSelectedPlan(null)
    }
  }

  const handleSelectPlan = (planId: string) => {
    if (!customer) {
      // Store the selected plan ID and open registration
      setPendingPlanId(planId)
      openRegistration()
    } else {
      // User is already authenticated, proceed with subscription
      subscribeToPlan(planId)
    }
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
              cta={
                isSubscribing && selectedPlan === plan.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  plan.cta
                )
              }
              popular={plan.popular}
              onSelect={() => handleSelectPlan(plan.id)}
              disabled={isSubscribing}
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
    </section>
  )
}













