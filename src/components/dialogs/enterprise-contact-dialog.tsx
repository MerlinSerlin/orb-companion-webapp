"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
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

interface EnterpriseContactDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EnterpriseContactDialog({ open, onOpenChange }: EnterpriseContactDialogProps) {
  const { customer, setSubscription } = useCustomerStore()
  const [formData, setFormData] = useState({
    bandwidth: "",
    edgeRequests: "",
    storage: "",
    buildMinutes: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formSubmitted, setFormSubmitted] = useState(false)

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      // Reset the form if it was previously submitted and dialog is reopening
      if (formSubmitted) {
        setFormSubmitted(false);
      }
    }
  }, [open, formSubmitted]);

  const resetForm = () => {
    setFormData({
      bandwidth: "",
      edgeRequests: "",
      storage: "",
      buildMinutes: "",
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    // Only allow numeric input
    if (value === "" || /^\d+$/.test(value)) {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate all fields have values
    if (!formData.bandwidth || !formData.edgeRequests || !formData.storage || !formData.buildMinutes) {
      toast.error("Please fill in all fields")
      return
    }

    setIsSubmitting(true)
    
    try {
      // Create a subscription for the enterprise plan if the customer is logged in
      if (customer) {
        const enterpriseSubscription = {
          id: `sub_${Math.random().toString(36).substr(2, 9)}`, // Mock ID for now
          plan_id: "plan_enterprise",
          status: 'pending' as const, // Enterprise plans typically start as pending until approved
        }
        
        setSubscription(enterpriseSubscription)
        
        toast.success("Enterprise plan request submitted!", {
          description: "Our team will contact you soon with a custom quote based on your requirements.",
          duration: 5000,
        })
      } else {
        toast.success("Request submitted successfully!")
      }
      
      // Mark the form as submitted
      setFormSubmitted(true);
      // Reset the form for next time
      resetForm();
      // Close the dialog
      onOpenChange(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error submitting request";
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Prepare API schema data based on Orb API for creating a price plan
  const apiRequestBody = {
    name: "Enterprise Plan",
    description: "Custom enterprise plan",
    currency: "USD",
    usage_requirements: {
      bandwidth_gb: parseInt(formData.bandwidth) || 5000,
      edge_requests: parseInt(formData.edgeRequests) || 10000000,
      storage_gb: parseInt(formData.storage) || 2000,
      build_minutes: parseInt(formData.buildMinutes) || 2000
    },
    metadata: {
      plan_type: "enterprise",
      custom_quote: true
    }
  }

  const sampleResponse = {
    id: "plan_enterprise_custom",
    name: "Enterprise Plan",
    status: "active",
    created_at: new Date().toISOString(),
    currency: "USD",
    usage_requirements: {
      bandwidth_gb: parseInt(formData.bandwidth) || 5000,
      edge_requests: parseInt(formData.edgeRequests) || 10000000,
      storage_gb: parseInt(formData.storage) || 2000,
      build_minutes: parseInt(formData.buildMinutes) || 2000
    }
  }

  return (
    <Dialog 
      open={open} 
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          // When dialog is being closed, reset the form for next time
          resetForm();
        }
        onOpenChange(isOpen);
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Enterprise Plan Request</DialogTitle>
          <DialogDescription>Please provide your requirements for the Enterprise plan.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <FormField
              id="bandwidth"
              name="bandwidth"
              label="Bandwidth (GB)"
              value={formData.bandwidth}
              onChange={handleInputChange}
              placeholder="Enter GB"
            />
            <FormField
              id="edgeRequests"
              name="edgeRequests"
              label="Edge Requests"
              value={formData.edgeRequests}
              onChange={handleInputChange}
              placeholder="Enter number of requests"
            />
            <FormField
              id="storage"
              name="storage"
              label="Storage (GB)"
              value={formData.storage}
              onChange={handleInputChange}
              placeholder="Enter GB"
            />
            <FormField
              id="buildMinutes"
              name="buildMinutes"
              label="Build Minutes"
              value={formData.buildMinutes}
              onChange={handleInputChange}
              placeholder="Enter minutes"
            />
            
            <div className="flex items-center justify-between mt-2">
              <ApiPreviewDialog
                payload={apiRequestBody}
                response={sampleResponse}
                endpoint="https://api.withorb.com/v1/plans"
                method="POST"
                title="Create Enterprise Plan"
                description="This API call will create a custom enterprise plan in Orb with the requirements specified."
                buttonText="Preview API Call"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting Request...
                </>
              ) : (
                "Submit Request"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 