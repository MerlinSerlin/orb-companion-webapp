"use client"

import { useState } from "react"
import { toast } from "sonner"
import { CheckCircle2, Loader2 } from "lucide-react"
import { createCustomer } from "@/app/actions"
import { useCustomerStore } from "@/lib/store/customer-store" 
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { FormField } from "@/components/ui/form-field"
import { ApiPreviewDialog } from "@/components/dialogs/api-preview-dialog"

interface CustomerRegistrationDialogProps {
  onOpenPlanSelection?: () => void
  onRegistrationSuccess: () => void
  isOpen: boolean
  onClose: () => void
}

export function CustomerRegistrationDialog({ 
  onOpenPlanSelection,
  onRegistrationSuccess,
  isOpen,
  onClose,
}: CustomerRegistrationDialogProps) {
  const { 
    setCustomer,
    pendingPlanId
  } = useCustomerStore()

  const [formData, setFormData] = useState({
    name: "",
    email: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.email) {
      toast.error("Please fill in all fields")
      return
    }

    setIsSubmitting(true)

    try {
      const selectedPlanId = pendingPlanId;
      
      const customerResult = await createCustomer(formData.name, formData.email)

      if (!customerResult.success || !customerResult.customerId) {
        throw new Error(customerResult.error || "Failed to create customer or missing ID")
      }

      const newCustomer = {
        id: customerResult.customerId,
        name: formData.name,
        email: formData.email,
        subscriptions: []
      }
      setCustomer(newCustomer)

      toast.success("Account created successfully!", {
        description: `Welcome to NimbusScale, ${formData.name}! You can now select a plan.`,
        icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
        duration: 5000,
      })

      onRegistrationSuccess();

      setFormData({ name: "", email: "" });

      onClose();

      if (selectedPlanId && selectedPlanId !== "nimbus_scale_enterprise" && onOpenPlanSelection) {
        console.log("Non-enterprise plan selected, calling onOpenPlanSelection shortly...")
        setTimeout(() => {
          onOpenPlanSelection();
        }, 100); 
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

  const apiRequestBody = {
    email: formData.email || "customer@example.com",
    name: formData.name || "Example Customer",
    external_customer_id: formData.name.replace(/\s+/g, '_') || "example_customer",
  }

  const sampleResponse = {
    id: "cust_12345abcdef",
    name: formData.name || "Example Customer",
    email: formData.email || "customer@example.com",
    external_customer_id: formData.name.replace(/\s+/g, '_') || "example_customer",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Your Account</DialogTitle>
          <DialogDescription>Enter your information to get started with NimbusScale.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <FormField
              id="name"
              name="name"
              label="Name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your name"
              disabled={isSubmitting}
              required
              gridClassName="grid gap-2"
              labelClassName=""
              inputClassName=""
            />
            <FormField
              id="email"
              name="email"
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              disabled={isSubmitting}
              required
              gridClassName="grid gap-2"
              labelClassName=""
              inputClassName=""
            />

            <div className="flex items-center justify-between mt-2">
              <ApiPreviewDialog
                payload={apiRequestBody}
                response={sampleResponse}
                endpoint="https://api.withorb.com/v1/customers"
                method="POST"
                title="Create Orb Customer"
                description="This API call will create a new customer in Orb with the information provided."
                buttonText="Preview API Call"
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



