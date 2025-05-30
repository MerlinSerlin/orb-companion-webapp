"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"
import { getCurrentCompanyConfig } from "../plans/plan-data"
import { useCustomerStore } from "@/lib/store/customer-store"
import { ORB_INSTANCES, type OrbInstance } from "@/lib/orb-config"
import { PlanSelectionDialog } from "./plan-selection-dialog"
import { CustomerRegistrationDialog } from "./customer-registration-dialog"

interface PricingPlansProps {
  instance: OrbInstance // Now required since it comes from the store
}

export function PricingPlans({ instance }: PricingPlansProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false)
  const setPendingPlanId = useCustomerStore((state) => state.setPendingPlanId)
  
  // Get customer data directly from store (no validation needed)
  const customerId = useCustomerStore((state) => state.customerId)

  // Get the appropriate plan data based on instance
  const instanceConfig = ORB_INSTANCES[instance];
  const companyConfig = getCurrentCompanyConfig(instanceConfig.companyKey);
  const plans = companyConfig.uiPlans;

  const handlePlanSelect = (planId: string) => {
    console.log(`[Pricing Plans] Plan selected: ${planId}, Customer ID: ${customerId}, Instance: ${instance}`);
    
    // Check if customer exists before allowing subscription
    if (!customerId) {
      console.log(`[Pricing Plans] No customer ID, showing registration dialog`);
      // Store the plan they want to subscribe to
      setPendingPlanId(planId)
      // Show registration dialog first
      setIsRegistrationOpen(true)
      return
    }

    console.log(`[Pricing Plans] Customer exists, proceeding with subscription dialog`);
    // Customer exists, proceed with subscription
    setPendingPlanId(planId)
    setIsDialogOpen(true)
  }

  const handleRegistrationSuccess = () => {
    // After successful registration, open the subscription dialog
    setIsRegistrationOpen(false)
    setIsDialogOpen(true)
  }

  const handleContactSales = () => {
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
          {plans.map((plan) => (
            <Card key={plan.plan_id} className={`relative ${plan.popular ? 'border-blue-500 shadow-lg' : ''}`}>
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500">
                  Most Popular
                </Badge>
              )}
              <CardHeader>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-3xl font-bold">{plan.price}</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-3" />
                      <span className="text-sm">{feature.name}: {feature.value}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                {plan.plan_id === 'enterprise' ? (
                  <Button 
                    onClick={handleContactSales}
                    className="w-full"
                    variant="outline"
                  >
                    Contact Sales
                  </Button>
                ) : (
                  <Button 
                    onClick={() => handlePlanSelect(plan.plan_id)}
                    className="w-full"
                  >
                    Subscribe
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600">
            Need a custom plan?{" "}
            <button 
              onClick={handleContactSales}
              className="text-blue-600 hover:text-blue-500 font-medium"
            >
              Contact our sales team →
            </button>
          </p>
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
    </div>
  )
} 