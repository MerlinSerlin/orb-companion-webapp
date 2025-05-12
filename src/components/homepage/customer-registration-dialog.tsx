"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { createCustomer } from "@/app/actions/orb"
import { useCustomerStore, type CustomerState } from "@/lib/store/customer-store"
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
import { ApiPreviewDialog } from "@/components/dialogs/api-preview-dialog"

interface CustomerRegistrationDialogProps {
  onRegistrationSuccess: (customerId: string) => void
  isOpen: boolean
  onClose: () => void
}

export function CustomerRegistrationDialog({ 
  onRegistrationSuccess,
  isOpen,
  onClose,
}: CustomerRegistrationDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const setCustomerId = useCustomerStore((state: CustomerState) => state.setCustomerId);
  const setExternalCustomerId = useCustomerStore((state: CustomerState) => state.setExternalCustomerId);

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

    console.log("Registration form submitted:", formData);
    setIsSubmitting(true)

    try {
      const result = await createCustomer(formData.name, formData.email)
      console.log("createCustomer result:", result);

      if (!result.success || !result.customerId || !result.externalCustomerId) {
        throw new Error(result.error || "Failed to create customer or missing necessary IDs.")
      }

      toast.success("Registration successful!", {
        description: "You can now proceed.",
        duration: 3000,
      })

      setCustomerId(result.customerId);
      setExternalCustomerId(result.externalCustomerId);

      if (onRegistrationSuccess) {
        onRegistrationSuccess(result.customerId);
      }

      setFormData({ name: "", email: "" });

    } catch (error) {
      console.error("Registration Error:", error);
      toast.error("Registration Failed", {
        description: error instanceof Error ? error.message : "An unknown error occurred.",
        duration: 5000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const apiRequestBody = {
    email: formData.email || "customer@example.com",
    name: formData.name || "Example Customer",
    external_customer_id: formData.name.trim().replace(/\s+/g, '_') || "example_customer",
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
          <DialogTitle>Register Account</DialogTitle>
          <DialogDescription>Enter your information to get started.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Name</Label>
              <Input 
                id="name" 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                className="col-span-3" 
                placeholder="Your Name"
                disabled={isSubmitting}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">Email</Label>
              <Input 
                id="email" 
                name="email" 
                type="email" 
                value={formData.email} 
                onChange={handleChange} 
                className="col-span-3" 
                placeholder="marshall@withorb.com"
                disabled={isSubmitting}
              />
            </div>

            <div className="flex items-center justify-between mt-2">
              <ApiPreviewDialog
                payload={apiRequestBody}
                response={sampleResponse}
                endpoint="https://api.withorb.com/v1/customers"
                method="POST"
                title="Create Customer"
                description="This API call will create a new customer in Orb."
                buttonText="Preview API Call"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : (
                "Register"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}



