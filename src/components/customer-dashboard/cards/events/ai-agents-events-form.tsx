"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select"
import { sendManualEvent } from "@/app/actions/orb"
import { AI_AGENTS_TEMPLATE } from "@/lib/events/event-templates"
import { usePremiumModelAccess } from "@/hooks/usePremiumModelAccess"
import type { SendEventResult } from "@/lib/events/types"
import type { Subscription } from "@/lib/types"
import { toast } from "sonner"

interface AiAgentsEventsFormProps {
  customerId: string;
  instance: 'ai-agents';
  subscription?: Subscription | null;
  onResult: (result: SendEventResult) => void;
}

export function AiAgentsEventsForm({ customerId, instance, subscription, onResult }: AiAgentsEventsFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [manualProperties, setManualProperties] = useState<Record<string, string | number>>({});

  // Get all available models for this instance
  const allModels = AI_AGENTS_TEMPLATE.properties.model.options || [];
  
  // Get premium model access information
  const modelAccess = usePremiumModelAccess(subscription, instance, allModels);

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
            ? "AI agent event generated successfully!" 
            : "AI agent event sent to Orb successfully!"
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