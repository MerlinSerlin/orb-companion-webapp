"use client"

import { Button } from "@/components/ui/button"
import { useCustomerStore } from "@/lib/store/customer-store"

interface SignUpButtonProps {
  variant?: "default" | "outline" | "ghost" | "link"
  className?: string
  onClick: () => void
}

export function SignUpButton({ variant = "default", className, onClick }: SignUpButtonProps) {
  const { customer } = useCustomerStore()

  // Don't render anything if user is already signed in
  if (customer) {
    return null
  }

  return (
    <Button 
      variant={variant} 
      className={className}
      onClick={onClick}
    >
      Sign Up
    </Button>
  )
} 