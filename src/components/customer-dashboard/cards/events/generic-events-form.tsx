"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { sendRandomizedEvent } from "@/app/actions/orb"
import type { OrbInstance } from "@/lib/orb-config"
import type { SendEventResult } from "@/lib/events/types"
import { toast } from "sonner"

interface GenericEventsFormProps {
  customerId: string;
  instance: OrbInstance;
  onResult: (result: SendEventResult) => void;
}

export function GenericEventsForm({ customerId, instance, onResult }: GenericEventsFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSendEvent = async (testMode: boolean = false) => {
    setIsLoading(true);
    try {
      const result = await sendRandomizedEvent(customerId, instance, undefined, testMode);
      onResult(result);
      
      if (result.success) {
        toast.success(
          testMode 
            ? "Test event generated successfully!" 
            : "Event sent to Orb successfully!"
        );
      } else {
        toast.error(`Failed to send event: ${result.error}`);
      }
    } catch (error) {
      console.error('Error sending event:', error);
      toast.error('Unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex gap-3">
      <Button 
        onClick={() => handleSendEvent(true)}
        disabled={isLoading}
        variant="outline"
        className="flex-1"
      >
        {isLoading ? "Generating..." : "Test Mode"}
      </Button>
      <Button 
        onClick={() => handleSendEvent(false)}
        disabled={isLoading}
        className="flex-1"
      >
        {isLoading ? "Sending..." : "Send to Orb"}
      </Button>
    </div>
  );
}