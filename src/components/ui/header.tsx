"use client"

import React, { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import { useCustomerStore, type CustomerState } from "@/lib/store/customer-store"
import { SignUpButton } from "./sign-up-button"
import { CustomerRegistrationDialog } from "@/components/homepage/customer-registration-dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const resetZustand = useCustomerStore((state: CustomerState) => state.reset)
  const customerId = useCustomerStore((state: CustomerState) => state.customerId);
  const externalCustomerId = useCustomerStore((state: CustomerState) => state.externalCustomerId);
  
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false)
  
  const handleSignOut = () => {
    resetZustand();
    router.push('/');
  }

  const isHomePage = pathname === '/'

  const hasActiveContext = !!customerId;

  return (
    <header className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between">
        <Logo />
        <div className="flex items-center gap-4">
          {hasActiveContext ? (
            <>
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {externalCustomerId?.substring(0, 2).toUpperCase() 
                    || customerId?.substring(0, 2).toUpperCase()
                    || '??'}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground" title={customerId || 'No Internal ID'}>
                 {externalCustomerId || (customerId ? `ID: ${customerId.substring(0, 6)}...` : 'Context Active')}
              </span>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
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

