"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { sendManualEvent } from "@/app/actions/orb"
import { CLOUD_INFRA_TEMPLATE } from "@/lib/events/event-templates"
import type { SendEventResult } from "@/lib/events/types"
import { toast } from "sonner"

interface CloudInfraEventsFormProps {
  customerId: string;
  instance: 'cloud-infra';
  onResult: (result: SendEventResult) => void;
}

export function CloudInfraEventsForm({ customerId, instance, onResult }: CloudInfraEventsFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [manualProperties, setManualProperties] = useState<Record<string, string | number>>({});

  const handlePropertyChange = (key: string, value: string | number) => {
    setManualProperties(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSendEvent = async (testMode: boolean = false) => {
    setIsLoading(true);
    try {
      const result = await sendManualEvent(customerId, instance, manualProperties, undefined, testMode);
      onResult(result);
      
      if (result.success) {
        toast.success(
          testMode 
            ? "Network request event generated successfully!" 
            : "Network request event sent to Orb successfully!"
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
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="bandwidth_bytes">Bandwidth (bytes)</Label>
        <Input
          id="bandwidth_bytes"
          type="number"
          min={CLOUD_INFRA_TEMPLATE.properties.bandwidth_bytes.min}
          max={CLOUD_INFRA_TEMPLATE.properties.bandwidth_bytes.max}
          placeholder={`${CLOUD_INFRA_TEMPLATE.properties.bandwidth_bytes.min}-${CLOUD_INFRA_TEMPLATE.properties.bandwidth_bytes.max}`}
          value={manualProperties.bandwidth_bytes || ''}
          onChange={(e) => handlePropertyChange('bandwidth_bytes', Number(e.target.value))}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="runtime">Runtime</Label>
        <Select 
          value={manualProperties.runtime as string || ''} 
          onValueChange={(value) => handlePropertyChange('runtime', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select runtime..." />
          </SelectTrigger>
          <SelectContent>
            {CLOUD_INFRA_TEMPLATE.properties.runtime.options?.map(runtime => (
              <SelectItem key={runtime} value={runtime}>{runtime}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-3 pt-2">
        <Button 
          onClick={() => handleSendEvent(true)}
          disabled={isLoading}
          variant="outline"
          className="flex-1"
        >
          {isLoading ? "Generating..." : "Test Event"}
        </Button>
        <Button 
          onClick={() => handleSendEvent(false)}
          disabled={isLoading}
          className="flex-1"
        >
          {isLoading ? "Sending..." : "Send Event"}
        </Button>
      </div>
    </div>
  );
}