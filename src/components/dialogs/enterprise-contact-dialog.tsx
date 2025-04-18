"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
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

interface EnterpriseContactDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EnterpriseContactDialog({ open, onOpenChange }: EnterpriseContactDialogProps) {
  const [formData, setFormData] = useState({
    bandwidth: "",
    edgeRequests: "",
    storage: "",
    buildMinutes: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

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
      // TODO: Implement the actual submission logic
      toast.success("Request submitted successfully!")
      onOpenChange(false)
    } catch (error) {
      toast.error(`Error submitting request: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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