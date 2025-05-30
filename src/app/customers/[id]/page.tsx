"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useCustomerStore } from "@/lib/store/customer-store"
import { CustomerDashboardContent } from "@/components/customer-dashboard/dashboard-content"

export default function CustomerDashboardPage({ 
  params 
}: { 
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const selectedInstance = useCustomerStore((state) => state.selectedInstance)
  const setSelectedInstance = useCustomerStore((state) => state.setSelectedInstance)
  const [isLoading, setIsLoading] = useState(true)
  
  // Unwrap params using React.use() as required by Next.js 15
  const { id: customerId } = use(params)

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
              console.log(`[Customer Dashboard] Found instance in storage: ${parsed.state.selectedInstance}`)
              setSelectedInstance(parsed.state.selectedInstance)
              setIsLoading(false)
              return
            }
          } catch (error) {
            console.error('[Customer Dashboard] Error parsing localStorage:', error)
          }
        }
        
        console.log('[Customer Dashboard] No instance found, redirecting to homepage')
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
    <CustomerDashboardContent 
      customerId={customerId} 
      instance={selectedInstance} 
    />
  )
} 

export const dynamic = 'force-dynamic' 