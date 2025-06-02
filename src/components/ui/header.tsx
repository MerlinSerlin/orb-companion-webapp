"use client"

import React, { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import { useCustomerStore, type CustomerState } from "@/lib/store/customer-store"
import { SignUpButton } from "./sign-up-button"
import { CustomerRegistrationDialog } from "@/components/plan-select/customer-registration-dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Cloud, Brain } from "lucide-react"
import { type OrbInstance } from "@/lib/orb-config"

// Instance configuration matching homepage
const getInstanceConfig = (instance: OrbInstance) => {
  const configs = {
    'cloud-infra': {
      title: 'Cloud Infrastructure',
      icon: Cloud,
      color: 'bg-blue-500'
    },
    'ai-agents': {
      title: 'AI Agents', 
      icon: Brain,
      color: 'bg-purple-500'
    }
  }
  return configs[instance]
}

export function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const customerId = useCustomerStore((state: CustomerState) => state.customerId)
  const externalCustomerId = useCustomerStore((state: CustomerState) => state.externalCustomerId)
  const selectedInstance = useCustomerStore((state: CustomerState) => state.selectedInstance)
  const resetStore = useCustomerStore((state: CustomerState) => state.reset)
  
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false)
  
  const handleSignOut = () => {
    resetStore(); 
    router.push('/'); // Always redirect to the homepage after reset
  }

  const hasActiveContext = !!customerId;
  const showSignUpButton = !hasActiveContext && selectedInstance && pathname !== '/';
  const instanceConfig = selectedInstance ? getInstanceConfig(selectedInstance) : null;

  return (
    <header className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Logo />
          {/* Instance indicator - only show when not on homepage */}
          {instanceConfig && pathname !== '/' && (
            <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
              <div className={`w-8 h-8 ${instanceConfig.color} rounded-full flex items-center justify-center`}>
                <instanceConfig.icon className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-700">{instanceConfig.title}</span>
            </div>
          )}
        </div>
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

