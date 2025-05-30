"use client"

import { use, useEffect } from "react"
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
  
  // Unwrap params using React.use() as required by Next.js 15
  const { id: customerId } = use(params)

  // Redirect to homepage if no instance is selected
  useEffect(() => {
    if (!selectedInstance) {
      console.log('[Customer Dashboard] No instance selected, redirecting to homepage')
      router.push('/')
    }
  }, [selectedInstance, router])

  // Don't render anything if no instance is selected (will redirect)
  if (!selectedInstance) {
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