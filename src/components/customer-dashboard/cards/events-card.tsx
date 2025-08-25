"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useCustomerStore } from "@/lib/store/customer-store"
import type { SendEventResult } from "@/lib/events/types"
import type { Subscription } from "@/lib/types"
import { AiAgentsEventsForm } from "./events/ai-agents-events-form"
import { CloudInfraEventsForm } from "./events/cloud-infra-events-form"
import { GenericEventsForm } from "./events/generic-events-form"

interface EventsCardProps {
  customerId: string;
  subscription?: Subscription | null;
}

export function EventsCard({ customerId, subscription }: EventsCardProps) {
  const [lastResult, setLastResult] = useState<SendEventResult | null>(null);
  
  // Get instance from store
  const instance = useCustomerStore((state) => state.selectedInstance);
  
  // Don't render if no instance is selected
  if (!instance) {
    return (
      <div className="flex justify-center">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <CardTitle>Event Ingestion</CardTitle>
            <CardDescription>
              Please select an instance to send events.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const handleResult = (result: SendEventResult) => {
    setLastResult(result);
  };

  const renderEventForm = () => {
    switch (instance) {
      case 'ai-agents':
        return (
          <AiAgentsEventsForm
            customerId={customerId}
            instance={instance}
            subscription={subscription}
            onResult={handleResult}
          />
        );
      case 'cloud-infra':
        return (
          <CloudInfraEventsForm
            customerId={customerId}
            instance={instance}
            onResult={handleResult}
          />
        );
      default:
        return (
          <GenericEventsForm
            customerId={customerId}
            instance={instance}
            onResult={handleResult}
          />
        );
    }
  };

  return (
    <div className="flex justify-center">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle>Event Ingestion</CardTitle>
          <CardDescription>
            Send events to Orb for the current customer using the {instance} instance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderEventForm()}

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
    </div>
  );
}