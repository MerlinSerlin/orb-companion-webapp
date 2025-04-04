"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Check } from "lucide-react"

interface PlanFeature {
  name: string
  value: string
}

interface PlanCardProps {
  name: string
  description: string
  price: string
  features: PlanFeature[]
  cta: string
  popular?: boolean
  onSelect: () => void
}

export function PlanCard({ name, description, price, features, cta, popular = false, onSelect }: PlanCardProps) {
  return (
    <Card className={`w-full max-w-sm flex flex-col ${popular ? "border-primary shadow-lg" : ""}`}>
      {popular && (
        <div className="bg-primary text-primary-foreground text-center py-1 text-sm font-medium">Most Popular</div>
      )}
      <CardHeader>
        <CardTitle className="text-2xl">{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <div className="mt-4">
          <span className="text-4xl font-bold">{price}</span>
          <span className="text-muted-foreground ml-1">/month</span>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <div className="mr-2 mt-1">
                <Check className="h-4 w-4 text-primary" />
              </div>
              <div>
                <span className="font-medium">{feature.name}: </span>
                {feature.value}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button onClick={onSelect} className="w-full" variant={popular ? "default" : "outline"}>
          {cta}
        </Button>
      </CardFooter>
    </Card>
  )
}

