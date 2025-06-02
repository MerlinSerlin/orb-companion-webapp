"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Bot } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { ORB_INSTANCES, isValidInstance } from "@/lib/orb-config"
import { getCurrentCompanyConfig } from "@/lib/plans"
import { useCustomerStore, type CustomerState } from "@/lib/store/customer-store"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export function Logo() {
  const pathname = usePathname()
  const router = useRouter()
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const customerId = useCustomerStore((state: CustomerState) => state.customerId)
  const externalCustomerId = useCustomerStore((state: CustomerState) => state.externalCustomerId)
  
  // Extract instance from pathname (e.g., /cloud-infra/... -> cloud-infra)
  const pathSegments = pathname.split('/').filter(Boolean)
  const instance = pathSegments[0]
  
  // Get the appropriate configuration
  let companyName = "Orb Companion"
  
  if (instance && isValidInstance(instance)) {
    const instanceConfig = ORB_INSTANCES[instance]
    const companyConfig = getCurrentCompanyConfig(instanceConfig.companyKey)
    companyName = companyConfig.companyName
  }

  const handleBreadcrumbClick = (e: React.MouseEvent) => {
    // If user has active customer context, show confirmation dialog
    if (customerId) {
      e.preventDefault() // Prevent immediate navigation
      setShowLogoutDialog(true)
    }
    // If no customer context, allow normal navigation
  }

  const handleConfirmLogout = () => {
    setShowLogoutDialog(false)
    router.push('/')
  }

  const handleCancelLogout = () => {
    setShowLogoutDialog(false)
  }

  const customerDisplay = externalCustomerId || `Customer ${customerId?.substring(0, 8)}`
  
  return (
    <>
      <Link 
        href="/" 
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        onClick={handleBreadcrumbClick}
      >
        <div className="relative w-8 h-8">
          <Bot className="w-8 h-8 text-primary" />
        </div>
        <span className="font-bold text-xl">{companyName}</span>
      </Link>

      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Return to Homepage?</DialogTitle>
            <DialogDescription>
              You are currently viewing <span className="font-medium">{customerDisplay}</span>.
              Returning to the homepage will log you out of this customer session.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelLogout}>
              Stay Here
            </Button>
            <Button onClick={handleConfirmLogout}>
              Return to Homepage
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

