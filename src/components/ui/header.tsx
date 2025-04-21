"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import { useCustomerStore } from "@/lib/store/customer-store"
import { SignUpButton } from "./sign-up-button"
import { CustomerRegistrationDialog } from "@/components/dialogs/customer-registration-dialog"

export function Header() {
  const { 
    customer,
    reset 
  } = useCustomerStore()
  
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false)

  const handleLogout = () => {
    reset() // This will clear all state including customer and subscription
  }

  return (
    <header className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between">
        <Logo />
        <div className="flex items-center gap-4">
          {customer && (
            <>
              <span className="text-sm text-muted-foreground">
                Welcome, {customer.name}
              </span>
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </>
          )}
          <SignUpButton onClick={() => setIsRegistrationOpen(true)} />
        </div>
      </div>
      
      <CustomerRegistrationDialog 
        isOpen={isRegistrationOpen}
        onClose={() => setIsRegistrationOpen(false)}
        registrationSuccessCallback={null}
      />
    </header>
  )
}

