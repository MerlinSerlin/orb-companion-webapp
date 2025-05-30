"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useCustomerStore } from "@/lib/store/customer-store"
import { Header } from "@/components/ui/header"
import { PricingPlans } from "@/components/homepage/pricing-plans"

export default function PlanSelectPage() {
  const router = useRouter()
  const selectedInstance = useCustomerStore((state) => state.selectedInstance)

  // Redirect to homepage if no instance is selected
  useEffect(() => {
    if (!selectedInstance) {
      console.log('[Plan Select] No instance selected, redirecting to homepage')
      router.push('/')
    }
  }, [selectedInstance, router])

  // Don't render anything if no instance is selected (will redirect)
  if (!selectedInstance) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <PricingPlans instance={selectedInstance} />
      </main>
    </div>
  )
} 