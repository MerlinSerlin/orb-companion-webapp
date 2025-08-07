"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select"
import { sendRandomizedEvent, sendManualEvent } from "@/app/actions/orb"
import type { OrbInstance } from "@/lib/orb-config"
import type { SendEventResult } from "@/lib/events/types"
import type { Subscription } from "@/lib/types"
import { AI_AGENTS_TEMPLATE } from "@/lib/events/event-templates"
import { usePremiumModelAccess } from "@/hooks/usePremiumModelAccess"
import { toast } from "sonner"

interface EventsCardProps {
  customerId: string;
  instance: OrbInstance;
  subscription?: Subscription | null;
}

export function EventsCard({ customerId, instance, subscription }: EventsCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<SendEventResult | null>(null);
  
  // Manual event form state
  const [manualProperties, setManualProperties] = useState<Record<string, string | number>>({});
  
  // Check if this is the AI agents instance to show manual controls
  const isAiAgentsInstance = instance === 'ai-agents';
  
  // Get all available models for this instance
  const allModels = AI_AGENTS_TEMPLATE.properties.model.options || [];
  
  // Get premium model access information
  const modelAccess = usePremiumModelAccess(subscription, instance, allModels);

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

  const handleSendManualEvent = async (testMode: boolean = false) => {
    setIsLoading(true);
    try {
      const result = await sendManualEvent(customerId, instance, manualProperties, undefined, testMode);
      setLastResult(result);
      
      if (result.success) {
        toast.success(
          testMode 
            ? "Custom event generated successfully!" 
            : "Custom event sent to Orb successfully!"
        );
      } else {
        toast.error(`Failed to send custom event: ${result.error}`);
      }
    } catch (error) {
      console.error('Error sending custom event:', error);
      toast.error('Unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePropertyChange = (key: string, value: string | number) => {
    setManualProperties(prev => ({
      ...prev,
      [key]: value
    }));
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
          {isAiAgentsInstance ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                {modelAccess.isLoading ? (
                  <Skeleton className="h-9 w-full" />
                ) : modelAccess.error ? (
                  <div className="p-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
                    {modelAccess.error}
                  </div>
                ) : (
                  <Select 
                    value={manualProperties.model as string || ''} 
                    onValueChange={(value) => handlePropertyChange('model', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select model..." />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Standard models - always available */}
                      {modelAccess.standardModels.length > 0 && (
                        <SelectGroup>
                          <SelectLabel>Standard Models</SelectLabel>
                          {modelAccess.standardModels.map(model => (
                            <SelectItem key={model} value={model}>
                              {model}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      )}
                      
                      {/* Premium models - available or restricted */}
                      {modelAccess.premiumModels.length > 0 && (
                        <SelectGroup>
                          <SelectLabel>Premium Models</SelectLabel>
                          {modelAccess.premiumModels.map(model => (
                            <SelectItem 
                              key={model} 
                              value={model}
                              disabled={!modelAccess.hasAccess}
                              className={!modelAccess.hasAccess ? "text-muted-foreground" : ""}
                            >
                              {model}{!modelAccess.hasAccess ? " (Upgrade Required)" : ""}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      )}
                    </SelectContent>
                  </Select>
                )}
                
                {/* Show upgrade message for restricted premium models */}
                {!modelAccess.isLoading && !modelAccess.error && !modelAccess.hasAccess && modelAccess.premiumModels.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Add Premium Models to your subscription or upgrade your plan to access {modelAccess.premiumModels.join(", ")}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="user_id">User</Label>
                <Select 
                  value={manualProperties.user_id as string || ''} 
                  onValueChange={(value) => handlePropertyChange('user_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select user..." />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_AGENTS_TEMPLATE.properties.user_id.options?.map(user => (
                      <SelectItem key={user} value={user}>{user}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="num_steps">Number of Steps</Label>
                <Input
                  id="num_steps"
                  type="number"
                  min={AI_AGENTS_TEMPLATE.properties.num_steps.min}
                  max={AI_AGENTS_TEMPLATE.properties.num_steps.max}
                  placeholder={`${AI_AGENTS_TEMPLATE.properties.num_steps.min}-${AI_AGENTS_TEMPLATE.properties.num_steps.max}`}
                  value={manualProperties.num_steps || ''}
                  onChange={(e) => handlePropertyChange('num_steps', Number(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="num_tokens">Number of Tokens</Label>
                <Input
                  id="num_tokens"
                  type="number"
                  min={AI_AGENTS_TEMPLATE.properties.num_tokens.min}
                  max={AI_AGENTS_TEMPLATE.properties.num_tokens.max}
                  placeholder={`${AI_AGENTS_TEMPLATE.properties.num_tokens.min}-${AI_AGENTS_TEMPLATE.properties.num_tokens.max}`}
                  value={manualProperties.num_tokens || ''}
                  onChange={(e) => handlePropertyChange('num_tokens', Number(e.target.value))}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button 
                  onClick={() => handleSendManualEvent(true)}
                  disabled={isLoading}
                  variant="outline"
                  className="flex-1"
                >
                  {isLoading ? "Generating..." : "Test Event"}
                </Button>
                <Button 
                  onClick={() => handleSendManualEvent(false)}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? "Sending..." : "Send Event"}
                </Button>
              </div>
            </div>
          ) : (
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
          )}

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