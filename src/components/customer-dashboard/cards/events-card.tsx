"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { sendRandomizedEvent } from "@/app/actions/orb"
import type { OrbInstance } from "@/lib/orb-config"
import type { SendEventResult } from "@/lib/events/types"
import { toast } from "sonner"

interface EventsCardProps {
  customerId: string;
  instance: OrbInstance;
}

export function EventsCard({ customerId, instance }: EventsCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<SendEventResult | null>(null);

  const handleSendEvent = async (testMode: boolean = false) => {
    setIsLoading(true);
    try {
      const result = await sendRandomizedEvent(customerId, instance, undefined, testMode);
      setLastResult(result);
      
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
    <Card>
      <CardHeader>
        <CardTitle>Event Ingestion</CardTitle>
        <CardDescription>
          Send events to Orb for the current customer using the {instance} instance.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-4">
          <Button 
            onClick={() => handleSendEvent(true)}
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? "Generating..." : "Test Mode"}
          </Button>
          <Button 
            onClick={() => handleSendEvent(false)}
            disabled={isLoading}
          >
            {isLoading ? "Sending..." : "Send to Orb"}
          </Button>
        </div>

        {lastResult && (
          <div className="mt-4">
            <p className="text-sm font-medium mb-2">
              {lastResult.success ? "✅ Success!" : "❌ Error"}
            </p>
            
            {lastResult.error && (
              <p className="text-sm text-red-600 mb-2">{lastResult.error}</p>
            )}
            
            {lastResult.event && (
              <div>
                <p className="text-sm font-medium mb-1">Generated Event:</p>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                  {JSON.stringify(lastResult.event, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}