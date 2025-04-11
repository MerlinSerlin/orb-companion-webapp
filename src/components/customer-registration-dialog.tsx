"use client"

import type React from "react"
import { useState } from "react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createCustomer } from "@/app/actions"
import { Loader2, CheckCircle2 } from "lucide-react"
import { useCustomerStore } from "@/lib/store/customer-store"

export function CustomerRegistrationDialog() {
  const { 
    isRegistrationOpen, 
    closeRegistration, 
    setCustomer, 
    registrationSuccessCallback,
    openPlanSelection,
    pendingPlanId 
  } = useCustomerStore()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !email) {
      toast.error("Please fill in all fields")
      return
    }

    setIsSubmitting(true)

    try {
      // Create customer
      const customerResult = await createCustomer(name, email)

      if (!customerResult.success) {
        throw new Error(customerResult.error || "Failed to create customer")
      }

      if (!customerResult.customerId) {
        toast.error("Customer ID not found")
        return
      }

      // Set customer in store
      const newCustomer = {
        id: customerResult.customerId,
        name,
        email,
      }
      setCustomer(newCustomer)

      // Show success toast with more details
      toast.success("Account created successfully!", {
        description: `Welcome to NimbusScale, ${name}! You can now select a plan.`,
        icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
        duration: 5000,
      })

      // Close the dialog and reset form
      closeRegistration()
      setName("")
      setEmail("")

      // If there's a pending plan, open the plan selection dialog
      if (pendingPlanId) {
        setTimeout(() => {
          openPlanSelection()
        }, 500)
      }
      // Otherwise, execute the success callback if it exists
      else if (registrationSuccessCallback) {
        setTimeout(() => {
          registrationSuccessCallback()
        }, 500)
      }
    } catch (error) {
      toast.error("Error creating account", {
        description: error instanceof Error ? error.message : "An unknown error occurred",
        duration: 5000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isRegistrationOpen} onOpenChange={(open) => !open && closeRegistration()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Your Account</DialogTitle>
          <DialogDescription>Enter your information to get started with NimbusScale.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                disabled={isSubmitting}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                disabled={isSubmitting}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}



