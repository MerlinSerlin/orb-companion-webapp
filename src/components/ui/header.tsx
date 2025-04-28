"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useQuery } from '@tanstack/react-query'
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import { useUiStore, type UiState } from "@/lib/store/ui-store"
import { SignUpButton } from "./sign-up-button"
import { CustomerRegistrationDialog } from "@/components/dialogs/customer-registration-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getCustomerDetails } from "@/app/actions"
import type { CustomerDetails } from "@/lib/types"

export function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const resetZustand = useUiStore((state: UiState) => state.reset)
  
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false)
  
  const isDashboardPage = pathname.startsWith('/customer/')
  const customerId = isDashboardPage ? pathname.split('/')[2] : null

  const {
    data: customerData,
    isLoading: isLoadingCustomer,
  } = useQuery<CustomerDetails | null, Error>({
    queryKey: ['customer', customerId],
    queryFn: () => Promise.resolve(null),
    enabled: !!customerId,
    staleTime: Infinity,
  })

  const handleLogout = () => {
    resetZustand()
    router.push('/')
  }

  const isHomePage = pathname === '/'

  return (
    <header className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between">
        <Logo />
        <div className="flex items-center gap-4">
          {isHomePage && (
            <SignUpButton onClick={() => setIsRegistrationOpen(true)} />
          )}
          
          {isDashboardPage && customerData && (
            <>
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {customerData.external_customer_id?.substring(0, 2).toUpperCase() || '??'}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">
                 {customerData.external_customer_id || 'Customer'} 
              </span>
              <Button variant="outline" onClick={handleLogout}>
                Sign Out
              </Button>
            </>
          )}
          {isDashboardPage && isLoadingCustomer && (
            <span className="text-sm text-muted-foreground">Loading...</span>
          )}
        </div>
      </div>
      
      <CustomerRegistrationDialog 
        isOpen={isRegistrationOpen}
        onClose={() => setIsRegistrationOpen(false)}
        onRegistrationSuccess={() => {
          setIsRegistrationOpen(false); 
        }}
      />
    </header>
  )
}

