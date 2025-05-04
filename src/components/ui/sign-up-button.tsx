"use client"

import { Button } from "@/components/ui/button"
// REMOVED unused store import
// import { useCustomerStore } from "@/lib/store/customer-store"

interface SignUpButtonProps {
  variant?: "default" | "outline" | "ghost" | "link"
  className?: string
  onClick: () => void
}

export function SignUpButton({ variant = "default", className, onClick }: SignUpButtonProps) {

  // Always render the button, visibility controlled by parent (Header)
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