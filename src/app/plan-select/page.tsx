"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useCustomerStore } from "@/lib/store/customer-store"
import { Header } from "@/components/ui/header"
import { PricingPlans } from "@/components/homepage/pricing-plans"

export default function PlanSelectPage() {
  const router = useRouter()
  const selectedInstance = useCustomerStore((state) => state.selectedInstance)
  const setSelectedInstance = useCustomerStore((state) => state.setSelectedInstance)
  const [isLoading, setIsLoading] = useState(true)

  // Handle direct navigation by checking localStorage
  useEffect(() => {
    const checkInstanceFromStorage = () => {
      if (!selectedInstance) {
        // Check if instance exists in localStorage (for direct navigation)
        const storedData = localStorage.getItem('customer-storage')
        if (storedData) {
          try {
            const parsed = JSON.parse(storedData)
            if (parsed.state?.selectedInstance) {
              console.log(`[Plan Select] Found instance in storage: ${parsed.state.selectedInstance}`)
              setSelectedInstance(parsed.state.selectedInstance)
              setIsLoading(false)
              return
            }
          } catch (error) {
            console.error('[Plan Select] Error parsing localStorage:', error)
          }
        }
        
        console.log('[Plan Select] No instance found, redirecting to homepage')
        router.push('/')
      } else {
        setIsLoading(false)
      }
    }

    // Small delay to allow Zustand to hydrate from localStorage
    const timeoutId = setTimeout(checkInstanceFromStorage, 100)
    
    return () => clearTimeout(timeoutId)
  }, [selectedInstance, setSelectedInstance, router])

  // Don't render anything while loading or if no instance
  if (isLoading || !selectedInstance) {
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