"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import { useCustomerStore, type CustomerState } from "@/lib/store/customer-store"
import { SignUpButton } from "./sign-up-button"
import { CustomerRegistrationDialog } from "@/components/dialogs/customer-registration-dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const resetZustand = useCustomerStore((state: CustomerState) => state.reset)
  const authenticatedCustomerId = useCustomerStore((state: CustomerState) => state.customerId);
  const externalCustomerId = useCustomerStore((state: CustomerState) => state.externalCustomerId);
  
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false)
  
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
          {authenticatedCustomerId ? (
            <>
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {externalCustomerId?.substring(0, 2).toUpperCase() 
                    || authenticatedCustomerId.substring(0, 2).toUpperCase() 
                    || '??'}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground" title={authenticatedCustomerId}>
                 {externalCustomerId || `User: ${authenticatedCustomerId.substring(0, 6)}...`}
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Sign Out
              </Button>
            </>
          ) : (
            isHomePage && (
              <SignUpButton onClick={() => setIsRegistrationOpen(true)} />
            )
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

