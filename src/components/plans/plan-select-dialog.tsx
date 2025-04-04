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
import { Loader2 } from "lucide-react"

interface CustomerFormDialogProps {
  isOpen: boolean
  onClose: () => void
  planId: string
  planName: string
}

export function CustomerFormDialog({ isOpen, onClose, planName }: CustomerFormDialogProps) {
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

      // Subscribe customer to plan
    //   if (!customerResult.customerId) return;
    //   const subscriptionResult = await subscribeCustomerToPlan(customerResult.customerId, planId)

    //   if (!subscriptionResult.success) {
    //     throw new Error(subscriptionResult.error || "Failed to subscribe to plan")
    //   }

    //   toast.success("Successfully subscribed to plan!", {
    //     description: `Welcome to NimbusScale, ${name}!`,
    //   })

      // Close the dialog and reset form
      onClose()
      setName("")
      setEmail("")
    } catch (error) {
      toast.error("Error", {
        description: error instanceof Error ? error.message : "An unknown error occurred",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Subscribe to {planName} Plan</DialogTitle>
          <DialogDescription>Enter your information to complete your subscription.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Business Name</Label>
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
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Subscribe"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

