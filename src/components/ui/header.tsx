"use client"

import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import { useCustomerStore } from "@/lib/store/customer-store"

export function Header() {
  const { 
    customer, 
    openRegistration,
    reset 
  } = useCustomerStore()

  const handleLogout = () => {
    reset() // This will clear all state including customer and subscription
  }

  return (
    <header className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between">
        <Logo />
        <div className="flex items-center gap-4">
          {customer ? (
            <>
              <span className="text-sm text-muted-foreground">
                Welcome, {customer.name}
              </span>
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <Button onClick={() => openRegistration()}>
              Sign Up
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}

