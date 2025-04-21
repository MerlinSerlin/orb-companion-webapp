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
  isOpen: boolean
  onClose: () => void
  registrationSuccessCallback: (() => void) | null
}

export function CustomerRegistrationDialog({ 
  onOpenPlanSelection,
  isOpen,
  onClose,
  registrationSuccessCallback
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
      // Store pendingPlanId in a local variable to preserve it
      const selectedPlanId = pendingPlanId;
      
      // Create customer
      const customerResult = await createCustomer(formData.name, formData.email)

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
        name: formData.name,
        email: formData.email,
        subscriptions: []
      }
      setCustomer(newCustomer)

      // Show success toast with more details
      toast.success("Account created successfully!", {
        description: `Welcome to NimbusScale, ${formData.name}! You can now select a plan.`,
        icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
        duration: 5000,
      })

      // Close the dialog and reset form
      onClose()
      setFormData({ name: "", email: "" })

      // Use the locally stored planId to ensure it wasn't cleared during the API call
      // If there's a pending plan and it's not the enterprise plan, open the plan selection dialog
      if (selectedPlanId && selectedPlanId !== "plan_enterprise" && onOpenPlanSelection) {
        // We need to make sure the pendingPlanId is still set when opening the plan selection dialog
        // This might have been cleared elsewhere, so we need to re-set it
        if (onOpenPlanSelection) {
          setTimeout(() => {
            // We don't have direct access to setPendingPlanId here, but
            // onOpenPlanSelection will handle this for us via the registrationWasSuccessful flag
            onOpenPlanSelection();
          }, 500);
        }
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

  // Prepare API schema data based on Orb API docs
  const apiRequestBody = {
    email: formData.email || "customer@example.com",
    name: formData.name || "Example Customer",
    external_customer_id: formData.name.replace(/\s+/g, '_') || "example_customer",
    // Additional optional fields are commented out to keep the display cleaner
    // accounting_sync_configuration: { provider: "string", external_id: "string" },
    // additional_emails: ["user@example.com"],
    // auto_collection: true,
    // billing_address: { line1: "string", line2: "string", city: "string", state: "string", postal_code: "string", country: "string" },
    // currency: "USD",
    // email_delivery: true,
    // metadata: { "key": "value" },
    // payment_provider: "string",
    // payment_provider_id: "string",
    // shipping_address: { line1: "string", line2: "string", city: "string", state: "string", postal_code: "string", country: "string" },
    // tax_id: { country: "US", type: "us_ein", value: "string" },
    // timezone: "America/Los_Angeles"
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
          // When dialog is closed manually (by clicking outside or pressing ESC)
          // reset the form and call onClose which should preserve pendingPlanId if needed
          setFormData({ name: "", email: "" });
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



