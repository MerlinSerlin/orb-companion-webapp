"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, Sparkles } from "lucide-react"
import type { ReactNode } from "react"

interface PlanFeature {
  name: string
  value: string
}

interface PlanCardProps {
  name: string
  description: string
  price: string
  features: PlanFeature[]
  cta: ReactNode // Changed from string to ReactNode
  popular?: boolean
  onSelect: () => void
  disabled?: boolean
}

export function PlanCard({
  name,
  description,
  price,
  features,
  cta,
  popular = false,
  onSelect,
  disabled = false,
}: PlanCardProps) {
  return (
    <Card
      className={`w-full max-w-sm flex flex-col relative overflow-hidden group transition-transform duration-300 hover:scale-[1.02] ${
        popular ? "border-primary shadow-lg" : ""
      }`}
    >
      {popular && (
        <div className="bg-primary text-primary-foreground text-center py-1.5 text-sm font-medium flex items-center justify-center gap-1">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Most Popular</span>
          <Sparkles className="h-3.5 w-3.5" />
        </div>
      )}

      <CardHeader>
        <CardTitle className="text-2xl">{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <div className="mt-4">
          {price && (
            <>
              <span className="text-4xl font-bold">{price}</span>
              <span className="text-muted-foreground ml-1">/month</span>
            </>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-grow">
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <div className="mr-2 mt-1 text-primary bg-primary/10 rounded-full p-0.5">
                <Check className="h-3.5 w-3.5" />
              </div>
              <div>
                <span className="font-medium">{feature.name}{feature.value ? ': ' : ''}</span>
                {feature.value}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        <Button
          onClick={onSelect}
          className={`w-full relative z-10 ${popular ? "bg-primary hover:bg-primary/90" : "bg-primary/10 hover:bg-primary/20 text-primary hover:text-primary"}`}
          variant={popular ? "default" : "ghost"}
          disabled={disabled}
        >
          {cta}
        </Button>
      </CardFooter>
    </Card>
  )
}



