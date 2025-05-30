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
  const customerId = useCustomerStore((state: CustomerState) => state.customerId)
  const externalCustomerId = useCustomerStore((state: CustomerState) => state.externalCustomerId)
  const selectedInstance = useCustomerStore((state: CustomerState) => state.selectedInstance)
  const logout = useCustomerStore((state: CustomerState) => state.logout)
  
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false)
  
  const handleSignOut = () => {
    logout();
    // Redirect to plan-select if not already on homepage
    if (pathname !== '/') {
      router.push('/plan-select');
    }
  }

  const hasActiveContext = !!customerId;
  const showSignUpButton = !hasActiveContext && selectedInstance && pathname !== '/';

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
              {selectedInstance && (
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {selectedInstance === 'cloud-infra' ? 'Cloud Infra' : 'AI Agents'}
                </span>
              )}
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                Sign Out
              </Button>
            </>
          ) : (
            showSignUpButton && (
              <SignUpButton onClick={() => setIsRegistrationOpen(true)} />
            )
          )}
        </div>
      </div>
      
      {selectedInstance && (
        <CustomerRegistrationDialog 
          isOpen={isRegistrationOpen}
          onClose={() => setIsRegistrationOpen(false)}
          onRegistrationSuccess={() => {
            setIsRegistrationOpen(false); 
          }}
          instance={selectedInstance}
        />
      )}
    </header>
  )
}

