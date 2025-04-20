"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { CodeBlock } from "@/components/ui/code-block"
import { Info, Copy, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

type JsonValue = string | number | boolean | null | { [key: string]: JsonValue } | JsonValue[];

interface ApiPreviewDialogProps {
  // The API payload to display
  payload: Record<string, JsonValue>
  // Sample response (optional)
  response?: Record<string, JsonValue>
  // API endpoint information
  endpoint?: string
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH"
  // Dialog title and description
  title?: string
  description?: string
  // Button customization
  buttonVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  buttonSize?: "default" | "sm" | "lg" | "icon"
  buttonText?: string
  className?: string
  // Height of the code preview area (default: 400px)
  codeHeight?: number
}

export function ApiPreviewDialog({ 
  payload,
  response,
  endpoint = "",
  method = "POST",
  title = "API Payload Preview",
  description = "This is what will be sent to the API endpoint.",
  buttonVariant = "outline",
  buttonSize = "sm",
  buttonText = "Preview API Call",
  className,
  codeHeight = 400
}: ApiPreviewDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  
  const fullRequest = endpoint 
    ? {
        url: endpoint,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR_API_KEY'
        },
        body: payload
      }
    : payload

  const copyToClipboard = async (content: Record<string, JsonValue> | JsonValue) => {
    await navigator.clipboard.writeText(
      typeof content === 'string' 
        ? content 
        : JSON.stringify(content, null, 2)
    )
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={buttonVariant} 
          size={buttonSize}
          className={cn("gap-1.5", className)}
        >
          <Info className="h-4 w-4" />
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
            {endpoint && (
              <span className="mt-2 flex items-center">
                <span className={cn(
                  "px-2 py-1 text-xs font-bold rounded mr-2",
                  method === "GET" ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" :
                  method === "POST" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" :
                  method === "PUT" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300" :
                  method === "DELETE" ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" :
                  "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                )}>
                  {method}
                </span>
                <code className="text-sm font-mono">{endpoint}</code>
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="relative mt-4">
          <Button
            size="sm"
            variant="ghost"
            className="absolute right-0 top-0 z-10 h-8 w-8 p-0 mr-2 mt-2"
            onClick={() => copyToClipboard(response ? fullRequest : fullRequest)}
            aria-label="Copy code"
          >
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
          
          {response ? (
            <Tabs defaultValue="request">
              <TabsList>
                <TabsTrigger value="request">
                  Request
                </TabsTrigger>
                <TabsTrigger value="response">
                  Response
                </TabsTrigger>
              </TabsList>
              <div className="mt-2 border rounded-md relative" style={{ height: `${codeHeight}px` }}>
                <TabsContent value="request" className="m-0 h-full">
                  <div className="overflow-auto h-full">
                    <CodeBlock 
                      code={fullRequest} 
                      language="json"
                      className="border-0"
                    />
                  </div>
                </TabsContent>
                <TabsContent value="response" className="m-0 h-full">
                  <div className="overflow-auto h-full">
                    <CodeBlock 
                      code={response} 
                      language="json"
                      className="border-0"
                    />
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          ) : (
            <div className="border rounded-md" style={{ height: `${codeHeight}px` }}>
              <div className="overflow-auto h-full">
                <CodeBlock 
                  code={fullRequest} 
                  language="json"
                  className="border-0"
                />
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 