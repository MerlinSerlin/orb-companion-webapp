"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import { useCustomerStore } from "@/lib/store/customer-store"
import { SignUpButton } from "./sign-up-button"
import { CustomerRegistrationDialog } from "@/components/dialogs/customer-registration-dialog"

export function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const { 
    customer,
    reset 
  } = useCustomerStore()
  
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false)

  const handleLogout = () => {
    reset() // Clear customer state
    router.push('/') // Redirect to homepage
  }

  const goToDashboard = () => {
    if (customer) {
      router.push(`/customer/${customer.id}`)
    }
  }
  
  const isHomePage = pathname === '/';
  // Check if it's a customer dashboard page
  const isDashboardPage = pathname.startsWith('/customer/');

  return (
    <header className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between">
        <Logo />
        <div className="flex items-center gap-4">
          {/* Homepage: Show Welcome/Dashboard/Logout or Sign Up */}
          {isHomePage && customer && (
            <>
              <span className="text-sm text-muted-foreground">
                Welcome, {customer.name}
              </span>
              <Button variant="secondary" onClick={goToDashboard}>
                Dashboard
              </Button>
              {/* Use the same handleLogout function */}
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </>
          )}
          {isHomePage && !customer && (
            <SignUpButton onClick={() => setIsRegistrationOpen(true)} />
          )}
          
          {/* Dashboard Page: Show only Sign Out */}
          {isDashboardPage && (
            <Button variant="outline" onClick={handleLogout}>
              Sign Out
            </Button>
          )}
        </div>
      </div>
      
      {/* Keep registration dialog logic for homepage use */}
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

